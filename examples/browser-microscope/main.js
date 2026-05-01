import {
  ditherImageData,
  drawPixelated,
  getPalette,
  listPalettes,
  sampleCanvasToImageData,
} from '../../src/index.js';

const fileInput = document.getElementById('file-input');
const algorithm = document.getElementById('algorithm');
const palette = document.getElementById('palette');
const resolution = document.getElementById('resolution');
const loadSampleButton = document.getElementById('load-sample');
const exportButton = document.getElementById('export');
const dropZone = document.getElementById('drop-zone');
const sourceCanvas = document.getElementById('source-canvas');
const outputCanvas = document.getElementById('output-canvas');

const sourceContext = sourceCanvas.getContext('2d');
let sourceBitmap = null;
let latestOutput = null;
const gumSampleUrl = '../assets/gum-demo.png';

listPalettes().forEach((entry) => {
  const option = document.createElement('option');
  option.value = entry.id;
  option.textContent = entry.label;
  if (entry.id === 'gameboy') option.selected = true;
  palette.append(option);
});

function drawSourcePreview() {
  if (!sourceBitmap) return;
  sourceContext.imageSmoothingEnabled = true;
  sourceContext.fillStyle = '#000';
  sourceContext.fillRect(0, 0, sourceCanvas.width, sourceCanvas.height);
  const rect = {
    width: sourceCanvas.width,
    height: sourceCanvas.height,
  };
  const scale = Math.min(rect.width / sourceBitmap.width, rect.height / sourceBitmap.height);
  const width = sourceBitmap.width * scale;
  const height = sourceBitmap.height * scale;
  sourceContext.drawImage(
    sourceBitmap,
    (rect.width - width) / 2,
    (rect.height - height) / 2,
    width,
    height,
  );
}

function render() {
  if (!sourceBitmap) return;
  drawSourcePreview();

  const size = Number.parseInt(resolution.value, 10);
  const selectedPalette = getPalette(palette.value);
  const { imageData } = sampleCanvasToImageData(sourceBitmap, size, {
    background: '#000000',
    smoothing: true,
  });

  latestOutput = ditherImageData(imageData, {
    algorithm: algorithm.value,
    palette: selectedPalette,
    inPlace: true,
  });
  drawPixelated(outputCanvas, latestOutput);
}

async function loadFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  sourceBitmap?.close?.();
  sourceBitmap = await createImageBitmap(file);
  render();
}

async function loadImageBlob(blob) {
  sourceBitmap?.close?.();
  sourceBitmap = await createImageBitmap(blob);
  render();
}

async function loadGumSample() {
  const response = await fetch(gumSampleUrl);
  if (!response.ok) return;
  await loadImageBlob(await response.blob());
}

fileInput.addEventListener('change', () => {
  loadFile(fileInput.files?.[0]);
});

loadSampleButton.addEventListener('click', loadGumSample);

[algorithm, palette, resolution].forEach((control) => {
  control.addEventListener('change', render);
});

dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropZone.classList.add('is-hot');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('is-hot');
});

dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropZone.classList.remove('is-hot');
  loadFile(event.dataTransfer?.files?.[0]);
});

exportButton.addEventListener('click', () => {
  if (!latestOutput) return;
  const link = document.createElement('a');
  link.download = `chewgum-dither-${resolution.value}-${palette.value}-${algorithm.value}.png`;
  link.href = outputCanvas.toDataURL('image/png');
  link.click();
});

loadGumSample();
