import { getPalette } from './palettes.js';

export const ALGORITHMS = Object.freeze({
  nearest: 'nearest',
  threshold: 'nearest',
  'ordered-bayer-4': 'ordered-bayer-4',
  bayer: 'ordered-bayer-4',
  'floyd-steinberg': 'floyd-steinberg',
  floyd: 'floyd-steinberg',
  atkinson: 'atkinson',
});

const BAYER_4 = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
];

export function normalizeAlgorithm(algorithm = 'ordered-bayer-4') {
  const normalized = ALGORITHMS[algorithm];
  if (!normalized) {
    throw new TypeError(`Unknown dither algorithm: ${algorithm}`);
  }
  return normalized;
}

function cloneImageDataLike(imageData) {
  return {
    width: imageData.width,
    height: imageData.height,
    data: new Uint8ClampedArray(imageData.data),
  };
}

function assertImageDataLike(imageData) {
  if (!imageData || !Number.isFinite(imageData.width) || !Number.isFinite(imageData.height)) {
    throw new TypeError('Expected ImageData-like object with width and height.');
  }
  if (!imageData.data || imageData.data.length !== imageData.width * imageData.height * 4) {
    throw new TypeError('Expected RGBA data length to equal width * height * 4.');
  }
}

function clampByte(value) {
  return Math.max(0, Math.min(255, value));
}

function nearestByRgb(rgb, palette) {
  let nearest = palette[0];
  let nearestDistance = Infinity;

  palette.forEach((candidate) => {
    const red = rgb[0] - candidate[0];
    const green = rgb[1] - candidate[1];
    const blue = rgb[2] - candidate[2];
    const distance = red * red + green * green + blue * blue;
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = candidate;
    }
  });

  return nearest;
}

function writeRgb(data, index, rgb, alpha = 255) {
  data[index] = rgb[0];
  data[index + 1] = rgb[1];
  data[index + 2] = rgb[2];
  data[index + 3] = alpha;
}

function diffusionSpread(algorithm) {
  if (algorithm === 'atkinson') {
    return [
      [1, 0, 1 / 8], [2, 0, 1 / 8],
      [-1, 1, 1 / 8], [0, 1, 1 / 8], [1, 1, 1 / 8],
      [0, 2, 1 / 8],
    ];
  }

  return [
    [1, 0, 7 / 16],
    [-1, 1, 3 / 16], [0, 1, 5 / 16], [1, 1, 1 / 16],
  ];
}

export function estimateDecisionBudget({ width, height, palette }) {
  const colors = Array.isArray(palette) ? palette.length : getPalette(palette).length;
  return width * height * colors;
}

export function ditherImageData(imageData, options = {}) {
  assertImageDataLike(imageData);

  const algorithm = normalizeAlgorithm(options.algorithm);
  const palette = Array.isArray(options.palette)
    ? getPalette(options.palette)
    : getPalette(options.palette || 'gameboy');
  const target = options.inPlace ? imageData : cloneImageDataLike(imageData);
  const { data, width, height } = target;

  if (algorithm === 'nearest' || algorithm === 'ordered-bayer-4') {
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (y * width + x) * 4;
        const rgb = [data[index], data[index + 1], data[index + 2]];
        if (algorithm === 'ordered-bayer-4') {
          const threshold = (BAYER_4[(y % 4) * 4 + (x % 4)] / 15 - 0.5) * 64;
          rgb[0] = clampByte(rgb[0] + threshold);
          rgb[1] = clampByte(rgb[1] + threshold);
          rgb[2] = clampByte(rgb[2] + threshold);
        }
        writeRgb(data, index, nearestByRgb(rgb, palette), data[index + 3]);
      }
    }
    return target;
  }

  const buffer = new Float32Array(width * height * 3);
  for (let i = 0; i < width * height; i += 1) {
    buffer[i * 3] = data[i * 4];
    buffer[i * 3 + 1] = data[i * 4 + 1];
    buffer[i * 3 + 2] = data[i * 4 + 2];
  }

  const spread = diffusionSpread(algorithm);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const scalarIndex = y * width + x;
      const bufferIndex = scalarIndex * 3;
      const oldRgb = [
        clampByte(buffer[bufferIndex]),
        clampByte(buffer[bufferIndex + 1]),
        clampByte(buffer[bufferIndex + 2]),
      ];
      const rgb = nearestByRgb(oldRgb, palette);
      const error = [
        oldRgb[0] - rgb[0],
        oldRgb[1] - rgb[1],
        oldRgb[2] - rgb[2],
      ];
      writeRgb(data, scalarIndex * 4, rgb, data[scalarIndex * 4 + 3]);

      spread.forEach(([dx, dy, amount]) => {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) return;
        const nextIndex = (ny * width + nx) * 3;
        buffer[nextIndex] += error[0] * amount;
        buffer[nextIndex + 1] += error[1] * amount;
        buffer[nextIndex + 2] += error[2] * amount;
      });
    }
  }

  return target;
}

