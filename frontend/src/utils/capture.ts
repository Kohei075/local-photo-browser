/**
 * Renders the media (img/video) currently shown inside a container onto a canvas,
 * reproducing each element's on-screen size, object-fit and CSS transform (zoom/pan).
 *
 * Only <img>/<video> are drawn, so overlay buttons and browser/OS chrome never
 * appear in the result.
 */

function drawMedia(
  ctx: CanvasRenderingContext2D,
  el: HTMLImageElement | HTMLVideoElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
) {
  const isVideo = el instanceof HTMLVideoElement;
  const nw = isVideo ? el.videoWidth : el.naturalWidth;
  const nh = isVideo ? el.videoHeight : el.naturalHeight;
  if (!nw || !nh) return;

  const fit = getComputedStyle(el).objectFit;
  if (fit === 'cover') {
    const scale = Math.max(dw / nw, dh / nh);
    const sw = dw / scale;
    const sh = dh / scale;
    const sx = (nw - sw) / 2;
    const sy = (nh - sh) / 2;
    ctx.drawImage(el, sx, sy, sw, sh, dx, dy, dw, dh);
  } else if (fit === 'contain') {
    const scale = Math.min(dw / nw, dh / nh);
    const rw = nw * scale;
    const rh = nh * scale;
    ctx.drawImage(el, dx + (dw - rw) / 2, dy + (dh - rh) / 2, rw, rh);
  } else {
    ctx.drawImage(el, dx, dy, dw, dh);
  }
}

export function captureContainer(container: HTMLElement): HTMLCanvasElement {
  const rect = container.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.scale(dpr, dpr);

  // Fill the backdrop so letterboxed areas match the viewer background.
  const bg = getComputedStyle(container).backgroundColor;
  ctx.fillStyle = bg && bg !== 'rgba(0, 0, 0, 0)' ? bg : '#000';
  ctx.fillRect(0, 0, rect.width, rect.height);

  const medias = container.querySelectorAll<HTMLImageElement | HTMLVideoElement>('img, video');
  medias.forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    if (getComputedStyle(el).visibility === 'hidden') return;

    ctx.save();
    // Clip to the element's container (which clips overflow on screen via
    // overflow:hidden), so a zoomed image stays within its own cell/viewport.
    const clipEl = el.parentElement;
    if (clipEl) {
      const cr = clipEl.getBoundingClientRect();
      ctx.beginPath();
      ctx.rect(cr.left - rect.left, cr.top - rect.top, cr.width, cr.height);
      ctx.clip();
    }
    drawMedia(ctx, el, r.left - rect.left, r.top - rect.top, r.width, r.height);
    ctx.restore();
  });

  return canvas;
}
