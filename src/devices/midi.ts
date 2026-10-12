import type { TFunction } from 'i18next';
import { proto } from '@/components/SettingsContext/config';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Middle C (60) is C4
export function midiNoteName(note: number): string {
  return `${NOTE_NAMES[note % 12]}${Math.floor(note / 12) - 1}`;
}

// The General MIDI percussion map, used on channel 10.
// Values are keys under midiOutput.percussion in the translations.
export const GM_PERCUSSION: Record<number, string> = {
  35: 'acousticBassDrum',
  36: 'bassDrum',
  37: 'sideStick',
  38: 'acousticSnare',
  39: 'handClap',
  40: 'electricSnare',
  41: 'lowFloorTom',
  42: 'closedHiHat',
  43: 'highFloorTom',
  44: 'pedalHiHat',
  45: 'lowTom',
  46: 'openHiHat',
  47: 'lowMidTom',
  48: 'hiMidTom',
  49: 'crashCymbal1',
  50: 'highTom',
  51: 'rideCymbal1',
  52: 'chineseCymbal',
  53: 'rideBell',
  54: 'tambourine',
  55: 'splashCymbal',
  56: 'cowbell',
  57: 'crashCymbal2',
  58: 'vibraslap',
  59: 'rideCymbal2',
  60: 'hiBongo',
  61: 'lowBongo',
  62: 'muteHiConga',
  63: 'openHiConga',
  64: 'lowConga',
  65: 'highTimbale',
  66: 'lowTimbale',
  67: 'highAgogo',
  68: 'lowAgogo',
  69: 'cabasa',
  70: 'maracas',
  71: 'shortWhistle',
  72: 'longWhistle',
  73: 'shortGuiro',
  74: 'longGuiro',
  75: 'claves',
  76: 'hiWoodBlock',
  77: 'lowWoodBlock',
  78: 'muteCuica',
  79: 'openCuica',
  80: 'muteTriangle',
  81: 'openTriangle',
};

// Channels count from 1, as they do on MIDI gear
export const MIDI_PERCUSSION_CHANNEL = 10;

// The name of a note: the GM drum name on the percussion channel, otherwise e.g. C4
export function midiNoteDisplayName(note: number, channel: number, t: TFunction): string {
  const drum = channel === MIDI_PERCUSSION_CHANNEL ? GM_PERCUSSION[note] : undefined;
  return drum ? t(`midiOutput.percussion.${drum}`) : midiNoteName(note);
}

// A short name for a MIDI output
export function midiOutputLabel(output: proto.IOutput, t: TFunction): string | undefined {
  if (output.midiNote) {
    const { channel, note } = output.midiNote;
    return t('midiOutput.label.note', { name: midiNoteDisplayName(note, channel, t), channel });
  }
  if (output.midiControl) {
    return t('midiOutput.label.control', {
      control: output.midiControl.control,
      channel: output.midiControl.channel,
    });
  }
  if (output.midiPitchBend != null) {
    return t('midiOutput.label.pitchBend', { channel: output.midiPitchBend });
  }
  return undefined;
}
