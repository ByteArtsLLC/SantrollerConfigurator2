import { installLinkHandlers } from './links';
import { installNativeHid } from './nativeHid';

// Fills in what the system webviews are missing compared to Chrome
export async function installDesktop() {
  // Response.bytes() only arrived in WebKitGTK 2.46, which older distros don't have
  if (!Response.prototype.bytes) {
    Response.prototype.bytes = async function bytes(this: Response) {
      return new Uint8Array(await this.arrayBuffer());
    };
  }
  installLinkHandlers();
  await installNativeHid();
}
