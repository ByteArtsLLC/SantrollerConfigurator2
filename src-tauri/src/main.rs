// Release builds on Windows run as a GUI app, without a console window next to it.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    santroller_configurator_lib::run();
}
