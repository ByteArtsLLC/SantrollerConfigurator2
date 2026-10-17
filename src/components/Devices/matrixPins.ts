import { proto } from '@/components/SettingsContext/config';

// A matrix stores its pins as two 32-bit masks per side: GPIO 0-31 in inPins/outPins and
// GPIO 32-63 in inPinsHigh/outPinsHigh. JS bitwise ops are 32-bit, so go through these helpers.
export type MatrixPinSide = 'in' | 'out';

const fields = {
  in: { low: 'inPins', high: 'inPinsHigh' },
  out: { low: 'outPins', high: 'outPinsHigh' },
} as const;

function maskPins(mask: number | null | undefined, base: number): number[] {
  const pins: number[] = [];
  for (let bit = 0; bit < 32; bit++) {
    if (((mask ?? 0) >>> bit) & 1) {
      pins.push(base + bit);
    }
  }
  return pins;
}

function pinsMask(pins: number[], base: number): number {
  return (
    pins
      .filter((pin) => pin >= base && pin < base + 32)
      .reduce((acc, pin) => acc | (1 << (pin - base)), 0) >>> 0
  );
}

export function matrixPins(
  matrix: proto.IMatrixDevice | null | undefined,
  side: MatrixPinSide
): number[] {
  const { low, high } = fields[side];
  return [...maskPins(matrix?.[low], 0), ...maskPins(matrix?.[high], 32)];
}

export function matrixAllPins(matrix: proto.IMatrixDevice | null | undefined): number[] {
  return [...new Set([...matrixPins(matrix, 'in'), ...matrixPins(matrix, 'out')])].sort(
    (a, b) => a - b
  );
}

export function matrixHasPin(
  matrix: proto.IMatrixDevice | null | undefined,
  side: MatrixPinSide,
  pin: number
): boolean {
  return matrixPins(matrix, side).includes(pin);
}

export function withMatrixPins(
  matrix: proto.IMatrixDevice | null | undefined,
  side: MatrixPinSide,
  pins: number[]
): proto.IMatrixDevice {
  const result: proto.IMatrixDevice = { inPins: 0, outPins: 0, ...matrix };
  const { low, high } = fields[side];
  result[low] = pinsMask(pins, 0);
  result[high] = pinsMask(pins, 32);
  return result;
}

export function addMatrixPins(
  matrix: proto.IMatrixDevice | null | undefined,
  side: MatrixPinSide,
  pins: number[]
): proto.IMatrixDevice {
  return withMatrixPins(matrix, side, [...matrixPins(matrix, side), ...pins]);
}
