import * as tf from '@tensorflow/tfjs-core'

import { MobileNet } from './mobilenet'
import { IMAGENET_CLASSES } from './classes'

import { getFrameSliceOptions } from '../utils/util'

// 以下两个为 MobileNet 模型的地址，请下载放到自己的服务器，然后修改以下链接
const MOBILE_NET_URL = 'https://ai.flypot.cn/models/mobilenet/model.json'
const MOBILE_NET_BIN_URL = 'https://ai.flypot.cn/models/mobilenet/group1-shard1of1'

export class Classifier {
  // 指明前置或后置 front|back
  cameraPosition

  // 图像显示尺寸结构体 { width: Number, height: Number }
  displaySize

  // 神经网络模型
  mobileNet

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
    // 如果需要加载已经保存的咖啡杯模型，请传 true 值
    return new Promise((resolve, reject) => {
      this.mobileNet = new MobileNet()

      this.mobileNet.load(MOBILE_NET_URL).then(_ => {
        this.ready = true
        resolve()
      }).catch(err => {
        reject(err)
      })
    })
  }

  isReady() {
    return this.ready
  }

  classify(frame) {
    return tf.tidy(() => {
      const temp = tf.tensor(new Uint8Array(frame.data), [frame.height, frame.width, 4])
      const sliceOptions = getFrameSliceOptions(this.cameraPosition, frame.width, frame.height, this.displaySize.width, this.displaySize.height)

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