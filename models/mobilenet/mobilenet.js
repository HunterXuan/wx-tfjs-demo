import * as tfc from '@tensorflow/tfjs-converter'
import * as tf from '@tensorflow/tfjs-core'

// const GOOGLE_CLOUD_STORAGE_DIR = 'https://www.gstaticcnapps.cn/tfjs-models/savedmodel/'
// const MODEL_FILE_URL = 'mobilenet_v2_1.0_224/model.json'
const MODEL_STORAGE_DIR = 'https://ai.flypot.cn/models/'
const MODEL_FILE_URL = 'mobilenet/model.json'
const PREPROCESS_DIVISOR = 255 / 2

export class MobileNet {
  model

  constructor() { }

  async load() {
    this.model =
      await tfc.loadGraphModel(MODEL_STORAGE_DIR + MODEL_FILE_URL)
  }

  dispose() {
    if (this.model) {
      this.model.dispose()
    }
  }
  /**
   * Infer through MobileNet. This does standard ImageNet pre-processing before
   * inferring through the model. This method returns named activations as well
   * as softmax logits.
   *
   * @param input un-preprocessed input Array.
   * @return The softmax logits.
   */
  predict(input) {
    const preprocessedInput = tf.div(
      tf.sub(input.asType('float32'), PREPROCESS_DIVISOR),
      PREPROCESS_DIVISOR)
    const reshapedInput =
      preprocessedInput.reshape([1, ...preprocessedInput.shape])
    return this.model.predict(reshapedInput)
  }
}