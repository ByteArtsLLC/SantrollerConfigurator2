import { proto } from '@/components/SettingsContext/config';
import {
  ConvertedInput,
  enabledChildren,
  INT16_OFFSET,
  LegacyImportContext,
  setI2c,
  setSpi,
} from '../context';
import { convertInput, mpr121Device } from '../inputs';
import { legacy } from '../legacy';
import { LegacyOutputKind, registerOutputConverters } from '../outputs';

// LEDs, GPIO outputs, console mode bindings and config level settings (bluetooth, sleep, battery)
//
// The binding converters below only collect things. After every binding has been converted, the
// integrator calls convertLedsModesSettings, which adds the LEDs to ctx.leds and returns the
// profile's assignments and the config's inactivity settings.

const LT = legacy.LedType;
const LC = legacy.LedCommandType;
const EM = legacy.EmulationModeType;
const CM = proto.ConsoleMode;

interface PendingMode {
  mode: proto.ConsoleMode;
  trigger: proto.IInputActivationTrigger;
}

interface State {
  commandLeds: legacy.ISerializedLed[];
  modes: PendingMode[];
  // Inputs that started the Fortnite Festival keyboard mode
  festival: proto.IInputActivationTrigger[];
  // Inputs that toggled Fortnite Festival gameplay mode at any time
  festivalToggles: proto.IInput[];
}

const states = new WeakMap<LegacyImportContext, State>();

function state(ctx: LegacyImportContext): State {
  let current = states.get(ctx);
  if (!current) {
    current = { commandLeds: [], modes: [], festival: [], festivalToggles: [] };
    states.set(ctx, current);
  }
  return current;
}

// ---------------------------------------------------------------------------
// LED hardware
// ---------------------------------------------------------------------------

interface LedHardware {
  deviceid: number;
  kind: 'rgb' | 'stp16';
  count: number;
  // brightness for the on and off colours
  onW: number;
  offW: number;
}

function isApa102(type: legacy.LedType) {
  return type >= LT.LedType_Apa102Rgb && type <= LT.LedType_Apa102Bgr;
}

function isWs2812(type: legacy.LedType) {
  return type >= LT.LedType_Ws2812Rgb && type <= LT.LedType_Ws2812Bgrw;
}

// The LED chain on the main Pico, or undefined if there isn't one
function ledHardware(ctx: LegacyImportContext): LedHardware | undefined {
  const old = ctx.old;
  const type = old.ledType ?? LT.LedType_None;
  const count = Math.max(1, old.ledCount ?? 0);
  if (isApa102(type)) {
    const deviceid = ctx.addDevice('apa102', 'main', (dev) => {
      setSpi(dev.spi, old.ledMosi, -1, old.ledSck);
      // The old and new APA102 orders are numbered the same way
      dev.type = type as number as proto.APA102Type;
      dev.count = count;
    });
    return { deviceid, kind: 'rgb', count, ...brightness(old) };
  }
  if (isWs2812(type)) {
    const deviceid = ctx.addDevice('ws2812', 'main', (dev) => {
      dev.pin = old.ledMosi ?? -1;
      dev.type = (type - LT.LedType_Ws2812Rgb + proto.WS2812Type.Ws2812Rgb) as proto.WS2812Type;
      dev.count = count;
    });
    // WS2812s had no brightness setting
    return { deviceid, kind: 'rgb', count, onW: 255, offW: 255 };
  }
  if (type === LT.LedType_Stp16Cpc26) {
    const deviceid = ctx.addDevice('stp16cpc', 'main', (dev) => {
      setSpi(dev.spi, old.ledMosi, -1, old.ledSck);
      dev.oe = old.stp16Oe ?? -1;
      dev.le = old.stp16Le ?? -1;
      dev.count = count;
    });
    return { deviceid, kind: 'stp16', count, onW: 255, offW: 255 };
  }
  return undefined;
}

// Old APA102 brightness was 1 - 31 (the chip's 5 bit global brightness, unset meaning full), the
// new one is 0 - 255 and the firmware sends its top 5 bits
function brightness(old: legacy.SerializedConfiguration) {
  const scale = (value: number | null | undefined) =>
    Math.round(((!value || value > 31 ? 31 : value) * 255) / 31);
  return { onW: scale(old.ledBrightnessOn), offW: scale(old.ledBrightnessOff) };
}

