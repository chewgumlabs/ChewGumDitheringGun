# Source Adapters

ChewGum Dithering Gun should stay source-agnostic.

The core only needs `ImageData`. Anything that can become a canvas can become a
source:

- a dropped 2D image
- a sprite sheet frame
- a video frame
- a WebGL render target
- a 3D model viewer rendered with Three.js or another engine

The adapter contract is:

```js
const source = await adapter.load(fileOrScene);
const imageData = adapter.sample(source, { size: 96 });
const dithered = ditherImageData(imageData, options);
```

Version 0.0.1 ships the 2D image path only. A future 3D adapter should render
the model to a canvas first, then feed the resulting canvas through the same
sampling and dithering functions. That keeps model parsing, camera controls,
and material decisions separate from the palette/dither math.

