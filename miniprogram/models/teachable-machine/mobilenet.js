import * as tfc from '@tensorflow/tfjs-converter'
import * as tf from '@tensorflow/tfjs-core'

const MODEL_STORAGE_DIR = 'https://ai.flypot.cn/models/'
const MODEL_FILE_URL = 'mobilenet/model.json'
const PREPROCESS_DIVISOR = 255 / 2

// 模型路径
const NOW_MODEL_VER = 20201122
const LOCAL_STORAGE_KEY = 'mobilenet_model'
const LOCAL_MODEL_VER_KEY = 'mobilenet_model_ver'
const LOCAL_STORAGE_EXP_KEY = 'mobilenet_model_exp'
const plugin = requirePlugin('tfjsPlugin')

export class MobileNet {
  model

  constructor() {
    let exp = wx.getStorageSync(LOCAL_STORAGE_EXP_KEY) || 0
    let ver = wx.getStorageSync(LOCAL_MODEL_VER_KEY) || 0
    if (exp < (new Date()).getTime() || ver < NOW_MODEL_VER) {
      wx.clearStorageSync()
    }
  }

  load(modelUrl) {
    return new Promise((resolve, reject) => {
      const localStorageHandler = plugin.localStorageIO(LOCAL_STORAGE_KEY)

      tfc.loadGraphModel(localStorageHandler).then(model => {
        console.log('loadGraphModel from local:', model)
        this.model = model
        resolve()
      }).catch(err => {
        console.error('loadGraphModel:', err)
        tfc.loadGraphModel(modelUrl ? modelUrl : (MODEL_STORAGE_DIR + MODEL_FILE_URL)).then(model => {
          console.log('loadGraphModel from net:', model)

          this.model = model
          this.model.save(localStorageHandler)
          wx.setStorageSync(LOCAL_MODEL_VER_KEY, NOW_MODEL_VER)
          wx.setStorageSync(LOCAL_STORAGE_EXP_KEY, (new Date()).getTime() + 604800000)
          resolve()
        }).catch(err => {
          console.error('loadGraphModel:', err)
          reject(err)
        })
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