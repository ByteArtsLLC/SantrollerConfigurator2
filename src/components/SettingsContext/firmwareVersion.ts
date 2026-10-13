// The GetVersion report: the report id, the firmware's commit hash and its NUL, a zero byte, then
// the build number (little endian), which counts up with every firmware commit. Firmware from
// before build numbers stops after the zero byte, and firmware built without the git history
// reports 0, so neither has a build number.
export function parseVersionReport(report: DataView) {
  const bytes = new Uint8Array(report.buffer, report.byteOffset + 1, report.byteLength - 1);
  const end = bytes.indexOf(0);
  const version = String.fromCharCode(...bytes.subarray(0, end < 0 ? bytes.length : end))
    .trim()
    .substring(0, 8);
  let build: number | undefined;
  if (end >= 0 && bytes.length >= end + 6) {
    build =
      new DataView(bytes.buffer, bytes.byteOffset + end + 2, 4).getUint32(0, true) || undefined;
  }
  return { version, build };
}
