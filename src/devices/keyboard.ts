export const ASCII_TO_HID: Record<string, { modifier: number; code: number }> = {
  '\b': { modifier: 0x00, code: 0x2a }, // Backspace
  '\t': { modifier: 0x00, code: 0x2b }, // Tab
  '\n': { modifier: 0x00, code: 0x28 }, // Enter
  ' ': { modifier: 0x00, code: 0x2c }, // Space
  a: { modifier: 0x00, code: 0x04 },
  A: { modifier: 0x02, code: 0x04 },
  b: { modifier: 0x00, code: 0x05 },
  B: { modifier: 0x02, code: 0x05 },
  c: { modifier: 0x00, code: 0x06 },
  C: { modifier: 0x02, code: 0x06 },
  d: { modifier: 0x00, code: 0x07 },
  D: { modifier: 0x02, code: 0x07 },
  e: { modifier: 0x00, code: 0x08 },
  E: { modifier: 0x02, code: 0x08 },
  f: { modifier: 0x00, code: 0x09 },
  F: { modifier: 0x02, code: 0x09 },
  g: { modifier: 0x00, code: 0x0a },
  G: { modifier: 0x02, code: 0x0a },
  h: { modifier: 0x00, code: 0x0b },
  H: { modifier: 0x02, code: 0x0b },
  i: { modifier: 0x00, code: 0x0c },
  I: { modifier: 0x02, code: 0x0c },
  j: { modifier: 0x00, code: 0x0d },
  J: { modifier: 0x02, code: 0x0d },
  k: { modifier: 0x00, code: 0x0e },
  K: { modifier: 0x02, code: 0x0e },
  l: { modifier: 0x00, code: 0x0f },
  L: { modifier: 0x02, code: 0x0f },
  m: { modifier: 0x00, code: 0x10 },
  M: { modifier: 0x02, code: 0x10 },
  n: { modifier: 0x00, code: 0x11 },
  N: { modifier: 0x02, code: 0x11 },
  o: { modifier: 0x00, code: 0x12 },
  O: { modifier: 0x02, code: 0x12 },
  p: { modifier: 0x00, code: 0x13 },
  P: { modifier: 0x02, code: 0x13 },
  q: { modifier: 0x00, code: 0x14 },
  Q: { modifier: 0x02, code: 0x14 },
  r: { modifier: 0x00, code: 0x15 },
  R: { modifier: 0x02, code: 0x15 },
  s: { modifier: 0x00, code: 0x16 },
  S: { modifier: 0x02, code: 0x16 },
  t: { modifier: 0x00, code: 0x17 },
  T: { modifier: 0x02, code: 0x17 },
  u: { modifier: 0x00, code: 0x18 },
  U: { modifier: 0x02, code: 0x18 },
  v: { modifier: 0x00, code: 0x19 },
  V: { modifier: 0x02, code: 0x19 },
  w: { modifier: 0x00, code: 0x1a },
  W: { modifier: 0x02, code: 0x1a },
  x: { modifier: 0x00, code: 0x1b },
  X: { modifier: 0x02, code: 0x1b },
  y: { modifier: 0x00, code: 0x1c },
  Y: { modifier: 0x02, code: 0x1c },
  z: { modifier: 0x00, code: 0x1d },
  Z: { modifier: 0x02, code: 0x1d },
  '1': { modifier: 0x00, code: 0x1e },
  '!': { modifier: 0x02, code: 0x1e },
  '2': { modifier: 0x00, code: 0x1f },
  '@': { modifier: 0x02, code: 0x1f },
  '3': { modifier: 0x00, code: 0x20 },
  '#': { modifier: 0x02, code: 0x20 },
  '4': { modifier: 0x00, code: 0x21 },
  $: { modifier: 0x02, code: 0x21 },
  '5': { modifier: 0x00, code: 0x22 },
  '%': { modifier: 0x02, code: 0x22 },
  '6': { modifier: 0x00, code: 0x23 },
  '^': { modifier: 0x02, code: 0x23 },
  '7': { modifier: 0x00, code: 0x24 },
  '&': { modifier: 0x02, code: 0x24 },
  '8': { modifier: 0x00, code: 0x25 },
  '*': { modifier: 0x02, code: 0x25 },
  '9': { modifier: 0x00, code: 0x26 },
  '(': { modifier: 0x02, code: 0x26 },
  '0': { modifier: 0x00, code: 0x27 },
  ')': { modifier: 0x02, code: 0x27 },
};

