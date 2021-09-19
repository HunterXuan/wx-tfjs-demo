import * as cocoSSD from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs-core'
import { getFrameSliceOptions } from '../utils/util';

const fontSize = 16;
const color = 'aqua';
const lineWidth = 2;

let model: cocoSSD.ObjectDetection;

export const load = async () => {
  model = await cocoSSD.load({
    modelUrl: 'https://ai.flypot.cn/models/coco-ssd/model.json'
  });

  await model.detect(tf.zeros([227, 227, 3], 'int32'));
};

export const isReady = () => {
  return !!model;
};

export const dispose = () => {
  model.dispose();
};

export const detect = async (frame: any, displaySize: {height: number, width: number}) => {
  const temp = tf.browser.fromPixels({
    data: new Uint8Array(frame.data),
    width: frame.width,
    height: frame.height,
  }, 4);
  const sliceOptions = getFrameSliceOptions(frame.width, frame.height, displaySize.width, displaySize.height);

  const pixels = await tf.tidy(() => {
    return tf.cast(tf.image.resizeBilinear(tf.slice(temp, sliceOptions.start, sliceOptions.size), [displaySize.height, displaySize.width]), 'int32');
  });

  const detectedObjects = await model.detect(pixels);

  temp.dispose();
  pixels.dispose();

  return detectedObjects;
}

export const drawBoxes = (ctx: WechatMiniprogram.CanvasContext, detectedObjects: cocoSSD.DetectedObject[]) => {
  if (!ctx || !detectedObjects) {
    return false;
  }

  const minScore = 0.3

  ctx.setFontSize(fontSize);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;

  detectedObjects.forEach(detectedObject => {
    if (detectedObject.score >= minScore) {
      ctx.rect(...(detectedObject.bbox));
      ctx.stroke();

      ctx.setFillStyle(color);
      ctx.fillText(detectedObject['class'], detectedObject.bbox[0], detectedObject.bbox[1] - 5);
    }
  });

  ctx.draw();
  return true;
};