function colour(argb: number | null | undefined) {
  const c = (argb ?? 0) >>> 0;
  return { r: (c >>> 16) & 0xff, g: (c >>> 8) & 0xff, b: c & 0xff };
}

// Old LED indices start at 1, new ones at 0
function ledIndices(indices: Uint8Array | null | undefined, count: number) {
  return [...new Set(indices ?? [])].filter((i) => i >= 1 && i <= count).map((i) => i - 1);
}

function rgbDevice(
  hw: LedHardware,
  activeLed: number[],
  on: number | null | undefined,
  off: number | null | undefined,
  hasStart: boolean
): proto.ILedDevice {
  const start = colour(off);
  const end = colour(on);
  return {
    rgb: {
      deviceId: hw.deviceid,
      activeLed,
      startR: start.r,
      startG: start.g,
      startB: start.b,
      startW: hw.offW,
      endR: end.r,
      endG: end.g,
      endB: end.b,
      endW: hw.onW,
      hasStart,
    },
  };
}

interface LedTargets {
  ledOn?: number | null;
  ledOff?: number | null;
  ledIndex?: Uint8Array | null;
  ledIndexPeripheral?: Uint8Array | null;
  ledIndexMpr121?: Uint8Array | null;
}

// The LEDs on the secondary Pico can't be driven by the new firmware
function warnPeripheralLeds(ctx: LegacyImportContext, indices: Uint8Array | null | undefined) {
  if (indices?.length && (ctx.old.ledTypePeripheral ?? LT.LedType_None) !== LT.LedType_None) {
    ctx.warn('legacyImport.peripheralLedsSkipped');
  }
}

// MPR121 electrodes 4 - 11 can be used as outputs, the old config stored the electrode number
function mpr121Pins(ctx: LegacyImportContext, indices: Uint8Array | null | undefined) {
  return [...new Set(indices ?? [])].filter((pin) => pin >= 4 && pin <= 11 && ctx.old.hasMpr121);
}

// ---------------------------------------------------------------------------
// LEDs and GPIO outputs driven by a binding's input
// ---------------------------------------------------------------------------

// The fields every old binding has for the LEDs and GPIO output it drives
interface BindingLedFields extends LedTargets {
  input?: legacy.ISerializedInput | null;
  outputEnabled?: boolean | null;
  outputPin?: number | null;
  outputInverted?: boolean | null;
  outputPeripheral?: boolean | null;
  enabled?: boolean | null;
  min?: number | null;
  max?: number | null;
  outputs?: legacy.ISerializedOutput[] | null;
  childrenEnabled?: Uint8Array | null;
}

// Bindings whose LEDs followed the (calibrated) axis value instead of a button state
const AXIS_KINDS = new Set<LegacyOutputKind>([
  'serializedControllerAxis',
  'serializedGuitarAxis',
  'serializedDrumAxis',
  'serializedDjAxis',
  'serializedProGuitarAxis',
  'serializedMouseAxis',
  'serializedPs3Axis',
  'serializedPianoKey',
]);

function bindingFields(binding: legacy.ISerializedOutput) {
  const kind = legacy.SerializedOutput.fromObject(binding).subtype as LegacyOutputKind | undefined;
  if (!kind) {
    return undefined;
  }
  return { kind, fields: (binding[kind] ?? {}) as BindingLedFields };
}

function drivesLeds(
  ctx: LegacyImportContext,
  hw: LedHardware | undefined,
  fields: BindingLedFields
) {
  return (
    (!!hw && !!fields.ledIndex?.length) ||
    mpr121Pins(ctx, fields.ledIndexMpr121).length > 0 ||
    !!fields.outputEnabled
  );
}

