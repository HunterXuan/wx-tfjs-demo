const color = 'aqua';
const lineWidth = 2;

const fingerLookupIndices: { [x: string]: number[] }  = {
  thumb: [0, 1, 2, 3, 4],
  indexFinger: [0, 5, 6, 7, 8],
  middleFinger: [0, 9, 10, 11, 12],
  ringFinger: [0, 13, 14, 15, 16],
  pinky: [0, 17, 18, 19, 20]
};

export const drawPoint = (ctx: WechatMiniprogram.CanvasContext, y: number, x: number, r: number) => {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

export const drawLandmarks = (ctx: WechatMiniprogram.CanvasContext, keypoints: [number, number, number][]) => {
  const keypointsArray = keypoints;

  for (let i = 0; i < keypointsArray.length; i++) {
    const y = keypointsArray[i][0];
    const x = keypointsArray[i][1];
    drawPoint(ctx, x, y, 3);
  }

  const fingers = Object.keys(fingerLookupIndices);
  for (let i = 0; i < fingers.length; i++) {
    const finger = fingers[i];
    const points = fingerLookupIndices[finger].map((idx: number) => keypoints[idx]);
    drawPath(ctx, points);
  }
}

export function drawPath(ctx: WechatMiniprogram.CanvasContext, points: string | any[]) {
  for (let i = 1; i < points.length; i++) {
    const startPoint = points[i-1];
    const endPoint = points[i];

    ctx.beginPath();
    ctx.moveTo(startPoint[0], startPoint[1]);
    ctx.lineTo(endPoint[0], endPoint[1]);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.stroke();
  }
}