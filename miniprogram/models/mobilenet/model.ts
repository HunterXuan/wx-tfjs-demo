import * as mobilenet from '@tensorflow-models/mobilenet';
import * as tf from '@tensorflow/tfjs-core'
import { IMAGENET_CLASSES } from './classes';
import { getFrameSliceOptions } from '../utils/util';

const app = getApp();

let model: mobilenet.MobileNet;

export const load = async () => {
  if (isReady()) {
    return;
  }

  model = await mobilenet.load({
    version: 1,
    alpha: 0.25,
  });

  await warmUp();
};

export const isReady = () => {
  return !!model;
};

export const infer = async (frame: any, embedding = false) => {
  const temp = tf.browser.fromPixels({
    data: new Uint8Array(frame.data),
    width: frame.width,
    height: frame.height,
  }, 4);
  const sliceOptions = getFrameSliceOptions(frame.width, frame.height, app.globalData.systemInfo.windowWidth, app.globalData.systemInfo.windowWidth)

  const pixels = await tf.tidy(() => {
    return tf.image.resizeBilinear(tf.slice(temp, sliceOptions.start, sliceOptions.size), [224, 224]);
  });

  const logits = await model.infer(pixels, embedding) as tf.Tensor2D;

  temp.dispose();
  pixels.dispose();

  return logits;
};

export const classify = async (frame: any, topK = 10) => {
  const logits = await infer(frame);
  const result = await getTopKClasses(logits, topK);

  logits.dispose();

  return result;
};

export const warmUp = async () => {
  await model.infer(tf.randomNormal([1, 224, 224, 3]));
};

const getTopKClasses = async (logits: tf.Tensor2D, topK: number):
    Promise<Array<{className: string, probability: number}>> => {
  const softmax = tf.softmax(logits);
  const values = await softmax.data();
  softmax.dispose();

  const valuesAndIndices = [];
  for (let i = 0; i < values.length; i++) {
    valuesAndIndices.push({value: values[i], index: i});
  }
  valuesAndIndices.sort((a, b) => {
    return b.value - a.value;
  });
  const topkValues = new Float32Array(topK);
  const topkIndices = new Int32Array(topK);
  for (let i = 0; i < topK; i++) {
    topkValues[i] = valuesAndIndices[i].value;
    topkIndices[i] = valuesAndIndices[i].index;
  }

  const topClassesAndProbs = [];
  for (let i = 0; i < topkIndices.length; i++) {
    topClassesAndProbs.push({
      className: IMAGENET_CLASSES[topkIndices[i]],
      probability: topkValues[i]
    });
  }
  return topClassesAndProbs;
}