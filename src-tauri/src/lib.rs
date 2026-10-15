// The desktop app runs the same frontend as santroller.com, but the system webviews don't have
// WebHID, so the frontend talks to devices through these commands instead (see src/desktop).
use std::{
    collections::HashMap,
    ffi::CString,
    path::PathBuf,
    sync::{
        atomic::{AtomicBool, AtomicU64, Ordering},
        mpsc::{self, Receiver, Sender, TryRecvError},
        Mutex,
    },
    thread,
};

use futures_lite::StreamExt;
use hidapi::{HidApi, HidDevice};
use nusb::hotplug::HotplugEvent;
use serde::Serialize;
use tauri::{ipc::Request, AppHandle, Emitter, Manager, State, Url};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_opener::OpenerExt;

// Big enough for any report, the report id in front of it, and any report descriptor
const BUFFER_SIZE: usize = 4096;
// How long the worker waits for an input report before it checks for commands again
const READ_TIMEOUT_MS: i32 = 1;
// Only Santroller devices are listed. On Windows, hidapi asks every device it lists for its
// strings, which makes some mice and keyboards stutter.
const SANTROLLER_VID: u16 = 0x1209;
const SANTROLLER_PID: u16 = 0x2882;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct HidDeviceInfo {
    path: String,
    vendor_id: u16,
    product_id: u16,
    product_name: Option<String>,
    serial_number: Option<String>,
    usage_page: u16,
    usage: u16,
}

#[derive(Clone, Serialize)]
struct HidInput {
    path: String,
    // As read, so with the report id in front for devices that number their reports
    data: Vec<u8>,
}

#[derive(Clone, Serialize)]
struct HidClosed {
    path: String,
    error: String,
}

enum Command {
    Write {
        report: Vec<u8>,
        done: Sender<Result<(), String>>,
    },
    SendFeatureReport {
        report: Vec<u8>,
        done: Sender<Result<(), String>>,
    },
    GetFeatureReport {
        report_id: u8,
        length: usize,
        done: Sender<Result<Vec<u8>, String>>,
    },
    Close,
}

struct OpenDevice {
    id: u64,
    commands: Sender<Command>,
}

#[derive(Default)]
struct HidState {
    api: Mutex<Option<HidApi>>,
    devices: Mutex<HashMap<String, OpenDevice>>,
    watching: AtomicBool,
    next_id: AtomicU64,
}

fn with_api<T>(
    state: &HidState,
    f: impl FnOnce(&mut HidApi) -> Result<T, String>,
) -> Result<T, String> {
    let mut api = state.api.lock().map_err(|e| e.to_string())?;
    if api.is_none() {
        HidApi::disable_device_discovery();
        *api = Some(HidApi::new().map_err(|e| e.to_string())?);
    }
    f(api.as_mut().unwrap())
}

fn handle_command(device: &HidDevice, command: Command) {
    match command {
        Command::Write { report, done } => {
            let _ = done.send(device.write(&report).map(|_| ()).map_err(|e| e.to_string()));
        }
        Command::SendFeatureReport { report, done } => {
            let _ = done.send(device.send_feature_report(&report).map_err(|e| e.to_string()));
        }
        Command::GetFeatureReport {
            report_id,
            length,
            done,
        } => {
            let mut report = vec![0; length.clamp(2, BUFFER_SIZE)];
            report[0] = report_id;
            let result = device
                .get_feature_report(&mut report)
                .map(|read| {
                    report.truncate(read);
                    report
                })
                .map_err(|e| e.to_string());
            let _ = done.send(result);
        }
        Command::Close => {}
    }
}

// Owns the device, so reads and writes never happen at the same time
fn run_worker(app: AppHandle, path: String, id: u64, device: HidDevice, commands: Receiver<Command>) {
    let mut buf = vec![0; BUFFER_SIZE];
    let error = loop {
        match commands.try_recv() {
            Ok(Command::Close) | Err(TryRecvError::Disconnected) => break None,
            Ok(command) => {
                handle_command(&device, command);
                continue;
            }
            Err(TryRecvError::Empty) => {}
        }
        match device.read_timeout(&mut buf, READ_TIMEOUT_MS) {
            Ok(0) => {}
            Ok(read) => {
                let _ = app.emit(
                    "hid-input",
                    HidInput {
                        path: path.clone(),
                        data: buf[..read].to_vec(),
                    },
                );
            }
            // usually the device was unplugged or rebooted
            Err(e) => break Some(e.to_string()),
        }
    };
    if let Some(state) = app.try_state::<HidState>() {
        if let Ok(mut devices) = state.devices.lock() {
            // it may have been opened again since
            if devices.get(&path).is_some_and(|open| open.id == id) {
                devices.remove(&path);
            }
        }
    }
    if let Some(error) = error {
        let _ = app.emit("hid-closed", HidClosed { path, error });
    }
}