// The LED value range for a binding's input, or undefined if the new LEDs can't follow it
function inputRange(
  ctx: LegacyImportContext,
  binding: legacy.ISerializedOutput,
  kind: LegacyOutputKind,
  fields: BindingLedFields,
  converted: ConvertedInput
): [number, number] | undefined {
  if (converted.mapping?.trigger != null || (converted.analog && !AXIS_KINDS.has(kind))) {
    // LEDs read the raw input, so they can't switch at the threshold an analog button used
    ctx.warn('legacyImport.analogLedsSkipped');
    return undefined;
  }
  if (!converted.analog || converted.digitalToAnalog) {
    return [0, 65535];
  }
  // The old LEDs followed the axis after calibration, so use the same range the axis does. Taking it
  // from the axis mapping keeps any rescaling of the input the same as the axis.
  const axis = ctx.axisMappings.get(binding);
  if (axis && axis.mapping.min != null && axis.mapping.max != null) {
    const { min, max, deadzone } = axis.mapping;
    // A trigger stayed at 0 until it was past its deadzone, and so did its LEDs
    const dead = axis.trigger ? (deadzone ?? 0) : 0;
    const start = Math.max(0, Math.min(65535, min + (max >= min ? dead : -dead)));
    return start === max ? [0, 65535] : [start, max];
  }
  const offset = converted.isUint ? 0 : INT16_OFFSET;
  const clamp = (v: number) => Math.max(0, Math.min(65535, v + offset));
  const min = clamp(fields.min ?? (converted.isUint ? 0 : -32767));
  const max = clamp(fields.max ?? (converted.isUint ? 65535 : 32767));
  return min === max ? [0, 65535] : [min, max];
}

function inputMapping(
  converted: ConvertedInput,
  [min, max]: [number, number],
  inverted: boolean
): proto.ILedMapping {
  // Swapping the range turns the LED on when the input is released
  return {
    inputMapping: { input: converted.input, ...(inverted ? { min: max, max: min } : { min, max }) },
  };
}

function convertBindingLeds(
  ctx: LegacyImportContext,
  hw: LedHardware | undefined,
  binding: legacy.ISerializedOutput,
  claimed: Set<number>
) {
  const found = bindingFields(binding);
  if (!found) {
    return;
  }
  const { kind, fields } = found;
  if (kind === 'serializedLed' || fields.enabled === false) {
    return;
  }
  if (fields.outputs?.length) {
    convertCombinedLeds(ctx, hw, enabledChildren(fields), claimed);
    return;
  }
  warnPeripheralLeds(ctx, fields.ledIndexPeripheral);
  if (fields.outputEnabled && fields.outputPeripheral) {
    ctx.warn('legacyImport.peripheralOutputsSkipped');
  }
  if (!drivesLeds(ctx, hw, fields)) {
    return;
  }
  const converted = convertInput(ctx, fields.input);
  const range = converted && inputRange(ctx, binding, kind, fields, converted);
  if (!converted || !range) {
    return;
  }
  const inverted = !!converted.mapping?.inverted;
  const mapping = inputMapping(converted, range, inverted);

  if (hw?.kind === 'rgb') {
    const indices = ledIndices(fields.ledIndex, hw.count);
    // An LED shared by several bindings is only set back to its off colour by the first of them,
    // so the later ones still show while they are pressed
    const fresh = indices.filter((i) => !claimed.has(i));
    const shared = indices.filter((i) => claimed.has(i));
    fresh.forEach((i) => claimed.add(i));
    for (const [activeLed, hasStart] of [
      [fresh, true],
      [shared, false],
    ] as const) {
      if (activeLed.length) {
        ctx.leds.push({
          device: rgbDevice(hw, activeLed, fields.ledOn, fields.ledOff, hasStart),
          mapping,
        });
      }
    }
  } else if (hw?.kind === 'stp16') {
    const activeLed = ledIndices(fields.ledIndex, hw.count);
    if (activeLed.length) {
      ctx.leds.push({ device: { stp16: { deviceId: hw.deviceid, activeLed } }, mapping });
    }
  }
  for (const pin of mpr121Pins(ctx, fields.ledIndexMpr121)) {
    ctx.leds.push({ device: { mpr121: { deviceId: mpr121Device(ctx), pin } }, mapping });
  }
  const pin = fields.outputPin ?? -1;
  if (fields.outputEnabled && !fields.outputPeripheral && pin >= 0) {
    // Axes drove their output pin with PWM
    const analog = converted.analog && AXIS_KINDS.has(kind);
    ctx.leds.push({
      device: { gpio: { pin, analog } },
      mapping: inputMapping(converted, range, inverted !== !!fields.outputInverted),
    });
  }
}

