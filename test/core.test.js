import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ditherImageData,
  estimateDecisionBudget,
  getPalette,
  listPalettes,
} from '../src/index.js';

function image(width, height, pixels) {
  return {
    width,
    height,
    data: new Uint8ClampedArray(pixels.flatMap(([r, g, b, a = 255]) => [r, g, b, a])),
  };
}

test('named palettes expose expected color counts', () => {
  const counts = Object.fromEntries(listPalettes().map((palette) => [palette.id, palette.colorCount]));
  assert.equal(counts.monochrome, 2);
  assert.equal(counts.gameboy, 4);
  assert.equal(counts.nes, 64);
  assert.equal(counts.rgb216, 216);
});

test('nearest-color dither maps pixels to supplied palette', () => {
  const source = image(2, 1, [
    [10, 10, 10],
    [245, 245, 245],
  ]);
  const result = ditherImageData(source, {
    algorithm: 'nearest',
    palette: ['#000000', '#ffffff'],
  });
  assert.deepEqual(Array.from(result.data), [
    0, 0, 0, 255,
    255, 255, 255, 255,
  ]);
  assert.notEqual(result.data, source.data);
});

test('inPlace mode mutates the input image data', () => {
  const source = image(1, 1, [[250, 0, 0]]);
  const result = ditherImageData(source, {
    algorithm: 'floyd-steinberg',
    palette: ['#000000', '#ff0000'],
    inPlace: true,
  });
  assert.equal(result, source);
  assert.deepEqual(Array.from(source.data), [255, 0, 0, 255]);
});

test('decision budget is pixel count times palette size', () => {
  assert.equal(estimateDecisionBudget({
    width: 24,
    height: 24,
    palette: getPalette('nes'),
  }), 36864);
});

