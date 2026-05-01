function rgbCube(steps) {
  const colors = [];
  steps.forEach((red) => {
    steps.forEach((green) => {
      steps.forEach((blue) => colors.push([red, green, blue]));
    });
  });
  return colors;
}

export const PALETTES = Object.freeze({
  monochrome: {
    label: '1-bit monochrome',
    colors: ['#000000', '#ffffff'],
  },
  gameboy: {
    label: 'Game Boy 4-color',
    colors: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
  },
  nes: {
    label: 'NES RGB 64-color',
    note: 'A named emulator-style RGB table; stock NES video does not define one canonical RGB palette.',
    colors: [
      '#545454', '#001e74', '#081090', '#300088',
      '#440064', '#5c0030', '#540400', '#3c1800',
      '#202a00', '#083a00', '#004000', '#003c00',
      '#00323c', '#000000', '#000000', '#000000',
      '#989698', '#084cc4', '#3032ec', '#5c1ee4',
      '#8814b0', '#a01464', '#982220', '#783c00',
      '#545a00', '#287200', '#087c00', '#007628',
      '#006678', '#000000', '#000000', '#000000',
      '#eceeec', '#4c9aec', '#787cec', '#b062ec',
      '#e454ec', '#ec58b4', '#ec6a64', '#d48820',
      '#a0aa00', '#74c400', '#4cd020', '#38cc6c',
      '#38b4cc', '#3c3c3c', '#000000', '#000000',
      '#eceeec', '#a8ccec', '#bcbcec', '#d4b2ec',
      '#ecaeec', '#ecaed4', '#ecb4b0', '#e4c490',
      '#ccd278', '#b4de78', '#a8e290', '#98e2b4',
      '#a0d6e4', '#a0a2a0', '#000000', '#000000',
    ],
  },
  rgb216: {
    label: 'RGB cube 216-color',
    colors: rgbCube([0, 51, 102, 153, 204, 255]),
  },
});

export function hexToRgb(hex) {
  if (typeof hex !== 'string' || !/^#[0-9a-f]{6}$/i.test(hex)) {
    throw new TypeError(`Expected #rrggbb color, got ${hex}`);
  }
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function normalizePalette(colors) {
  if (!Array.isArray(colors) || colors.length === 0) {
    throw new TypeError('Palette must be a non-empty array.');
  }

  return colors.map((color) => {
    if (Array.isArray(color) && color.length === 3) {
      return color.map((channel) => {
        if (!Number.isFinite(channel)) {
          throw new TypeError(`Invalid palette channel: ${channel}`);
        }
        return Math.max(0, Math.min(255, Math.round(channel)));
      });
    }
    return hexToRgb(color);
  });
}

export function getPalette(nameOrColors) {
  if (Array.isArray(nameOrColors)) return normalizePalette(nameOrColors);
  const entry = PALETTES[nameOrColors];
  if (!entry) {
    throw new TypeError(`Unknown palette: ${nameOrColors}`);
  }
  return normalizePalette(entry.colors);
}

export function listPalettes() {
  return Object.entries(PALETTES).map(([id, entry]) => ({
    id,
    label: entry.label,
    colorCount: entry.colors.length,
    note: entry.note || '',
  }));
}