#[tauri::command]
fn hid_list(state: State<'_, HidState>) -> Result<Vec<HidDeviceInfo>, String> {
    with_api(&state, |api| {
        api.reset_devices().map_err(|e| e.to_string())?;
        api.add_devices(SANTROLLER_VID, SANTROLLER_PID).map_err(|e| e.to_string())?;
        Ok(api
            .device_list()
            .map(|device| HidDeviceInfo {
                path: device.path().to_string_lossy().into_owned(),
                vendor_id: device.vendor_id(),
                product_id: device.product_id(),
                product_name: device.product_string().map(str::to_owned),
                serial_number: device.serial_number().map(str::to_owned),
                usage_page: device.usage_page(),
                usage: device.usage(),
            })
            .collect())
    })
}

// Tells the frontend to look at the device list again when a Santroller is plugged in, or when
// anything is unplugged (only the device's id is known by then). The USB device shows up before
// its HID interface does, so the frontend has to keep looking for a little while.
#[tauri::command]
fn hid_watch(app: AppHandle, state: State<'_, HidState>) -> Result<(), String> {
    if state.watching.swap(true, Ordering::Relaxed) {
        return Ok(());
    }
    let mut watch = match nusb::watch_devices() {
        Ok(watch) => watch,
        Err(e) => {
            state.watching.store(false, Ordering::Relaxed);
            return Err(e.to_string());
        }
    };
    tauri::async_runtime::spawn(async move {
        while let Some(event) = watch.next().await {
            let changed = match event {
                HotplugEvent::Connected(info) => {
                    info.vendor_id() == SANTROLLER_VID && info.product_id() == SANTROLLER_PID
                }
                HotplugEvent::Disconnected(_) => true,
            };
            if changed {
                let _ = app.emit("hid-changed", ());
            }
        }
    });
    Ok(())
}

// Returns the report descriptor, as the frontend needs to know which reports the device has
#[tauri::command]
async fn hid_open(
    app: AppHandle,
    state: State<'_, HidState>,
    path: String,
) -> Result<Vec<u8>, String> {
    if let Some(open) = state.devices.lock().map_err(|e| e.to_string())?.remove(&path) {
        let _ = open.commands.send(Command::Close);
    }
    let c_path = CString::new(path.as_bytes()).map_err(|e| e.to_string())?;
    let device = with_api(&state, |api| {
        api.open_path(c_path.as_c_str()).map_err(|e| e.to_string())
    })?;
    let mut descriptor = vec![0; BUFFER_SIZE];
    let length = device
        .get_report_descriptor(&mut descriptor)
        .map_err(|e| e.to_string())?;
    descriptor.truncate(length);

    let id = state.next_id.fetch_add(1, Ordering::Relaxed);
    let (commands, receiver) = mpsc::channel();
    state
        .devices
        .lock()
        .map_err(|e| e.to_string())?
        .insert(path.clone(), OpenDevice { id, commands });
    clear_windows_controller_cache_internal(SANTROLLER_VID, SANTROLLER_PID);
    thread::spawn(move || run_worker(app, path, id, device, receiver));
    Ok(descriptor)
}

#[tauri::command]
fn hid_close(state: State<'_, HidState>, path: String) -> Result<(), String> {
    if let Some(open) = state.devices.lock().map_err(|e| e.to_string())?.remove(&path) {
        let _ = open.commands.send(Command::Close);
    }
    Ok(())
}

// Hands the command to the device's worker and waits for it off the async runtime, so a slow
// device doesn't hold up other commands
async fn send_command<T: Send + 'static>(
    state: State<'_, HidState>,
    path: &str,
    create: impl FnOnce(Sender<Result<T, String>>) -> Command,
) -> Result<T, String> {
    let commands = state
        .devices
        .lock()
        .map_err(|e| e.to_string())?
        .get(path)
        .map(|open| open.commands.clone())
        .ok_or_else(|| "The device is not open".to_owned())?;
    let (done, result) = mpsc::channel();
    commands
        .send(create(done))
        .map_err(|_| "The device was closed".to_owned())?;
    tauri::async_runtime::spawn_blocking(move || {
        result
            .recv()
            .map_err(|_| "The device was closed".to_owned())?
    })
    .await
    .map_err(|e| e.to_string())?
}

fn with_report_id(report_id: u8, data: Vec<u8>) -> Vec<u8> {
    let mut report = Vec::with_capacity(data.len() + 1);
    report.push(report_id);
    report.extend(data);
    report
}

#[tauri::command]
async fn hid_send_report(
    state: State<'_, HidState>,
    path: String,
    report_id: u8,
    data: Vec<u8>,
) -> Result<(), String> {
    let report = with_report_id(report_id, data);
    send_command(state, &path, |done| Command::Write { report, done }).await
}