function convertCombinedLeds(
  ctx: LegacyImportContext,
  hw: LedHardware | undefined,
  outputs: legacy.ISerializedOutput[],
  claimed: Set<number>
) {
  const needed = outputs.some((child) => {
    const found = bindingFields(child);
    return (
      !!found &&
      found.kind !== 'serializedLed' &&
      found.fields.enabled !== false &&
      (drivesLeds(ctx, hw, found.fields) || !!found.fields.ledIndexPeripheral?.length)
    );
  });
  if (!needed) {
    return;
  }
  const source = outputs
    .map((child) => ctx.combinedSources.get(child))
    .find((found) => found != null);
  if (!source) {
    // The combined output itself couldn't be imported, which was already warned about
    return;
  }
  const previous = ctx.combined;
  ctx.combined = source;
  for (const child of outputs) {
    convertBindingLeds(ctx, hw, child, claimed);
  }
  ctx.combined = previous;
}

// ---------------------------------------------------------------------------
// LED bindings (player LEDs, game feedback, stage kit, ...)
// ---------------------------------------------------------------------------

const CONSOLE_MODES: Partial<Record<legacy.EmulationModeType, proto.ConsoleMode>> = {
  [EM.EmulationModeType_Xbox360]: CM.ModeXbox360,
  [EM.EmulationModeType_XboxOne]: CM.ModeXboxOne,
  [EM.EmulationModeType_Wii]: CM.ModeWiiRb,
  [EM.EmulationModeType_Ps3]: CM.ModePs3,
  [EM.EmulationModeType_Ps4Or5]: CM.ModePs4,
  [EM.EmulationModeType_Switch]: CM.ModeSwitch,
  [EM.EmulationModeType_Xbox]: CM.ModeOgXbox,
  // The old configurator already loaded this one as Xbox One mode
  [EM.EmulationModeType_FnfHid]: CM.ModeXboxOne,
  [EM.EmulationModeType_Arcade]: CM.ModeGuitarHeroArcade,
};

// The keyboard Fortnite Festival mode and the gameplay mode toggle, which both become a keyboard
// profile of its own
const isFestivalKeyboard = (type: number) =>
  type === EM.EmulationModeType_Fnf || type === EM.EmulationModeType_FnfLayer;

function warnUnsupportedMode(ctx: LegacyImportContext, type: legacy.EmulationModeType) {
  if (type === EM.EmulationModeType_Ps2OnPs3) {
    ctx.warn('legacyImport.ps2OnPs3Unsupported');
  } else {
    ctx.warn('legacyImport.fortniteModesUnsupported');
  }
}

const STAGE_KIT_TYPES = [
  proto.StageKitLedType.StageKitFog,
  proto.StageKitLedType.StageKitStrobe,
  proto.StageKitLedType.StageKitGreen,
  proto.StageKitLedType.StageKitRed,
  proto.StageKitLedType.StageKitYellow,
  proto.StageKitLedType.StageKitBlue,
];