// HID usage for each KeyboardEvent.code, which (unlike event.key) covers keys that don't
// type a character and tells left / right modifiers apart
export const CODE_TO_HID: Record<string, number> = {
  ...Object.fromEntries(
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((c, i) => [`Key${c}`, 0x04 + i])
  ),
  ...Object.fromEntries('1234567890'.split('').map((c, i) => [`Digit${c}`, 0x1e + i])),
  Enter: 0x28,
  Escape: 0x29,
  Backspace: 0x2a,
  Tab: 0x2b,
  Space: 0x2c,
  Minus: 0x2d,
  Equal: 0x2e,
  BracketLeft: 0x2f,
  BracketRight: 0x30,
  Backslash: 0x31,
  Semicolon: 0x33,
  Quote: 0x34,
  Backquote: 0x35,
  Comma: 0x36,
  Period: 0x37,
  Slash: 0x38,
  CapsLock: 0x39,
  ...Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`F${i + 1}`, 0x3a + i])),
  PrintScreen: 0x46,
  ScrollLock: 0x47,
  Pause: 0x48,
  Insert: 0x49,
  Home: 0x4a,
  PageUp: 0x4b,
  Delete: 0x4c,
  End: 0x4d,
  PageDown: 0x4e,
  ArrowRight: 0x4f,
  ArrowLeft: 0x50,
  ArrowDown: 0x51,
  ArrowUp: 0x52,
  NumLock: 0x53,
  NumpadDivide: 0x54,
  NumpadMultiply: 0x55,
  NumpadSubtract: 0x56,
  NumpadAdd: 0x57,
  NumpadEnter: 0x58,
  ...Object.fromEntries('123456789'.split('').map((c, i) => [`Numpad${c}`, 0x59 + i])),
  Numpad0: 0x62,
  NumpadDecimal: 0x63,
  IntlBackslash: 0x64,
  ContextMenu: 0x65,
  Power: 0x66,
  NumpadEqual: 0x67,
  ...Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`F${i + 13}`, 0x68 + i])),
  Open: 0x74,
  Help: 0x75,
  Props: 0x76,
  Select: 0x77,
  Stop: 0x78,
  Again: 0x79,
  Undo: 0x7a,
  Cut: 0x7b,
  Copy: 0x7c,
  Paste: 0x7d,
  Find: 0x7e,
  AudioVolumeMute: 0x7f,
  AudioVolumeUp: 0x80,
  AudioVolumeDown: 0x81,
  NumpadComma: 0x85,
  IntlRo: 0x87,
  KanaMode: 0x88,
  IntlYen: 0x89,
  Convert: 0x8a,
  NonConvert: 0x8b,
  Lang1: 0x90,
  Lang2: 0x91,
  Lang3: 0x92,
  Lang4: 0x93,
  Lang5: 0x94,
  ControlLeft: 0xe0,
  ShiftLeft: 0xe1,
  AltLeft: 0xe2,
  MetaLeft: 0xe3,
  ControlRight: 0xe4,
  ShiftRight: 0xe5,
  AltRight: 0xe6,
  MetaRight: 0xe7,
};

const HID_TO_NAME: Record<number, string> = Object.fromEntries(
  Object.entries(CODE_TO_HID).map(([code, hid]) => [
    hid,
    code
      .replace(/^Key/, '')
      .replace(/^Digit/, '')
      .replace(/^Meta(Left|Right)$/, 'Windows$1')
      .replace(/^(Shift|Control|Alt|Windows)(Left|Right)$/, '$2 $1')
      .replace(/^Arrow(.*)$/, '$1 Arrow')
      .replace(/^Numpad(.+)$/, 'Numpad $1')
      .replace(/^Lang(\d)$/, 'Lang $1')
      .replace(/([a-z])([A-Z])/g, '$1 $2'),
  ])
);

export function hidKeyName(code: number): string | undefined {
  return HID_TO_NAME[code];
}

// The keys an Xbox 360 chatpad's colour keys come through as (see the firmware's protocols/xbox360_chatpad.hpp)
const CHATPAD_KEY_NAMES: Record<number, string> = {
  0x68: 'Chatpad Green',
  0x69: 'Chatpad Orange',
  0x6a: 'Chatpad People',
};

