//index.js
import { Classifier } from '../../models/mobilenet/classifier'

//获取应用实例
const app = getApp()

Page({
  data: {
    predicting: false,
    predictionDuration: 0,
    preditionResults: [],
    result: ''
  },

  classifier: null,

  initClassifier() {
    if (this.classifier == null) {
      this.showLoadingToast()
      const classifier = new Classifier(this)
      classifier.load().then(() => {
        this.classifier = classifier
        this.hideLoadingToast()
      })
    }
  },

  executeClassify(frame) {
    if (this.classifier && !this.data.predicting) {
      this.setData({
        predicting: true
      }, () => {
        const start = Date.now()
        const predictionResults = this.classifier.classify(
          frame.data,
          { width: frame.width, height: frame.height }
        )
        const end = Date.now()

        this.setData({
          predicting: false,
          predictionDuration: end - start,
          predictionResults: predictionResults
        })
      })
    }
  },

  showLoadingToast() {
    wx.showLoading({
      title: '拼命加载模型',
    })
  },

  hideLoadingToast() {
    wx.hideLoading()
  },

  async onReady() {
    this.initClassifier()

    // Start the camera API to feed the captured images to the models.
    const context = wx.createCameraContext(this)
    const listener = context.onCameraFrame((frame) => {
      this.executeClassify(frame)
    })
    listener.start()
  },

  onUnload() {
    if (this.classifier) {
      this.classifier.dispose()
    }
  }
})
