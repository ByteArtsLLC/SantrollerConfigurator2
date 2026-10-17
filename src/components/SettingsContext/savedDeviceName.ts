import { Reader } from 'protobufjs/minimal';

// Config.deviceName from a saved config. Read field by field, as it can have the aux section after it,
// which doesn't decode as a Config
export function savedDeviceName(saved: Uint8Array): string | undefined {
  const reader = Reader.create(saved);
  let name: string | undefined;
  try {
    while (reader.pos < reader.len) {
      const tag = reader.uint32();
      // Config.deviceName = 8, a length delimited string
      if (tag >>> 3 === 8 && (tag & 7) === 2) {
        name = reader.string();
      } else {
        reader.skipType(tag & 7);
      }
    }
  } catch {
    // whatever was read before the bad bytes stands
  }
  return name;
}
