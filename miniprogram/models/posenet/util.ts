import * as posenet from '@tensorflow-models/posenet'

const color = 'aqua';
const boundingBoxColor = 'red';
const lineWidth = 2;

const toTuple = ({ y, x }: {y: number, x: number}): [number, number] => {
  return [y, x];
}

export const drawPoint = (ctx: WechatMiniprogram.CanvasContext, y: number, x: number, r: number, color: string) => {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

/**
 * Draws a line on a canvas, i.e. a joint
 */
export const drawSegment = ([ay, ax]: [number, number], [by, bx]: [number, number], color: string, scale: number, ctx: WechatMiniprogram.CanvasContext) => {
  ctx.beginPath();
  ctx.moveTo(ax * scale, ay * scale);
  ctx.lineTo(bx * scale, by * scale);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = color;
  ctx.stroke();
}

/**
 * Draws a pose skeleton by looking up all adjacent keypoints/joints
 */
// tslint:disable-next-line:no-any
export const drawSkeleton = (keypoints: posenet.Keypoint[], minConfidence: number, ctx: WechatMiniprogram.CanvasContext, scale = 1) => {
  const adjacentKeyPoints =
    posenet.getAdjacentKeyPoints(keypoints, minConfidence);

  // tslint:disable-next-line:no-any
  adjacentKeyPoints.forEach((keypoints) => {
    drawSegment(
      toTuple(keypoints[0].position), toTuple(keypoints[1].position), color,
      scale, ctx)
  });
}

/**
 * Draw pose keypoints onto a canvas
 */
// tslint:disable-next-line:no-any
export const drawKeypoints = (keypoints: posenet.Keypoint[], minConfidence: number, ctx: WechatMiniprogram.CanvasContext, scale = 1) => {
  for (let i = 0; i < keypoints.length; i++) {
    const keypoint = keypoints[i];

    if (keypoint.score < minConfidence) {
      continue;
    }

    const { y, x } = keypoint.position;
    drawPoint(ctx, y * scale, x * scale, 3, color);
  }
}

/**
 * Draw the bounding box of a pose. For example, for a whole person standing
 * in an image, the bounding box will begin at the nose and extend to one of
 * ankles
 */
// tslint:disable-next-line:no-any
export const drawBoundingBox = (keypoints: posenet.Keypoint[], ctx: WechatMiniprogram.CanvasContext) => {
  const boundingBox = posenet.getBoundingBox(keypoints)

  ctx.rect(
    boundingBox.minX, boundingBox.minY, boundingBox.maxX - boundingBox.minX,
    boundingBox.maxY - boundingBox.minY)

  ctx.strokeStyle = boundingBoxColor
  ctx.stroke()
}