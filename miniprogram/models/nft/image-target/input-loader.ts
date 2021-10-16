import * as tf from '@tensorflow/tfjs-core';

export class InputLoader {
  constructor() {
    //
  }

  // input is instance of HTMLVideoElement or HTMLImageElement
  loadInput(input: { data: any; width: any; height: any; }) {
    return tf.tidy(() => {
      let inputImage = tf.browser.fromPixels({
        data: new Uint8Array(input.data),
        width: input.width,
        height: input.height,
      });
      inputImage = tf.mean(inputImage, 2);
      return inputImage;
    });
  }
}