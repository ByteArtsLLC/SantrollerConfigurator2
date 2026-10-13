import { describe, expect, it } from 'vitest';
import { parseReportDescriptor } from './hidDescriptor';

// The shape of the config interface's descriptor (hid_config_device.cpp)
// prettier-ignore
const descriptor = Uint8Array.from([
  0x06, 0x00, 0xff, // usage page (vendor 0xff00)
  0x09, 0x01, // usage 1
  0xa1, 0x01, // collection (application)
  0x85, 0x01, 0x15, 0x00, 0x26, 0xff, 0x00, 0x75, 0x08, 0x95, 0x3f, // id 1, 0-255, 8 bits x 63
  0x09, 0x01, 0x81, 0x02, // input
  0x09, 0x01, 0xb1, 0x02, // feature
  0x85, 0x0b, 0x95, 0x01, 0x09, 0x01, 0xb1, 0x02, // id 11, 1 byte feature
  0x85, 0x0c, 0x96, 0x00, 0x01, 0x09, 0x01, 0x91, 0x02, // id 12, 256 byte output
  0xc0, // end collection
]);

describe('parseReportDescriptor', () => {
  const parsed = parseReportDescriptor(descriptor);

  it('finds the top level collection', () => {
    expect(parsed.collections).toHaveLength(1);
    expect(parsed.collections[0].usagePage).toBe(0xff00);
    expect(parsed.collections[0].usage).toBe(1);
    expect(parsed.numbered).toBe(true);
  });

  it('groups reports by id, with their sizes', () => {
    const collection = parsed.collections[0];
    expect(collection.inputReports!.map((r) => r.reportId)).toEqual([1]);
    expect(collection.featureReports!.map((r) => r.reportId)).toEqual([1, 0x0b]);
    expect(collection.outputReports!.map((r) => r.reportId)).toEqual([0x0c]);
    const output = collection.outputReports![0].items![0];
    expect(output.reportSize! * output.reportCount!).toBe(256 * 8);
    expect(output.logicalMaximum).toBe(255);
  });

  it('works out feature report lengths', () => {
    expect(parsed.featureReportLengths.get(1)).toBe(63);
    expect(parsed.featureReportLengths.get(0x0b)).toBe(1);
    expect(parsed.maxFeatureReportLength).toBe(63);
  });
});
