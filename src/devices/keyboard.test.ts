import { describe, expect, it } from 'vitest';
import { hidKeyMatches, hidKeyName, inputKeyName } from './keyboard';

describe('chatpad key names', () => {
  it('names the colour keys on a key read from a keyboard', () => {
    expect(inputKeyName(0x68)).toBe('F13 (Chatpad Green)');
    expect(inputKeyName(0x69)).toBe('F14 (Chatpad Orange)');
    expect(inputKeyName(0x6a)).toBe('F15 (Chatpad People)');
    expect(inputKeyName(0x04)).toBe('A');
  });

  it('leaves a key that is sent as itself', () => {
    expect(hidKeyName(0x68)).toBe('F13');
  });

  it('finds them by colour only when reading', () => {
    expect(hidKeyMatches(0x68, 'green', true)).toBe(true);
    expect(hidKeyMatches(0x68, 'green')).toBe(false);
    expect(hidKeyMatches(0x68, 'f13', true)).toBe(true);
  });
});