function commandMapping(
  ctx: LegacyImportContext,
  led: legacy.ISerializedLed
): proto.ILedMapping | undefined {
  const param1 = led.param1 ?? 0;
  const feedback = (type: proto.GameFeedbackLedType, value?: number): proto.ILedMapping => ({
    gameFeedbackMapping: value == null ? { type } : { type, value },
  });
  switch (led.type ?? LC.LedCommandType_KeyboardNumLock) {
    case LC.LedCommandType_KeyboardNumLock:
      return { keyboardMapping: { type: proto.KeyboardLedType.KeyboardLedNumLock } };
    case LC.LedCommandType_KeyboardCapsLock:
      return { keyboardMapping: { type: proto.KeyboardLedType.KeyboardLedCapsLock } };
    case LC.LedCommandType_KeyboardScrollLock:
      return { keyboardMapping: { type: proto.KeyboardLedType.KeyboardLedScrollLock } };
    case LC.LedCommandType_Auth:
      return { statusMapping: { type: proto.StatusLedType.StatusAuthenticated } };
    case LC.LedCommandType_Player:
      return { playerMapping: { playerId: param1 + 1 } };
    case LC.LedCommandType_Combo:
      return feedback(proto.GameFeedbackLedType.FeedbackMultiplier, param1 + 1);
    case LC.LedCommandType_NoteHit:
      // Both use the Santroller protocol's note numbers for the controller type
      return feedback(proto.GameFeedbackLedType.FeedbackNoteHit, param1);
    case LC.LedCommandType_NoteMiss:
      return feedback(proto.GameFeedbackLedType.FeedbackNoteMiss);
    case LC.LedCommandType_StarPowerInactive:
      return feedback(proto.GameFeedbackLedType.FeedbackStarPowerGauge);
    case LC.LedCommandType_StarPowerActive:
      return feedback(proto.GameFeedbackLedType.FeedbackStarPowerActive);
    case LC.LedCommandType_DjEuphoria:
      return { euphoriaMapping: {} };
    case LC.LedCommandType_StageKitLed: {
      const type = STAGE_KIT_TYPES[param1];
      if (type == null) {
        return undefined;
      }
      const light =
        type !== proto.StageKitLedType.StageKitFog && type !== proto.StageKitLedType.StageKitStrobe;
      return {
        stageKitMapping: {
          type,
          index: light ? 1 << (led.param2 ?? 0) : 0,
          indexMappingMode: proto.StageKitIndexMappingMode.StageKitIndexSequential,
        },
      };
    }
    case LC.LedCommandType_Ps4LightBar:
      return { playstationMapping: {} };
    case LC.LedCommandType_BluetoothConnected:
      return { statusMapping: { type: proto.StatusLedType.StatusBluetoothConnected } };
    case LC.LedCommandType_Mode: {
      if (isFestivalKeyboard(param1)) {
        // Lit by the Fortnite Festival profile instead
        return undefined;
      }
      const mode = CONSOLE_MODES[param1 as legacy.EmulationModeType];
      if (mode == null) {
        warnUnsupportedMode(ctx, param1 as legacy.EmulationModeType);
        return undefined;
      }
      return { statusMapping: { type: proto.StatusLedType.StatusConsoleMode, mode } };
    }
    case LC.LedCommandType_AlwaysOn:
      return { staticMapping: {} };
  }
  return undefined;
}

// Adds the LEDs for an LED binding to `leds`, lit by `mapping` (the binding's own by default)
function convertCommandLed(
  ctx: LegacyImportContext,
  hw: LedHardware | undefined,
  led: legacy.ISerializedLed,
  leds: proto.ILed[] = ctx.leds,
  mapping = commandMapping(ctx, led)
) {
  if (!mapping) {
    return;
  }
  const type = led.type ?? LC.LedCommandType_KeyboardNumLock;
  // These never switched the LED back to its off colour
  const noOff =
    type === LC.LedCommandType_Auth ||
    type === LC.LedCommandType_Mode ||
    type === LC.LedCommandType_AlwaysOn;
  warnPeripheralLeds(ctx, led.ledIndexPeripheral);
  if (hw?.kind === 'rgb') {
    const activeLed = ledIndices(led.ledIndex, hw.count);
    if (activeLed.length) {
      leds.push({
        device: rgbDevice(hw, activeLed, led.ledOn, noOff ? 0 : led.ledOff, true),
        mapping,
      });
    }
  } else if (hw?.kind === 'stp16') {
    const activeLed = ledIndices(led.ledIndex, hw.count);
    if (activeLed.length) {
      leds.push({ device: { stp16: { deviceId: hw.deviceid, activeLed } }, mapping });
    }
  }
  for (const pin of mpr121Pins(ctx, led.ledIndexMpr121)) {
    leds.push({ device: { mpr121: { deviceId: mpr121Device(ctx), pin } }, mapping });
  }
  const pin = led.pin ?? -1;
  if (led.outputEnabled && pin >= 0) {
    if (led.peripheral) {
      ctx.warn('legacyImport.peripheralOutputsSkipped');
    } else if (led.inverted) {
      ctx.warn('legacyImport.invertedOutputsSkipped');
    } else {
      // Star power and euphoria dimmed their output with PWM
      const analog =
        type === LC.LedCommandType_DjEuphoria ||
        type === LC.LedCommandType_StarPowerActive ||
        type === LC.LedCommandType_StarPowerInactive;
      leds.push({ device: { gpio: { pin, analog } }, mapping });
    }
  }
}

