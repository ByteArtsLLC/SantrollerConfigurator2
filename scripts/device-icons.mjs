// Generates monochrome device cover glyphs. Only alpha matters: the configurator
// renders .svg covers as a CSS mask tinted with the theme's text colour.
import { writeFileSync } from 'node:fs';

// Usage: node scripts/device-icons.mjs [outDir]
const out = process.argv[2] ?? new URL('../public/covers/devices', import.meta.url).pathname;
const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">` +
  `<g fill="none" stroke="#000" stroke-width="24" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>\n`;
const F = 'fill="#000" stroke="none"';
const rad = (d) => (d * Math.PI) / 180;
const pt = (cx, cy, r, deg) =>
  [cx + r * Math.cos(rad(deg)), cy + r * Math.sin(rad(deg))].map((v) => +v.toFixed(1));
const arc = (cx, cy, r, a0, a1) => {
  const [x0, y0] = pt(cx, cy, r, a0);
  const [x1, y1] = pt(cx, cy, r, a1);
  return `M${x0} ${y0} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
};

// IC package with pins on the left and right, and a symbol inside
const chip = (inner) => {
  let pins = '';
  for (const y of [184, 232, 280, 328]) pins += `M96 ${y} H136 M376 ${y} H416 `;
  return (
    `<path d="${pins}"/><rect x="136" y="128" width="240" height="256" rx="24"/>` +
    `<g stroke-width="16">${inner}</g>`
  );
};

// Guitar neck angled up to the right with the headstock at the top, as the guitar is usually pictured
const neck = (headstock, extra) =>
  `<g transform="translate(256 256) rotate(-30) scale(.94) translate(-270 -256)"><rect x="24" y="220" width="340" height="72" rx="8"/>${headstock}${extra}</g>`;
// The five frets sit next to the nut; slanted ones lean like the clone guitars' buttons
const fretButtons = (slanted) =>
  [0, 1, 2, 3, 4]
    .map((i) => {
      const x = 222 + i * 28;
      return slanted
        ? `<path d="M${x} 280 L${x + 8} 232 H${x + 26} L${x + 18} 280 Z" ${F}/>`
        : `<rect x="${x}" y="232" width="22" height="48" rx="5" ${F}/>`;
    })
    .join('');
// Touch slider strip partway down the neck
const slider =
  `<rect x="44" y="240" width="150" height="32" rx="16" stroke-width="10"/>` +
  [0, 1, 2, 3].map((i) => `<path d="M${74 + i * 30} 246 V266" stroke-width="6"/>`).join('');
// Circle as a subpath, so it cuts a hole when the shape uses the evenodd fill rule
const hole = (x, y, r) =>
  `M${x - r} ${y} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 `;
// World Tour headstock: flares out from the nut to pointed corners, with a V notch in the end
const wtHeadstock = `M360 220 C392 216 402 188 426 182 L506 178 L494 256 L506 334 L426 330 C402 324 392 296 360 292 Z`;
const wtTuners = [420, 448, 476].flatMap((x) => [
  [x, 220],
  [x, 292],
]);

// Filled triangular arrowhead with its tip at (x, y), pointing at angle deg
const head = (x, y, deg, len = 44, half = 28) => {
  const [bx, by] = pt(x, y, -len, deg);
  const [ax, ay] = pt(bx, by, half, deg + 90);
  const [cx, cy] = pt(bx, by, half, deg - 90);
  return `<path d="M${x} ${y} L${ax} ${ay} L${cx} ${cy} Z" ${F}/>`;
};

// Row of three addressable LED packages chained by the given data lines
const ledChain = (ys) =>
  [40, 206, 372]
    .map(
      (x) =>
        `<rect x="${x}" y="206" width="100" height="100" rx="12"/><circle cx="${x + 50}" cy="256" r="24" ${F}/>`
    )
    .join('') +
  ys.map((y) => `<path d="M140 ${y} H206 M306 ${y} H372" stroke-width="16"/>`).join('');

// Drum pad seen from above, and a cymbal with its bell
const drumPad = (x, y, r = 46) => `<circle cx="${x}" cy="${y}" r="${r}"/>`;
const cymbal = (x, y, r = 54) =>
  `<circle cx="${x}" cy="${y}" r="${r}" stroke-width="16"/><circle cx="${x}" cy="${y}" r="14" ${F}/>`;

// Gamepad body shared by the console controller glyphs
const pad = `<path d="M150 140 H362 C424 140 452 186 462 252 L478 360 C486 414 430 438 400 398 L356 340 H156 L112 398 C82 438 26 414 34 360 L50 252 C60 186 88 140 150 140 Z"/>`;

const icons = {
  adcBattery:
    `<rect x="96" y="96" width="290" height="150" rx="22"/><path d="M386 140 h30 v62 h-30"/>` +
    `<rect x="128" y="128" width="70" height="86" rx="6" ${F}/><rect x="216" y="128" width="70" height="86" rx="6" ${F}/>` +
    `<path d="M96 416 H170 V376 H226 V336 H282 V296 H338 V416 H416"/>`,
  powerManagement:
    `<rect x="76" y="156" width="330" height="200" rx="28"/><path d="M406 214 h34 v84 h-34"/>` +
    `<path d="M262 186 L192 266 H250 L226 326 L298 242 H240 Z" ${F}/>`,
  max1704x: chip(
    `<rect x="184" y="216" width="128" height="80" rx="12"/><path d="M312 238 h16 v36 h-16"/>` +
      `<rect x="202" y="234" width="56" height="44" rx="4" ${F}/>`
  ),
  ads1115: chip(`<path d="M176 256 C200 176 232 176 256 256 S312 336 336 256"/>`),
  stp16cpc: chip(
    `<path d="M176 206 V326 L262 266 Z" ${F}/><path d="M272 206 V326 M286 196 L326 156 M302 156 H326 V180 M300 236 L340 196 M316 196 H340 V220" stroke-width="14"/>`
  ),
  vtechExpander: chip(
    `<path d="M184 216 H320 M288 184 L320 216 L288 248 M328 296 H192 M224 264 L192 296 L224 328"/>`
  ),
  xboxOneAuth: chip(
    `<circle cx="206" cy="256" r="36"/><path d="M242 256 H336 M304 256 V292 M336 256 V300"/>`
  ),
  multiplexer:
    `<path d="M200 96 L320 176 V336 L200 416 Z"/>` +
    [136, 184, 232, 280, 328, 376].map((y) => `<path d="M88 ${y} H200"/>`).join('') +
    `<path d="M320 256 H432 M260 376 V440"/>`,
  peripheral:
    `<rect x="166" y="80" width="180" height="356" rx="18"/><rect x="224" y="52" width="64" height="44" rx="8" ${F}/>` +
    [0, 1, 2, 3, 4, 5, 6]
      .map(
        (i) =>
          `<circle cx="198" cy="${140 + i * 44}" r="10" ${F}/><circle cx="314" cy="${140 + i * 44}" r="10" ${F}/>`
      )
      .join('') +
    `<rect x="226" y="214" width="60" height="60" rx="6" ${F}/>`,
  mpr121: `<circle cx="256" cy="256" r="48" ${F}/><circle cx="256" cy="256" r="112"/><circle cx="256" cy="256" r="176" stroke-opacity=".45"/>`,
  debug:
    `<path d="M206 176 a50 50 0 0 1 100 0"/><ellipse cx="256" cy="300" rx="92" ry="124"/><path d="M256 196 V404"/>` +
    `<path d="M228 132 L200 84 M284 132 L312 84 M164 248 L100 216 M160 304 H92 M170 362 L106 400 M348 248 L412 216 M352 304 H420 M342 362 L406 400"/>`,
  dmx:
    `<circle cx="256" cy="268" r="168"/><rect x="226" y="64" width="60" height="52" rx="8" ${F}/>` +
    [
      [256, 268],
      [176, 232],
      [336, 232],
      [200, 336],
      [312, 336],
    ]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="24" ${F}/>`)
      .join(''),
  midiSerial:
    `<circle cx="256" cy="256" r="176"/><rect x="230" y="370" width="52" height="44" rx="8" ${F}/>` +
    [180, 225, 270, 315, 0]
      .map((a) => {
        const [x, y] = pt(256, 256, 104, a);
        return `<circle cx="${x}" cy="${y}" r="24" ${F}/>`;
      })
      .join(''),
  encoder:
    `<circle cx="256" cy="256" r="176"/>` +
    Array.from({ length: 16 }, (_, i) => {
      const a = i * 22.5;
      const [x0, y0] = pt(256, 256, 112, a);
      const [x1, y1] = pt(256, 256, 146, a);
      return `<path d="M${x0} ${y0} L${x1} ${y1}" stroke-width="20"/>`;
    }).join('') +
    `<circle cx="256" cy="256" r="44" ${F}/>`,
  // Behringer Infinium X1 from the side: end brackets holding two guide rails, the carriage
  // with its flat fader stem, the clear optical shutter under it and the sensor on the PCB
  infiniumFader:
    `<rect x="64" y="368" width="384" height="26" rx="6" ${F}/>` +
    `<path d="M36 176 H100 V408 H36 Z M412 176 H476 V408 H412 Z ${hole(68, 202, 10)}${hole(444, 202, 10)}" fill-rule="evenodd" ${F}/>` +
    `<path d="M100 238 H412 M100 280 H412" stroke-width="18"/>` +
    `<rect x="262" y="212" width="88" height="94" rx="8" ${F}/>` +
    `<path d="M292 212 V92 L300 82 H322 V212" stroke-width="12"/>` +
    `<rect x="252" y="306" width="120" height="52" rx="4" stroke-width="8" stroke-opacity=".5"/>` +
    `<path d="M166 368 V330 L186 314 H226 L242 330 V368 Z" ${F}/>`,
  // DJ Hero turntable from above: control panel with effects knob and crossfader on the
  // left, square deck whose platter has a strobe dot rim and the three pill buttons
  djhTurntable:
    `<rect x="28" y="120" width="148" height="272" rx="18" stroke-width="14"/>` +
    `<path d="M28 184 H176" stroke-width="8"/>` +
    `<rect x="56" y="222" width="92" height="32" rx="16" stroke-width="8"/><circle cx="128" cy="238" r="14" ${F}/>` +
    `<rect x="52" y="306" width="100" height="32" rx="16" stroke-width="8"/><rect x="70" y="294" width="20" height="56" rx="5" ${F}/>` +
    `<rect x="190" y="120" width="294" height="272" rx="18" stroke-width="14"/>` +
    `<circle cx="337" cy="256" r="118" stroke-width="12"/>` +
    Array.from({ length: 40 }, (_, i) => {
      const [x, y] = pt(337, 256, 104, i * 9);
      return `<circle cx="${x}" cy="${y}" r="4" ${F}/>`;
    }).join('') +
    `<circle cx="337" cy="256" r="72" stroke-width="5" stroke-opacity=".5"/>` +
    [264, 293, 322]
      .map((x) => `<rect x="${x - 10}" y="232" width="20" height="48" rx="10" stroke-width="7"/>`)
      .join('') +
    `<circle cx="362" cy="256" r="14" ${F}/>`,
  matrix:
    `<path d="M160 104 V408 M256 104 V408 M352 104 V408 M104 160 H408 M104 256 H408 M104 352 H408" stroke-width="16"/>` +
    [160, 256, 352]
      .flatMap((x) => [160, 256, 352].map((y) => `<circle cx="${x}" cy="${y}" r="26" ${F}/>`))
      .join(''),
  toggle: `<rect x="80" y="168" width="352" height="176" rx="88"/><circle cx="344" cy="256" r="60" ${F}/>`,
  usbHost:
    `<path d="M256 410 V112"/><path d="M256 52 L216 120 H296 Z" ${F}/>` +
    `<path d="M256 340 L170 284 V224 M256 300 L342 250 V196"/><circle cx="170" cy="206" r="30" ${F}/>` +
    `<rect x="310" y="148" width="64" height="56" rx="6" ${F}/><circle cx="256" cy="420" r="40" ${F}/>`,
  bluetooth: `<path d="M168 176 L344 336 L256 420 V92 L344 176 L168 336" stroke-width="30"/>`,
  xbox360Rf:
    `<rect x="40" y="120" width="432" height="272" rx="48" stroke-width="16"/>` +
    [0, 90, 180, 270]
      .map(
        (a) =>
          `<path d="${arc(256, 256, 96, a - 90 + 10, a - 10)}" stroke-width="36" stroke-linecap="butt"/>`
      )
      .join('') +
    `<path d="${arc(256, 256, 30, -50, 230)}" stroke-width="14"/><path d="M256 208 V250" stroke-width="14"/>`,
  psx:
    pad +
    `<path d="M144 206 V270 M112 238 H176" stroke-width="28"/>` +
    `<path d="M368 184 L385 212 H351 Z M404 236 m-15 0 a15 15 0 1 0 30 0 a15 15 0 1 0 -30 0 M356 260 L380 284 M380 260 L356 284 M318 222 h28 v28 h-28 Z" stroke-width="10"/>` +
    `<circle cx="206" cy="292" r="24" stroke-width="13"/><circle cx="298" cy="292" r="24" stroke-width="13"/>`,
  // SNES pad: gentle dogbone, shoulder buttons on top, d-pad in a round recess,
  // face buttons in two slanted grooves, slanted Select and Start
  snes:
    `<path d="M152 154 C200 154 220 166 256 166 C292 166 312 154 360 154 A102 102 0 0 1 360 358 C312 358 292 346 256 346 C220 346 200 358 152 358 A102 102 0 0 1 152 154 Z"/>` +
    `<path d="${arc(152, 256, 120, -158, -104)}" stroke-width="18"/><path d="${arc(360, 256, 120, -76, -22)}" stroke-width="18"/>` +
    `<circle cx="146" cy="262" r="62" stroke-width="8" stroke-opacity=".45"/>` +
    `<path d="M146 216 V308 M100 262 H192" stroke-width="30" stroke-linecap="butt"/>` +
    `<path d="M320 262 L362 220 M362 304 L404 262" stroke-width="60" stroke-opacity=".3"/>` +
    [
      [362, 220],
      [404, 262],
      [362, 304],
      [320, 262],
    ]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="22" ${F}/>`)
      .join('') +
    `<path d="M220 298 L240 278 M262 298 L282 278" stroke-width="16"/>`,
  joybus:
    pad +
    `<circle cx="148" cy="236" r="36" stroke-width="14"/><circle cx="148" cy="236" r="16" ${F}/>` +
    `<path d="M204 272 V316 M182 294 H226" stroke-width="16"/>` +
    `<circle cx="326" cy="290" r="22" stroke-width="12"/><circle cx="326" cy="290" r="10" ${F}/>` +
    `<circle cx="362" cy="226" r="34" ${F}/><circle cx="296" cy="248" r="16" ${F}/>` +
    `<path d="${arc(362, 226, 58, -40, 35)}" stroke-width="20"/><path d="${arc(362, 226, 58, -155, -95)}" stroke-width="20"/>`,
  // World Tour style headstock with 3+3 tuner holes, frets by the nut, touch slider further down
  gh5Neck: neck(
    `<path d="${wtHeadstock} ${wtTuners.map(([x, y]) => hole(x, y, 9)).join('')}" fill-rule="evenodd" ${F}/>`,
    fretButtons(false) + slider
  ),
  // World Tour clone: same headstock outline with metal tuner pegs standing up off the face
  crazyGuitarNeck: neck(
    `<path d="${wtHeadstock}" stroke-width="16"/>` +
      wtTuners
        .map(
          ([x, y]) =>
            `<circle cx="${x}" cy="${y}" r="11" ${F}/><path d="M${x} ${y} l14 -22" stroke-width="10"/>`
        )
        .join(''),
    fretButtons(true) + slider
  ),
  protarNeck:
    `<rect x="40" y="168" width="92" height="176" rx="16"/>` +
    [0, 1, 2]
      .map(
        (i) =>
          `<circle cx="70" cy="${206 + i * 50}" r="12" ${F}/><circle cx="102" cy="${206 + i * 50}" r="12" ${F}/>`
      )
      .join('') +
    `<rect x="132" y="176" width="348" height="160" rx="10"/>` +
    Array.from(
      { length: 6 },
      (_, i) => `<path d="M132 ${200 + i * 22} H480" stroke-width="5" stroke-opacity=".7"/>`
    ).join('') +
    Array.from(
      { length: 4 },
      (_, i) => `<path d="M${204 + i * 72} 176 V336" stroke-width="12"/>`
    ).join(''),
  // Les Paul: long headstock flaring to the open book top, tuner keys out the sides,
  // frets by the nut, solo frets further down
  crkdNeck: neck(
    `<path d="M360 216 L372 214 L506 192 Q518 191 514 204 L502 234 L516 256 L502 278 L514 308 Q518 321 506 320 L372 298 L360 296 Z ` +
      [410, 448, 486]
        .map((x) => {
          const w = 42 + ((x - 372) / 134) * 22 - 17;
          return hole(x, 256 - w, 8) + hole(x, 256 + w, 8);
        })
        .join('') +
      `" fill-rule="evenodd" ${F}/>` +
      [410, 448, 486]
        .map((x) => {
          const w = 42 + ((x - 372) / 134) * 22;
          return `<path d="M${x} ${256 - w} v-22 M${x} ${256 + w} v22" stroke-width="14"/>`;
        })
        .join(''),
    fretButtons(false) +
      [0, 1, 2, 3, 4]
        .map(
          (i) => `<rect x="${44 + i * 30}" y="238" width="20" height="36" rx="5" stroke-width="8"/>`
        )
        .join('')
  ),
  // Wii Remote with a Nunchuk plugged into its extension port
  wii:
    `<rect x="296" y="36" width="104" height="432" rx="40"/>` +
    `<path d="M348 92 V156 M316 124 H380" stroke-width="22" stroke-linecap="butt"/>` +
    `<circle cx="348" cy="206" r="22" ${F}/>` +
    [320, 348, 376].map((x) => `<circle cx="${x}" cy="282" r="8" ${F}/>`).join('') +
    `<circle cx="348" cy="340" r="12" ${F}/><circle cx="348" cy="382" r="12" ${F}/>` +
    [324, 340, 356, 372].map((x) => `<circle cx="${x}" cy="434" r="5" ${F}/>`).join('') +
    `<path d="M92 152 C92 84 216 84 216 152 L194 304 C188 352 132 352 124 304 Z"/>` +
    `<circle cx="154" cy="148" r="26" stroke-width="16"/>` +
    `<path d="M158 346 C152 470 280 500 330 468" stroke-width="12"/>`,
  ws2812: ledChain([256]),
  apa102: ledChain([236, 276]),
  cycle:
    `<path d="${arc(256, 256, 160, -50, 236)}" stroke-width="32"/>` +
    head(...pt(...pt(256, 256, 160, 260), 30, 350), 350, 88, 52),
  accelerometer:
    `<path d="M208 312 V120 M208 312 H392 M208 312 L118 402"/>` +
    head(208, 72, -90) +
    head(440, 312, 0) +
    head(84, 436, 135) +
    `<path d="${arc(208, 150, 84, -30, 210)}" stroke-width="14" stroke-opacity=".5" transform="matrix(1 0 0 .35 0 97)"/>` +
    `<circle cx="208" cy="312" r="26" ${F}/>`,
  // Band Hero kit at three quarters: three pads in front, round cymbals raised behind
  bhDrum:
    `<path d="M112 184 V282 M400 184 V282 M100 358 L76 452 M412 358 L436 452 M256 330 V420" stroke-width="16"/>` +
    `<rect x="200" y="176" width="112" height="44" rx="10" stroke-width="16"/>` +
    [112, 400]
      .map(
        (x) =>
          `<ellipse cx="${x}" cy="150" rx="88" ry="34" stroke-width="18"/><ellipse cx="${x}" cy="150" rx="16" ry="8" ${F}/>`
      )
      .join('') +
    [
      [100, 320],
      [256, 292],
      [412, 320],
    ]
      .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="70" ry="32" stroke-width="22"/>`)
      .join('') +
    `<rect x="226" y="412" width="60" height="48" rx="10" ${F}/>`,
  // GH World Tour kit from the front: three low pads, two raised cymbals
  worldTourDrum:
    `<path d="M60 330 H452 M100 330 L72 440 M412 330 L440 440 M180 330 V164 M332 330 V164" stroke-width="16"/>` +
    `<ellipse cx="180" cy="148" rx="76" ry="16" ${F}/><ellipse cx="332" cy="148" rx="76" ry="16" ${F}/>` +
    [100, 256, 412]
      .map(
        (x) =>
          `<ellipse cx="${x}" cy="292" rx="58" ry="20" ${F}/><path d="M${x} 300 V330" stroke-width="16"/>`
      )
      .join('') +
    `<rect x="226" y="392" width="60" height="56" rx="10" ${F}/>`,
  // CRKD kit, traced from the crkd.gg render: four pads on a winged frame, three raised
  // cymbals, control module at the front with the sticks clipped under it, two legged stand
  crkdDrum:
    `<path d="M164 252 V452 M348 252 V452 M136 330 H178 M334 330 H376" stroke-width="18"/>` +
    `<path d="M108 120 L130 200 M256 104 V176 M404 120 L384 196" stroke-width="16"/>` +
    [
      [102, 104, 60, 18, -4],
      [256, 88, 56, 16, 0],
      [410, 100, 60, 18, 4],
    ]
      .map(
        ([x, y, rx, ry, r]) =>
          `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${r} ${x} ${y})" ${F}/><rect x="${x - 7}" y="${y - 32}" width="14" height="22" rx="3" ${F}/>`
      )
      .join('') +
    `<path d="M54 236 L64 268 L206 244 M306 244 L448 268 L458 236" stroke-width="14"/>` +
    [
      [84, 222, 56],
      [198, 192, 50],
      [314, 192, 50],
      [428, 222, 56],
    ]
      .map(([x, y, rx]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="26" stroke-width="18"/>`)
      .join('') +
    `<rect x="210" y="234" width="92" height="44" rx="8" ${F}/>` +
    `<path d="M140 290 H372 M140 302 H372" stroke-width="7"/>`,
};

for (const [name, body] of Object.entries(icons)) writeFileSync(`${out}/${name}.svg`, svg(body));
console.log(Object.keys(icons).length, 'icons');
