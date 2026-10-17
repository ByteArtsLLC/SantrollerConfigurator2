import { describe, expect, it } from 'vitest';
import {
  addMatrixPins,
  matrixAllPins,
  matrixHasPin,
  matrixPins,
  withMatrixPins,
} from './matrixPins';

describe('matrixPins', () => {
  it('reads pins from the low and high masks', () => {
    const matrix = { inPins: (1 << 2) | (1 << 31), outPins: 0, inPinsHigh: 1 << 15 };
    expect(matrixPins(matrix, 'in')).toEqual([2, 31, 47]);
    expect(matrixPins(matrix, 'out')).toEqual([]);
    expect(matrixHasPin(matrix, 'in', 47)).toBe(true);
    expect(matrixHasPin(matrix, 'in', 15)).toBe(false);
  });

  it('splits pins across the masks without going negative', () => {
    const matrix = withMatrixPins({ inPins: 0, outPins: 1 }, 'in', [0, 31, 32, 47]);
    expect(matrix).toEqual({
      inPins: (1 | 0x80000000) >>> 0,
      inPinsHigh: 1 | (1 << 15),
      outPins: 1,
    });
    expect(matrixPins(matrix, 'in')).toEqual([0, 31, 32, 47]);
  });

  it('adds pins and lists every pin in use', () => {
    const matrix = addMatrixPins(withMatrixPins(undefined, 'out', [14, 40]), 'out', [15]);
    expect(matrixPins(matrix, 'out')).toEqual([14, 15, 40]);
    expect(matrixAllPins(addMatrixPins(matrix, 'in', [2, 14]))).toEqual([2, 14, 15, 40]);
  });

  it('treats a missing matrix as empty', () => {
    expect(matrixPins(undefined, 'in')).toEqual([]);
    expect(matrixAllPins(null)).toEqual([]);
  });
});
