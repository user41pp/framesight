import { getNeonColor } from '../config/colors.js';

/**
 * Render detection/segmentation/depth results onto the overlay canvas.
 */
export function renderOverlay(predictions, maskImageData, overlayCtx, task, classes) {
  // Depth: full-frame colorized map
  if (task === 'depth') {
    if (maskImageData) {
      overlayCtx.putImageData(maskImageData, 0, 0);
    }
    return;
  }

  if (!predictions || predictions.length === 0) return;

  const diag = Math.hypot(overlayCtx.canvas.width, overlayCtx.canvas.height);
  const lineWidth = Math.max(1.5, diag / 300);

  // Seg: draw mask overlay first
  if (task === 'seg' && maskImageData) {
    overlayCtx.putImageData(maskImageData, 0, 0);
  }

  // Draw bounding boxes
  drawBoundingBoxes(predictions, overlayCtx, lineWidth, classes);
}

function drawBoundingBoxes(predictions, ctx, lineWidth, classes) {
  const validPredictions = predictions.filter(
    (p) => classes?.classes?.[p.classIdx] != null,
  );

  // Group by class for batched rendering
  const byClass = {};
  validPredictions.forEach((p) => {
    if (!byClass[p.classIdx]) byClass[p.classIdx] = [];
    byClass[p.classIdx].push(p);
  });

  Object.entries(byClass).forEach(([classId, items]) => {
    const id = Number(classId);
    const fill = getNeonColor(id, 0.12);
    const border = getNeonColor(id, 0.8);
    const fillCSS = `rgba(${fill[0]},${fill[1]},${fill[2]},${fill[3]})`;
    const borderCSS = `rgba(${border[0]},${border[1]},${border[2]},${border[3]})`;
    const labelBg = `rgba(${border[0]},${border[1]},${border[2]},0.85)`;

    // Fill
    ctx.fillStyle = fillCSS;
    ctx.beginPath();
    items.forEach((p) => {
      const [x, y, w, h] = p.bbox;
      ctx.roundRect(x, y, w, h, 4);
    });
    ctx.fill();

    // Stroke
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = borderCSS;
    ctx.beginPath();
    items.forEach((p) => {
      const [x, y, w, h] = p.bbox;
      ctx.roundRect(x, y, w, h, 4);
    });
    ctx.stroke();

    // Labels
    const fontSize = Math.max(11, Math.min(14, ctx.canvas.width / 50));
    ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;

    items.forEach((p) => {
      const [x, y] = p.bbox;
      const text = `${classes.classes[p.classIdx]} ${(p.score * 100).toFixed(0)}%`;
      drawLabel(ctx, text, x, y, labelBg, fontSize);
    });
  });
}

function drawLabel(ctx, text, x, y, bgColor, fontSize) {
  const padding = 4;
  const textWidth = ctx.measureText(text).width;
  const height = fontSize + padding * 2;

  let textY = y - padding - 2;
  let rectY = y - height - 2;

  // Flip below box if too close to top
  if (rectY < 0) {
    textY = y + fontSize + padding + 2;
    rectY = y + 2;
  }

  // Background pill
  ctx.fillStyle = bgColor;
  const rectX = x - 1;
  const rectW = textWidth + padding * 2 + 2;
  ctx.beginPath();
  ctx.roundRect(rectX, rectY, rectW, height, 4);
  ctx.fill();

  // Text
  ctx.fillStyle = '#fff';
  ctx.fillText(text, x + padding, textY);
}
