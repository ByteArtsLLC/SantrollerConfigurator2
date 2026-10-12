import i18next from 'i18next';

// Shared, translated fragments for the pin / wiring tables in the guides. Signal and pin
// identifiers (GP4, GND, 3V3(OUT), SDA, ...) are passed through untranslated.
export const WIRING = 'guides.common.wiring';
export const IMAGE_ALT = 'guides.common.imageAlt';

export type WireColour =
  | 'black'
  | 'blue'
  | 'brown'
  | 'cyan'
  | 'green'
  | 'grey'
  | 'orange'
  | 'pink'
  | 'red'
  | 'white'
  | 'yellow';

const tr = (key: string, options?: Record<string, unknown>) => i18next.t(key, options) as string;

/** "Blue" */
export const wireColour = (colour: WireColour) => tr(`${WIRING}.colours.${colour}`);

/** "Cyan / Blue" */
export const wireColours = (...colours: WireColour[]) => colours.map(wireColour).join(' / ');

/** "Pin 7" */
export const pinNum = (n: number | string) => tr(`${WIRING}.pin`, { n });

/** "Pin 40 (VBUS)" */
export const pinWithLabel = (n: number | string, label: string) =>
  tr(`${WIRING}.pinWithLabel`, { n, label });

/** "Pin 7 (Blue)" */
export const pinWithColour = (n: number | string, colour: WireColour) =>
  pinWithLabel(n, wireColour(colour));

/** "3V3(OUT) (Pin 36)" */
export const labelWithPin = (label: string, n: number | string | undefined) =>
  tr(`${WIRING}.labelWithPin`, { label, n });

/** "GP18 (Pin 24)" */
export const gpWithPin = (gp: number | string, n: number | string | undefined) =>
  labelWithPin(`GP${gp}`, n);

/** "GP4 (Pin 6) + 1kΩ to 3V3" */
export const withPullup = (pin: string) => tr(`${WIRING}.pullup1k`, { pin });

/** "SDA (Data)" */
export const signalWithName = (signal: string, name: 'data' | 'clock') =>
  tr(`${WIRING}.signalWithName`, { signal, name: tr(`${WIRING}.names.${name}`) });

/** "Pico Pin 36 (3V3 OUT)" */
export const picoPinWithLabel = (n: number | string, label: string) =>
  tr(`${WIRING}.picoPinWithLabel`, { n, label });

/** "Pico GP Pin (e.g. GP4)" */
export const picoGpPinExample = (pin: string) => tr(`${WIRING}.picoGpPinExample`, { pin });

/** "Pico GP3 (USB host D-)" */
export const picoUsbHostPin = (pin: string, signal: string) =>
  tr(`${WIRING}.picoUsbHostPin`, { pin, signal });
