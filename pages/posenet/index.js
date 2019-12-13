// pages/body-pix/index.js
const fetchWechat = require('fetch-wechat')
const tf = require('@tensorflow/tfjs-core')
const plugin = requirePlugin('tfjsPlugin')

import { Classifier } from '../../models/posenet/classifier.js'

const CANVAS_ID = 'canvas'

Page({

  classifier: null,

  ctx: null,

  /**
   * Page initial data
   */
  data: {
    predicting: false,
    videoWidth: null,
    videoHeight: null
  },

  /**
  * 生命周期函数--监听页面加载
  */
  onLoad: function (options) {
    plugin.configPlugin({
      fetchFunc: fetchWechat.fetchFunc(),
      tf,
      canvas: wx.createOffscreenCanvas(),
      backendName: 'wechat-webgl-' + Math.random()
    });
  },

  /**
     * 生命周期函数--监听页面初次渲染完成
     */
  onReady: function () {
    setTimeout(() => {
      this.ctx = wx.createCanvasContext(CANVAS_ID)
    }, 500)

    this.initClassifier()

    const context = wx.createCameraContext(this)
    const listener = context.onCameraFrame((frame) => {
      this.executeClassify(frame)
    })
    listener.start()
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    if (this.classifier && this.classifier.isReady()) {
      this.classifier.dispose()
    }
  },

  initClassifier() {
    this.showLoadingToast()

    const systemInfo = wx.getSystemInfoSync()

    this.classifier = new Classifier('front', {
      width: systemInfo.windowWidth,
      height: systemInfo.windowHeight
    })

    this.classifier.load().then(() => {
      this.hideLoadingToast()
    }).catch(err => {
      console.log(err)
      wx.showToast({
        title: '网络连接异常',
        icon: 'none'
      })
    })
  },

  executeClassify(frame) {
    if (this.classifier && this.classifier.isReady() && !this.data.predicting) {
      this.setData({
        predicting: true
      }, () => {
        this.classifier.detectSinglePose(frame)
          .then((pose) => {
            const nosePosition = pose.keypoints[0].position

            this.classifier.drawSinglePose(this.ctx, pose)

            this.setData({
              predicting: false,
              nosePosition: Math.round(nosePosition.x) + ', ' + Math.round(nosePosition.y)
            })
          })
          .catch((err) => {
            console.log(err, err.stack);
          });
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

  /**
   * Lifecycle function--Called when page unload
   */
  onUnload: function () {
    if (this.classifier && this.classifier.isReady()) {
      this.classifier.dispose()
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: 'AI Pocket - 身体部位识别'
    }
  }
})