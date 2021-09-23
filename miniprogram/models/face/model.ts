import * as face from '@tensorflow-models/face-landmarks-detection';
import * as tf from '@tensorflow/tfjs-core'
import { getFrameSliceOptions } from '../utils/util';
import { drawKeypoints } from './util';

let model: face.FaceLandmarksDetector;

export const load = async () => {
  model = await face.load();

  await model.estimateFaces({
    input: tf.zeros([128, 128, 3])
  });
};

export const isReady = () => {
  return !!model;
};

export const detectFaces = async (frame: any, displaySize: {height: number, width: number}) => {
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
  const faces = await model.estimateFaces({
    input: pixels,
    flipHorizontal
  });

  temp.dispose();
  pixels.dispose();

  return faces;
}

export const drawFaces = (ctx: WechatMiniprogram.CanvasContext, faces: face.FaceLandmarksPrediction[]) => {
  if (!ctx || !faces) {
    return;
  }

  faces.forEach(face => {
    drawKeypoints(face.scaledMesh as [number, number, number][], ctx);
  })

  ctx.draw();
}