// ---------------------------------------------------------------------------
// Binding converters
// ---------------------------------------------------------------------------

registerOutputConverters({
  serializedLed: (ctx, { serializedLed: led }) => {
    const st = state(ctx);
    if (led!.enabled !== false) {
      st.commandLeds.push(led!);
    }
  },

  serializedEmulationMode: (ctx, { serializedEmulationMode: m }) => {
    const st = state(ctx);
    if (m!.enabled === false) {
      return;
    }
    const type = m!.type ?? EM.EmulationModeType_Xbox360;
    const mode = CONSOLE_MODES[type];
    const festival = isFestivalKeyboard(type);
    if (mode == null && !festival) {
      warnUnsupportedMode(ctx, type);
      return;
    }
    const converted = convertInput(ctx, m!.input);
    if (!converted) {
      return;
    }
    const trigger: proto.IInputActivationTrigger = { input: converted.input };
    if (converted.mapping?.inverted) {
      trigger.inverted = true;
    }
    if (converted.mapping?.trigger != null) {
      trigger.trigger = converted.mapping.trigger;
      trigger.triggerValue = converted.mapping.triggerValue;
    } else if (converted.analog) {
      // An analog input on a button counted as pressed past half way
      trigger.trigger = proto.AnalogToDigitalTriggerType.JoyHigh;
      trigger.triggerValue = converted.isUint ? 32767 : INT16_OFFSET;
    }
    if (type === EM.EmulationModeType_FnfLayer) {
      // Toggled the festival layout on and off while running, so it reads a toggle on that input
      const deviceid = ctx.addDevice('toggle', JSON.stringify(converted.input));
      st.festivalToggles.push({ toggle: { deviceid, input: converted.input } });
    } else if (festival) {
      st.festival.push(trigger);
    } else {
      st.modes.push({ mode: mode!, trigger });
    }
  },
});

// ---------------------------------------------------------------------------
// Post pass and config level settings
// ---------------------------------------------------------------------------

export interface LedsModesSettings {
  // The profile's assignments, replacing the default one: a list per console mode binding (hold
  // an input at startup to force that mode), then the default list. Lists are tried in order and
  // the first one that matches is used, so the default list has to come last.
  assignments: proto.IProfileAssignment[];
  // The Fortnite Festival keyboard mode, as a keyboard profile that goes before the main one: a
  // list per mode binding, and the profile's LEDs
  festival?: { assignments: proto.IProfileAssignment[]; leds: proto.ILed[] };
  // Goes on the config
  inactivity?: proto.IInactivityConfig;
}

const PS4_INSTRUMENTS = new Set<proto.SubType>([
  proto.SubType.GuitarHeroGuitar,
  proto.SubType.RockBandGuitar,
  proto.SubType.GuitarHeroDrums,
  proto.SubType.RockBandDrums,
]);

function usesUsbHost(old: legacy.SerializedConfiguration) {
  return old.bindings.some((binding) => {
    const found = bindingFields(binding);
    return (
      !!found &&
      (found.kind === 'serializedCombinedUsbHostOutput' ||
        found.kind === 'serializedCombinedUsbHostOutput122' ||
        !!found.fields.input?.serializedUsbHostInput)
    );
  });
}

