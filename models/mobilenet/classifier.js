import * as tf from '@tensorflow/tfjs-core'

import { MobileNet } from './mobilenet'
import { IMAGENET_CLASSES } from './classes'

import { getFrameSliceOptions } from '../../utils/util'

export class Classifier {
  mobileNet

  constructor() {}

  async load() {
    this.mobileNet = new MobileNet()
    await this.mobileNet.load()
  }

  classify(ab, size) {
    const data = new Uint8Array(ab)
    return tf.tidy(() => {
      const temp = tf.tensor(new Uint8Array(data), [size.height, size.width, 4])
      const sliceOptions = getFrameSliceOptions('back', size.width, size.height, 224, 224)

      const pixels = temp.slice(sliceOptions.start, sliceOptions.size).resizeBilinear([224, 224])

      const tensor = this.mobileNet.predict(pixels)

      return this.getTopKClasses(tensor)
    })
  }

  getTopKClasses(predictionTensor, k = 10) {
    let values = predictionTensor.dataSync()
    let result = []

    for (let i = 0; i < values.length; i++) {
      result.push({ index: i, label: IMAGENET_CLASSES[i], value: values[i] })
    }

    result = result.sort((a, b) => {
      return b.value - a.value
    }).slice(0, k)

    return result
  }

  dispose() {
    this.mobileNet.dispose()
  }
}