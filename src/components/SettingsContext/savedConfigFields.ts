import { Reader } from 'protobufjs/minimal';
import { proto } from './config';

// Top level Config fields are read one by one from a saved config, as it can have the aux section
// after it, which doesn't decode as a Config
function readSavedFields(saved: Uint8Array, onField: (field: number, reader: Reader) => boolean) {
  const reader = Reader.create(saved);
  try {
    while (reader.pos < reader.len) {
      const tag = reader.uint32();
      if ((tag & 7) !== 2 || !onField(tag >>> 3, reader)) {
        reader.skipType(tag & 7);
      }
    }
  } catch {
    // whatever was read before the bad bytes stands
  }
}

// Config.deviceName from a saved config
export function savedDeviceName(saved: Uint8Array): string | undefined {
  let name: string | undefined;
  readSavedFields(saved, (field, reader) => {
    // Config.deviceName = 8, a length delimited string
    if (field !== 8) {
      return false;
    }
    name = reader.string();
    return true;
  });
  return name;
}

// The seller tool name and logo from a saved config
export function savedSellerConfig(saved: Uint8Array): proto.ISellerConfig | undefined {
  let seller: proto.ISellerConfig | undefined;
  readSavedFields(saved, (field, reader) => {
    // Config.guiConfig = 4, each entry length delimited
    if (field !== 4) {
      return false;
    }
    const gui = proto.GuiConfig.decode(reader.bytes());
    if (gui.config === 'seller' && gui.seller) {
      seller = gui.seller;
    }
    return true;
  });
  return seller;
}
