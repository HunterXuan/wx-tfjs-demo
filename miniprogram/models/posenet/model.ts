import * as posenet from '@tensorflow-models/posenet';
import * as tf from '@tensorflow/tfjs-core'
import { getFrameSliceOptions } from '../utils/util';
import { drawKeypoints, drawSkeleton } from './util';

let model: posenet.PoseNet;

export const load = async () => {
  model = await posenet.load({
    architecture: 'MobileNetV1',
    outputStride: 16,
    inputResolution: 193,
    multiplier: 0.5,
  });

  await model.estimateSinglePose(tf.zeros([513, 513, 3]));
};

export const isReady = () => {
  return !!model;
};

export const dispose = () => {
  model.dispose();
};

export const detectSinglePose = async (frame: any, displaySize: {height: number, width: number}) => {
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
  const pose = await model.estimateSinglePose(pixels, { flipHorizontal });

  temp.dispose();
  pixels.dispose();

  return pose;
}

export const drawSinglePose = (ctx: WechatMiniprogram.CanvasContext, pose: posenet.Pose) => {
  if (!ctx || !pose) {
    return;
  }

  const minPoseConfidence = 0.3;
  const minPartConfidence = 0.3;

  if (pose.score >= minPoseConfidence) {
    drawKeypoints(pose.keypoints, minPartConfidence, ctx);
    drawSkeleton(pose.keypoints, minPartConfidence, ctx);
  }

  ctx.draw();
  return pose;
}
