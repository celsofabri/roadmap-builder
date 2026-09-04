/** Files above this are rejected before decoding, to keep uploads snappy. */
export const MAX_IMAGE_FILE_BYTES = 8 * 1024 * 1024;

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error('O arquivo não é uma imagem válida.'));
    img.onload = () => resolve(img);
    img.src = src;
  });
}

/**
 * Reads an image file, center-crops it to a square, and downsizes it to
 * `size`px so the result is small enough to keep in localStorage.
 */
export async function fileToSquareDataUrl(file: File, size = 128): Promise<string> {
  if (file.size > MAX_IMAGE_FILE_BYTES) {
    throw new Error('Imagem muito grande (máximo 8 MB).');
  }

  const dataUrl = await readAsDataURL(file);
  const img = await loadImage(dataUrl);

  const side = Math.min(img.width, img.height);
  const sx = (img.width - side) / 2;
  const sy = (img.height - side) / 2;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não foi possível processar a imagem neste navegador.');

  ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
  return canvas.toDataURL('image/png');
}