#[tauri::command]
async fn hid_send_feature_report(
    state: State<'_, HidState>,
    path: String,
    report_id: u8,
    data: Vec<u8>,
) -> Result<(), String> {
    let report = with_report_id(report_id, data);
    send_command(state, &path, |done| Command::SendFeatureReport { report, done }).await
}

// The report comes back with the report id in front of it, the same as WebHID
#[tauri::command]
async fn hid_receive_feature_report(
    state: State<'_, HidState>,
    path: String,
    report_id: u8,
    length: usize,
) -> Result<Vec<u8>, String> {
    send_command(state, &path, |done| Command::GetFeatureReport {
        report_id,
        length,
        done,
    })
    .await
}

#[cfg(target_os = "windows")]
fn clear_windows_controller_cache_internal(vid: u16, pid: u16) {
    use winreg::enums::*;
    use winreg::RegKey;

    let device_key = format!("VID_{:04X}&PID_{:04X}", vid, pid);
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);

    // 1. Clear OEM Properties (OEMName, OEMData)
    let oem_path = format!(
        r"System\CurrentControlSet\Control\MediaProperties\PrivateProperties\Joystick\OEM\{}",
        device_key
    );
    let _ = hkcu.delete_subkey_all(&oem_path);

    // 2. Clear DirectInput Calibration
    let di_path = format!(
        r"System\CurrentControlSet\Control\MediaProperties\PrivateProperties\DirectInput\{}",
        device_key
    );
    let _ = hkcu.delete_subkey_all(&di_path);

    // 3. Clean up any slot assignments in CurrentJoystickSettings
    if let Ok(settings) = hkcu.open_subkey_with_flags(
        r"System\CurrentControlSet\Control\MediaResources\Joystick\DINPUT.DLL\CurrentJoystickSettings",
        KEY_READ | KEY_WRITE,
    ) {
        let to_delete: Vec<String> = settings
            .enum_values()
            .filter_map(|val| val.ok())
            .filter_map(|(name, _)| {
                if let Ok(s) = settings.get_value::<String, _>(&name) {
                    if s.contains(&device_key) {
                        return Some(name);
                    }
                }
                None
            })
            .collect();

        for name in to_delete {
            let _ = settings.delete_value(&name);
            if name.ends_with("OEMName") {
                let config_name = name.replace("OEMName", "Configuration");
                let _ = settings.delete_value(&config_name);
            }
        }
    }
}

#[cfg(not(target_os = "windows"))]
fn clear_windows_controller_cache_internal(_vid: u16, _pid: u16) {}

#[tauri::command]
async fn clear_windows_controller_cache(
    vid: Option<u16>,
    pid: Option<u16>,
) -> Result<(), String> {
    let vid = vid.unwrap_or(SANTROLLER_VID);
    let pid = pid.unwrap_or(SANTROLLER_PID);
    clear_windows_controller_cache_internal(vid, pid);
    Ok(())
}

// The webviews can't download files, so the frontend sends what it would have downloaded here.
// The body is the file, and the x-file-name header what to call it.
#[tauri::command]
async fn save_file(app: AppHandle, request: Request<'_>) -> Result<bool, String> {
    let tauri::ipc::InvokeBody::Raw(data) = request.body() else {
        return Err("Expected the file as the request body".to_owned());
    };
    let name = request
        .headers()
        .get("x-file-name")
        .and_then(|name| name.to_str().ok())
        .unwrap_or("download")
        .to_owned();
    let mut dialog = app.dialog().file().set_file_name(&name);
    if let Some(extension) = PathBuf::from(&name).extension().and_then(|e| e.to_str()) {
        dialog = dialog.add_filter(extension.to_uppercase(), &[extension]);
    }
    let Some(target) = dialog.blocking_save_file() else {
        return Ok(false);
    };
    let target = target.into_path().map_err(|e| e.to_string())?;
    std::fs::write(target, data).map_err(|e| e.to_string())?;
    Ok(true)
}

fn is_app_url(url: &Url) -> bool {
    matches!(url.scheme(), "tauri" | "asset")
        || matches!(url.host_str(), Some("localhost" | "tauri.localhost" | "127.0.0.1"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        // Anything outside the app (links, the github login) opens in the browser instead of
        // replacing the app in its window
        .plugin(
            tauri::plugin::Builder::<tauri::Wry>::new("external-links")
                .on_navigation(|webview, url| {
                    if is_app_url(url) {
                        return true;
                    }
                    let _ = webview.opener().open_url(url.as_str(), None::<&str>);
                    false
                })
                .build(),
        )
        .manage(HidState::default())
        .invoke_handler(tauri::generate_handler![
            hid_list,
            hid_watch,
            hid_open,
            hid_close,
            hid_send_report,
            hid_send_feature_report,
            hid_receive_feature_report,
            save_file,
            clear_windows_controller_cache,
        ])
        .run(tauri::generate_context!())
        .expect("failed to run the Santroller Configurator");
}
