import * as bodypix from '@tensorflow-models/body-pix';
import * as tf from '@tensorflow/tfjs-core'
import { getFrameSliceOptions } from '../utils/util';

let model: bodypix.BodyPix;

export const load = async () => {
  model = await bodypix.load({
    architecture: 'MobileNetV1',
    outputStride: 16,
    multiplier: 0.5,
  });

  await model.segmentMultiPerson(tf.zeros([73, 73, 3]))
};

export const dispose = () => {
  model.dispose();
};

export const isReady = () => {
  return !!model;
};

export const detectBodySegmentation = async (frame: any, displaySize: {height: number, width: number}) => {
  const temp = tf.browser.fromPixels({
    data: new Uint8Array(frame.data),
    width: frame.width,
    height: frame.height,
  }, 4);
  const sliceOptions = getFrameSliceOptions(frame.width, frame.height, displaySize.width, displaySize.height);

  const pixels = await tf.tidy(() => {
    return tf.image.resizeBilinear(tf.slice(temp, sliceOptions.start, sliceOptions.size), [displaySize.height, displaySize.width]);
  });

  // since images are being fed from a webcam
  const flipHorizontal = false
  const segmentation = await model.segmentPerson(pixels, { flipHorizontal, internalResolution: 'medium', segmentationThreshold: 0.5 });

  temp.dispose();
  pixels.dispose();

  return segmentation;
}

export const toMaskImageData = (segmentation: bodypix.SemanticPersonSegmentation, maskBackground = true) => {
  const { width, height, data } = segmentation;
  const bytes = new Uint8ClampedArray(width * height * 4);

  for (let i = 0; i < height * width; ++i) {
    const shouldMask = maskBackground ? 1 - data[i] : data[i];
    // alpha will determine how dark the mask should be.
    // const alpha = shouldMask * 255
    const alpha = shouldMask * 200;

    const j = i * 4;
    bytes[j + 0] = 0;
    bytes[j + 1] = 0;
    bytes[j + 2] = 0;
    bytes[j + 3] = Math.round(alpha);
  }

  return { data: bytes, width: width, height: height };
};
