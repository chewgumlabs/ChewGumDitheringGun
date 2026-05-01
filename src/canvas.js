export function fitContain(sourceWidth, sourceHeight, targetWidth, targetHeight) {
  const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  return {
    x: Math.round((targetWidth - width) / 2),
    y: Math.round((targetHeight - height) / 2),
    width,
    height,
  };
}

export function sampleCanvasToImageData(source, size, options = {}) {
  const canvas = options.canvas || document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.imageSmoothingEnabled = Boolean(options.smoothing);
  context.fillStyle = options.background || '#000000';
  context.fillRect(0, 0, size, size);

  const sourceWidth = source.videoWidth || source.naturalWidth || source.width;
  const sourceHeight = source.videoHeight || source.naturalHeight || source.height;
  const rect = fitContain(sourceWidth, sourceHeight, size, size);
  context.drawImage(source, rect.x, rect.y, rect.width, rect.height);

  return {
    canvas,
    imageData: context.getImageData(0, 0, size, size),
    rect,
  };
}

export function drawPixelated(canvas, imageData, options = {}) {
  const context = canvas.getContext('2d');
  const staging = options.stagingCanvas || document.createElement('canvas');
  staging.width = imageData.width;
  staging.height = imageData.height;
  staging.getContext('2d').putImageData(imageData, 0, 0);

  context.imageSmoothingEnabled = false;
  context.fillStyle = options.background || '#000000';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(staging, 0, 0, canvas.width, canvas.height);
  return canvas;
}

