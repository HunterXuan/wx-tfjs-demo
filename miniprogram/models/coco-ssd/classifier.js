import * as tf from '@tensorflow/tfjs-core'

import * as cocoSsd from '@tensorflow-models/coco-ssd'

import { getFrameSliceOptions } from '../utils/util'

const fontSize = 16
const color = 'aqua'
const lineWidth = 2

// 以下两个为 SSD 模型的地址，请下载放到自己的服务器，然后修改以下链接
const SSD_NET_URL = 'https://ai.flypot.cn/models/coco-ssd/model.json'
// const SSD_NET_BIN_URL = 'https://ai.flypot.cn/models/mobilenet/group1-shard1of1'

export class Classifier {
  // 指明前置或后置 front|back
  cameraPosition

  // 图像显示尺寸结构体 { width: Number, height: Number }
  displaySize

  // 神经网络模型
  ssdNet

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
      cocoSsd.load({
        modelUrl: SSD_NET_URL
      }).then(model => {
        this.ssdNet = model
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

  detect(frame) {
    return new Promise((resolve, reject) => {
      const tensor = tf.tidy(() => {
        const temp = tf.tensor(new Uint8Array(frame.data), [frame.height, frame.width, 4])
        const sliceOptions = getFrameSliceOptions(this.cameraPosition, frame.width, frame.height, this.displaySize.width, this.displaySize.height)

        return temp.slice(sliceOptions.start, sliceOptions.size).resizeBilinear([this.displaySize.height, this.displaySize.width]).asType('int32')
      })

      this.ssdNet.detect(tensor).then(res => {
        tensor.dispose()
        resolve(res)
      }).catch(err => {
        console.log(err)
        tensor.dispose()
        reject()
      })
    })
  }

  drawBoxes(ctx, boxes) {
    if (!ctx && !boxes) {
      return
    }

    const minScore = 0.3

    ctx.setFontSize(fontSize)
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth

    boxes.forEach(box => {
      if (box.score >= minScore) {
        ctx.rect(...(box.bbox))
        ctx.stroke()

        ctx.setFillStyle(color)
        ctx.fillText(box['class'], box.bbox[0], box.bbox[1] - 5)
      }
    })

    ctx.draw()
    return true
  }

  dispose() {
    this.ssdNet.dispose()
  }
}