// Converts the LEDs, GPIO outputs, console mode bindings and config level settings. Call it once,
// after every binding has been converted (it uses ctx.assignments, and reads combined outputs'
// children again).
export function convertLedsModesSettings(ctx: LegacyImportContext): LedsModesSettings {
  const old = ctx.old;
  const st = state(ctx);

  // LEDs
  const hw = ledHardware(ctx);
  if ((old.ledTypePeripheral ?? LT.LedType_None) !== LT.LedType_None) {
    ctx.warn('legacyImport.peripheralLedsSkipped');
  }
  const claimed = new Set<number>();
  for (const binding of old.bindings) {
    convertBindingLeds(ctx, hw, binding, claimed);
  }
  // Game and console driven LEDs go after the input ones, as they took priority over them
  for (const led of st.commandLeds) {
    convertCommandLed(ctx, hw, led);
  }
  // The festival profile has the same LEDs, with its mode LEDs always on
  const festivalLeds = [...ctx.leds];
  const hasFestival = st.festival.length > 0 || st.festivalToggles.length > 0;
  if (hasFestival) {
    for (const led of st.commandLeds) {
      if (led.type === LC.LedCommandType_Mode && isFestivalKeyboard(led.param1 ?? 0)) {
        convertCommandLed(ctx, hw, led, festivalLeds, { staticMapping: {} });
      }
    }
  }

  // Battery gauge
  if (old.hasMax1704X) {
    ctx.addDevice('max1704x', 'main', (dev) => setI2c(dev.i2c, old.max1704XSda, old.max1704XScl));
  }

  // Bluetooth output goes alongside USB in every assignment list
  const shared: proto.IProfileAssignmentInfo[] = [];
  const T = legacy.EmulationType;
  if (
    old.isBluetoothTx ||
    old.emulationType === T.EmulationType_Bluetooth ||
    old.emulationType === T.EmulationType_BluetoothKeyboardMouse
  ) {
    ctx.addDevice('bt', 'main');
    shared.push({ bluetooth: proto.BluetoothMode.BTStandard });
  }

  // PS4 instrument mode needed a controller on the USB host port to authenticate
  const ps4OrPs5Mode = !!old.ps4Instruments && PS4_INSTRUMENTS.has(ctx.subType) && usesUsbHost(old);
  const usb = (forcedType?: proto.ConsoleMode): proto.IProfileAssignmentInfo => ({
    consoleType: {
      ...(forcedType != null ? { forcedType } : {}),
      xinputOnWindows: old.xInputOnWindows,
      ps4OrPs5Mode,
    },
  });
  const assignments: proto.IProfileAssignment[] = [
    ...st.modes.map(({ mode, trigger }) => ({
      assignments: [usb(mode), ...shared, ...ctx.assignments, { input: trigger }],
    })),
    { assignments: [usb(), ...shared, ...ctx.assignments] },
  ];
  // Keyboards don't need authenticating
  const keyboardUsb = { consoleType: { ps4OrPs5Mode: false } };
  const festivalList = (trigger: proto.IProfileAssignmentInfo) => ({
    assignments: [keyboardUsb, ...shared, ...ctx.assignments, trigger],
  });
  const festival = hasFestival
    ? {
        assignments: [
          ...st.festival.map((trigger) => festivalList({ input: trigger })),
          ...st.festivalToggles.map((input) => festivalList({ inputAnyTime: { input } })),
        ],
        leds: festivalLeds,
      }
    : undefined;

  if ((old.pollRate ?? 0) > 0 && !old.queueBasedInputs) {
    ctx.warn('legacyImport.pollRate');
  }

  // Sleep and LED timeouts
  const inactivity: proto.IInactivityConfig = {};
  if (old.sleepEnabled) {
    if ((old.sleepPin ?? -1) >= 0) {
      inactivity.sleepTimeoutSec = Math.max(0, old.sleepTimer ?? 0);
      inactivity.wakePin = old.sleepPin;
      inactivity.wakeActiveHigh = false;
    } else {
      ctx.warn('legacyImport.sleepNoWakePin');
    }
  }
  if ((old.ledTimer ?? 0) > 0) {
    inactivity.ledTimeoutSec = old.ledTimer;
  }

  return {
    assignments,
    ...(festival ? { festival } : {}),
    ...(Object.keys(inactivity).length ? { inactivity } : {}),
  };
}
