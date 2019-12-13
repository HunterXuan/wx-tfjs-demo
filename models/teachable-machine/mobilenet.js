import * as tfc from '@tensorflow/tfjs-converter'
import * as tf from '@tensorflow/tfjs-core'

const MODEL_STORAGE_DIR = 'https://ai.flypot.cn/models/'
const MODEL_FILE_URL = 'mobilenet/model.json'
const PREPROCESS_DIVISOR = 255 / 2

export class MobileNet {
  model

  constructor() { }

  load(modelUrl) {
    return new Promise((resolve, reject) => {
      tfc.loadGraphModel(modelUrl ? modelUrl : (MODEL_STORAGE_DIR + MODEL_FILE_URL)).then(model => {
        this.model = model
        resolve()
      }).catch(err => {
        reject(err)
      })
    })
  }

  dispose() {
    if (this.model) {
      this.model.dispose()
    }
  }

  squeeze(input) {
    const preprocessedInput = tf.div(
      tf.sub(input.asType('float32'), PREPROCESS_DIVISOR),
      PREPROCESS_DIVISOR)
    const reshapedInput =
      preprocessedInput.reshape([1, ...preprocessedInput.shape])
    return this.model.execute({'input': reshapedInput}, 'input_1/BottleneckInputPlaceholder')
  }
}