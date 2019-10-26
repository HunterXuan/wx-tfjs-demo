import * as tf from '@tensorflow/tfjs-core'

import { MobileNet } from './mobilenet'

import { getFrameSliceOptions } from '../../utils/util'

export class Squeezer {
  mobileNet

  constructor() {}

  async load() {
    this.mobileNet = new MobileNet()
    await this.mobileNet.load()
  }

  squeeze(ab, size) {
    const data = new Uint8Array(ab)
    return tf.tidy(() => {
      const temp = tf.tensor(new Uint8Array(data), [size.height, size.width, 4])
      const sliceOptions = getFrameSliceOptions('back', size.width, size.height, 224, 224)

      const pixels = temp.slice(sliceOptions.start, sliceOptions.size).resizeBilinear([224, 224])

      const tensor = this.mobileNet.squeeze(pixels)

      return tensor
    })
  }

  dispose() {
    this.mobileNet.dispose()
  }
}