import * as tf from '@tensorflow/tfjs-core'
import { getFrameSliceOptions } from '../../utils/util'

export function detectBodySegmentation(image, videoWidth, videoHeight, net) {
  const video = tf.tidy(() => {
    const temp = tf.tensor(new Uint8Array(image.data), [image.height, image.width, 4])
    const sliceOptions = getFrameSliceOptions('front', image.width, image.height, videoWidth, videoHeight)

    return temp.slice(sliceOptions.start, sliceOptions.size).resizeBilinear([videoHeight, videoWidth])
  })

  const segmentation = net.estimatePersonSegmentation(video, 16, 0.35)

  return segmentation
}

export function toMaskImageData(segmentation, maskBackground=true) {
  const { width, height, data } = segmentation
  const bytes = new Uint8ClampedArray(width * height * 4)

  for (let i = 0; i < height * width; ++i) {
    const shouldMask = maskBackground ? 1 - data[i] : data[i]
    // alpha will determine how dark the mask should be.
    // const alpha = shouldMask * 255
    const alpha = shouldMask * 200

    const j = i * 4
    bytes[j + 0] = 0
    bytes[j + 1] = 0
    bytes[j + 2] = 0
    bytes[j + 3] = Math.round(alpha)
  }

  return {data: bytes, width: width, height: height}
}