/**
 * imageCompressor.js
 * Utilidad para comprimir y redimensionar imágenes en el navegador antes de enviarlas al backend.
 * Reduce fotos de 5-15MB (cámara celular/tablet) a 200-500KB preservando excelente nitidez.
 */

export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.82,
    mimeType = 'image/jpeg'
  } = options;

  if (!file || !file.type.startsWith('image/')) {
    return file;
  }

  // Si ya es un archivo muy pequeño (< 250KB), no es necesario comprimir
  if (file.size < 250 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calcular nueva escala manteniendo la relación de aspecto
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(file);
        }

        // Dibujar imagen escalada
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }
            // Si por alguna razón el blob resultante fuera mayor que el original, devolver original
            if (blob.size >= file.size) {
              return resolve(file);
            }

            const fileName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
            const compressedFile = new File([blob], fileName, {
              type: mimeType,
              lastModified: Date.now()
            });

            resolve(compressedFile);
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => resolve(file);
    };

    reader.onerror = () => resolve(file);
  });
}
