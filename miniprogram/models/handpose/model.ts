import * as handpose from '@tensorflow-models/handpose';
import * as tf from '@tensorflow/tfjs-core'
import { getFrameSliceOptions } from '../utils/util';
import { drawLandmarks } from './util';

let model: handpose.HandPose;

export const load = async () => {
  model = await handpose.load();

  await model.estimateHands(tf.zeros([128, 128, 3]));
};

export const isReady = () => {
  return !!model;
};

export const estimateHands = async (frame: any, displaySize: {height: number, width: number}) => {
  const temp = tf.browser.fromPixels({
    data: new Uint8Array(frame.data),
    width: frame.width,
    height: frame.height,
  }, 4);
  const sliceOptions = getFrameSliceOptions(frame.width, frame.height, displaySize.width, displaySize.height);

  const pixels = await tf.tidy(() => {
    return tf.image.resizeBilinear(tf.slice(temp, sliceOptions.start, sliceOptions.size), [displaySize.height, displaySize.width])
  });

  // since images are being fed from a webcam
  const flipHorizontal = false
  const hands = await model.estimateHands(pixels, flipHorizontal);

  temp.dispose();
  pixels.dispose();

  return hands;
}

export const drawSingleHand = (ctx: WechatMiniprogram.CanvasContext, hands: handpose.AnnotatedPrediction[]) => {
  if (!ctx || !hands || hands.length <= 0) {
    return;
  }

  drawLandmarks(ctx, hands[0].landmarks);

  ctx.draw();
}
