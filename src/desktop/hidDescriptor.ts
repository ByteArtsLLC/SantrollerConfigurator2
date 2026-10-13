// Turns a HID report descriptor into the collections WebHID would give for it, as the configurator
// looks through them to work out which reports a device has (and how big they are)

type Mutable<T> = { -readonly [K in keyof T]: T[K] };
type Collection = Mutable<HIDCollectionInfo> & {
  children: Collection[];
  inputReports: Mutable<HIDReportInfo>[];
  outputReports: Mutable<HIDReportInfo>[];
  featureReports: Mutable<HIDReportInfo>[];
};

interface Globals {
  usagePage: number;
  logicalMinimum: number;
  logicalMaximum: number;
  physicalMinimum: number;
  physicalMaximum: number;
  unitExponent: number;
  reportSize: number;
  reportId: number;
  reportCount: number;
}

export interface ParsedDescriptor {
  collections: HIDCollectionInfo[];
  // Whether reports start with a report id
  numbered: boolean;
  // The largest feature report, in bytes, not counting the report id
  maxFeatureReportLength: number;
  featureReportLengths: Map<number, number>;
}

function readUnsigned(data: Uint8Array, offset: number, size: number) {
  let value = 0;
  for (let i = size - 1; i >= 0; i--) {
    value = value * 256 + data[offset + i];
  }
  return value;
}

function readSigned(data: Uint8Array, offset: number, size: number) {
  const value = readUnsigned(data, offset, size);
  const bits = size * 8;
  return size && value >= 2 ** (bits - 1) ? value - 2 ** bits : value;
}

function newCollection(usagePage: number, usage: number, type: number): Collection {
  return {
    usagePage,
    usage,
    type,
    children: [],
    inputReports: [],
    outputReports: [],
    featureReports: [],
  };
}

function reportFor(reports: Mutable<HIDReportInfo>[], reportId: number) {
  let report = reports.find((r) => r.reportId === reportId);
  if (!report) {
    report = { reportId, items: [] };
    reports.push(report);
  }
  return report;
}

export function parseReportDescriptor(descriptor: Uint8Array): ParsedDescriptor {
  const top: Collection[] = [];
  const stack: Collection[] = [];
  const globalStack: Globals[] = [];
  let globals: Globals = {
    usagePage: 0,
    logicalMinimum: 0,
    logicalMaximum: 0,
    physicalMinimum: 0,
    physicalMaximum: 0,
    unitExponent: 0,
    reportSize: 0,
    reportId: 0,
    reportCount: 0,
  };
  let usages: number[] = [];
  let usageMinimum: number | undefined;
  let usageMaximum: number | undefined;
  let numbered = false;
  const featureBits = new Map<number, number>();

  // a usage without its page in front of it is on the current usage page
  const fullUsage = (value: number, size: number) =>
    size === 4 ? value : globals.usagePage * 0x10000 + value;

  for (let i = 0; i < descriptor.length;) {
    const prefix = descriptor[i];
    // long items have no use in reports
    if (prefix === 0xfe) {
      i += 3 + (descriptor[i + 1] ?? 0);
      continue;
    }
    const size = [0, 1, 2, 4][prefix & 3];
    const type = (prefix >> 2) & 3;
    const tag = prefix >> 4;
    const value = readUnsigned(descriptor, i + 1, size);
    const signed = readSigned(descriptor, i + 1, size);
    i += 1 + size;

    if (type === 0) {
      // main
      if (tag === 0xa) {
        const usage = usages[0] ?? (usageMinimum !== undefined ? usageMinimum : 0);
        const collection = newCollection(usage >>> 16, usage & 0xffff, value);
        (stack.length ? stack[stack.length - 1].children : top).push(collection);
        stack.push(collection);
      } else if (tag === 0xc) {
        stack.pop();
      } else if ((tag === 0x8 || tag === 0x9 || tag === 0xb) && stack.length) {
        const collection = stack[stack.length - 1];
        const reports =
          tag === 0x8
            ? collection.inputReports
            : tag === 0x9
              ? collection.outputReports
              : collection.featureReports;
        const item: HIDReportItem = {
          isConstant: !!(value & 0x1),
          isArray: !(value & 0x2),
          isAbsolute: !(value & 0x4),
          wrap: !!(value & 0x8),
          isLinear: !(value & 0x10),
          hasPreferredState: !(value & 0x20),
          hasNull: !!(value & 0x40),
          isVolatile: !!(value & 0x80),
          isBufferedBytes: !!(value & 0x100),
          isRange: usageMinimum !== undefined,
          usages,
          usageMinimum,
          usageMaximum,
          reportSize: globals.reportSize,
          reportCount: globals.reportCount,
          unitExponent: globals.unitExponent,
          logicalMinimum: globals.logicalMinimum,
          logicalMaximum: globals.logicalMaximum,
          physicalMinimum: globals.physicalMinimum,
          physicalMaximum: globals.physicalMaximum,
          strings: [],
        };
        (reportFor(reports, globals.reportId).items as HIDReportItem[]).push(item);
        if (tag === 0xb) {
          featureBits.set(
            globals.reportId,
            (featureBits.get(globals.reportId) ?? 0) + globals.reportSize * globals.reportCount
          );
        }
      }
      // locals only apply to the main item after them
      usages = [];
      usageMinimum = undefined;
      usageMaximum = undefined;
    } else if (type === 1) {
      // global
      switch (tag) {
        case 0x0:
          globals.usagePage = value;
          break;
        case 0x1:
          globals.logicalMinimum = signed;
          break;
        case 0x2:
          globals.logicalMaximum = signed;
          break;
        case 0x3:
          globals.physicalMinimum = signed;
          break;
        case 0x4:
          globals.physicalMaximum = signed;
          break;
        case 0x5:
          globals.unitExponent = signed;
          break;
        case 0x7:
          globals.reportSize = value;
          break;
        case 0x8:
          globals.reportId = value;
          numbered = true;
          break;
        case 0x9:
          globals.reportCount = value;
          break;
        case 0xa:
          globalStack.push({ ...globals });
          break;
        case 0xb:
          globals = globalStack.pop() ?? globals;
          break;
      }
    } else if (type === 2) {
      // local
      if (tag === 0x0) {
        usages = [...usages, fullUsage(value, size)];
      } else if (tag === 0x1) {
        usageMinimum = fullUsage(value, size);
      } else if (tag === 0x2) {
        usageMaximum = fullUsage(value, size);
      }
    }
  }

  const featureReportLengths = new Map(
    Array.from(featureBits, ([id, bits]) => [id, Math.ceil(bits / 8)] as const)
  );
  return {
    collections: top,
    numbered,
    maxFeatureReportLength: Math.max(0, ...featureReportLengths.values()),
    featureReportLengths,
  };
}