// A key read from a keyboard, which might be a chatpad's colour key
export function inputKeyName(code: number): string | undefined {
  const name = hidKeyName(code);
  return name && CHATPAD_KEY_NAMES[code] ? `${name} (${CHATPAD_KEY_NAMES[code]})` : name;
}

// Other names people search for a key by, keyed by KeyboardEvent.code
const KEY_ALIASES: Record<string, string[]> = {
  Enter: ['return'],
  Escape: ['esc'],
  Backspace: ['bksp'],
  Space: ['spacebar'],
  Minus: ['-', 'dash', 'hyphen', 'underscore'],
  Equal: ['=', 'equals', 'plus'],
  BracketLeft: ['[', '{'],
  BracketRight: [']', '}'],
  Backslash: ['\\', 'pipe'],
  Semicolon: [';', 'colon'],
  Quote: ["'", 'apostrophe', 'double quote'],
  Backquote: ['`', 'grave', 'tilde'],
  Comma: [',', 'less than'],
  Period: ['.', 'dot', 'full stop', 'greater than'],
  Slash: ['/', 'forward slash', 'question mark'],
  PrintScreen: ['prtsc', 'sysrq'],
  ScrollLock: ['scrlk'],
  Pause: ['break'],
  Insert: ['ins'],
  Delete: ['del'],
  PageUp: ['pgup'],
  PageDown: ['pgdn'],
  ContextMenu: ['menu', 'apps'],
  IntlBackslash: ['non us backslash'],
  AudioVolumeMute: ['mute'],
  AudioVolumeUp: ['volume up'],
  AudioVolumeDown: ['volume down'],
  KanaMode: ['katakana', 'hiragana'],
  Lang1: ['hangul', 'kana'],
  Lang2: ['hanja', 'eisu'],
  ControlLeft: ['ctrl'],
  ControlRight: ['ctrl'],
  AltLeft: ['option'],
  AltRight: ['option', 'altgr'],
  MetaLeft: ['meta', 'win', 'command', 'cmd', 'super', 'gui'],
  MetaRight: ['meta', 'win', 'command', 'cmd', 'super', 'gui'],
  ...Object.fromEntries(
    Object.keys(CODE_TO_HID)
      .filter((code) => code.startsWith('Numpad') || code === 'NumLock')
      .map((code) => [code, ['keypad', 'kp', 'num']])
  ),
};

// Every named key, in usage order, for picking keys a physical keyboard doesn't have
export const HID_KEYS: { code: number; name: string; search: string }[] = Object.entries(
  CODE_TO_HID
)
  .map(([code, hid]) => ({
    code: hid,
    name: HID_TO_NAME[hid],
    search: [HID_TO_NAME[hid], ...(KEY_ALIASES[code] ?? [])].join(' ').toLowerCase(),
  }))
  .sort((a, b) => a.code - b.code);

const HID_SEARCH: Record<number, string> = Object.fromEntries(
  HID_KEYS.map(({ code, search }) => [code, search])
);

// Whether a key matches what was typed into the key picker: every word has to appear in its name
// or one of its aliases, so "left ctrl" finds Left Control and "return" finds Enter
export function hidKeyMatches(code: number, search: string, input = false): boolean {
  const haystack = [
    HID_SEARCH[code] ?? hidKeyName(code)?.toLowerCase() ?? '',
    input ? (CHATPAD_KEY_NAMES[code]?.toLowerCase() ?? '') : '',
  ].join(' ');
  return search
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

// Consumer page usages for media keys, sent as the consumerKey output
export const MEDIA_KEYS: Record<string, number> = {
  PlayPause: 0xcd,
  Stop: 0xb7,
  NextTrack: 0xb5,
  PreviousTrack: 0xb6,
  FastForward: 0xb3,
  Rewind: 0xb4,
  VolumeUp: 0xe9,
  VolumeDown: 0xea,
  Mute: 0xe2,
  Eject: 0xb8,
  BrowserHome: 0x223,
  BrowserBack: 0x224,
  BrowserForward: 0x225,
  BrowserRefresh: 0x227,
  BrowserSearch: 0x221,
  Mail: 0x18a,
  Calculator: 0x192,
  MyComputer: 0x194,
  BrightnessUp: 0x6f,
  BrightnessDown: 0x70,
};

export function mediaKeyName(usage: number): string | undefined {
  return Object.entries(MEDIA_KEYS)
    .find(([, v]) => v === usage)?.[0]
    .replace(/([a-z])([A-Z])/g, '$1 $2');
}
