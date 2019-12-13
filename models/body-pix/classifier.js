import * as tf from '@tensorflow/tfjs-core'

import * as bodyPix from '@tensorflow-models/body-pix'

import { getFrameSliceOptions } from '../utils/util'

// 请下载模型放至自己的服务器，并替换链接
const BODYPIX_URL = 'https://ai.flypot.cn/models/body-pix/model.json'
// const BODYPIX_BIN_URL = 'https://ai.flypot.cn/models/body-pix/group1-shard1of1.bin'

export class Classifier {
  // 指明前置或后置 front|back
  cameraPosition

  // 图像显示尺寸结构体 { width: Number, height: Number }
  displaySize

  // 神经网络模型
  model

  // ready
  ready

  constructor(cameraPosition, displaySize) {
    this.cameraPosition = cameraPosition

    this.displaySize = {
      width: displaySize.width,
      height: displaySize.height
    }

    this.ready = false
  }

  load() {
    return new Promise((resolve, reject) => {
      bodyPix.load({
        modelUrl: BODYPIX_URL
      }).then((model) => {
        this.model = model
        // console.log(model.segmentPersonActivation)
        this.ready = true
        resolve()
      }).catch(err => {
        console.log(err)
        reject(err)
      })
    })
  }

  isReady() {
    return this.ready
  }

  detectBodySegmentation(frame) {
    const tensor = tf.tidy(() => {
      const temp = tf.tensor(new Uint8Array(frame.data), [frame.height, frame.width, 4])
      const sliceOptions = getFrameSliceOptions(this.cameraPosition, frame.width, frame.height, this.displaySize.width, this.displaySize.height)

      return temp.slice(sliceOptions.start, sliceOptions.size).resizeBilinear([this.displaySize.height, this.displaySize.width])
    })

    // 需要修改 body-pix 包里的 getInputSize 方法
    const segmentation = this.model.segmentPerson(tensor, {
      flipHorizontal: false,
      internalResolution: 'medium',
      segmentationThreshold: 0.5
    })

    return segmentation
  }

  toMaskImageData(segmentation, maskBackground = true) {
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

    return { data: bytes, width: width, height: height }
  }

  dispose() {
    this.model.dispose()
  }
}