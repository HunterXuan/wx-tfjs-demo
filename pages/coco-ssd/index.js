// pages/cup/index.js
const fetchWechat = require('fetch-wechat')
const tf = require('@tensorflow/tfjs-core')
const plugin = requirePlugin('tfjsPlugin')

import { Classifier } from '../../models/coco-ssd/classifier.js'

const CANVAS_ID = 'canvas'

Page({

  classifier: null,

  ctx: null,

  /**
   * 页面的初始数据
   */
  data: {
    predicting: false
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
    })
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

    let count = 0
    const listener = context.onCameraFrame((frame) => {
      count = count + 1
      if (count === 3) {
        count = 0

        this.executeClassify(frame)
      }
    })
    listener.start()
  },

  initClassifier() {
    this.showLoadingToast()

    const systemInfo = wx.getSystemInfoSync()

    this.classifier = new Classifier('back', {
      width: systemInfo.windowWidth,
      height: systemInfo.windowHeight
    })

    this.classifier.load().then(_ => {
      this.hideLoadingToast()
    }).catch(err => {
      console.log(err)
      wx.showToast({
        title: '网络连接异常',
        icon: 'none'
      })
    })
  },

  showLoadingToast() {
    wx.showLoading({
      title: '拼命加载模型',
    })
  },

  hideLoadingToast() {
    wx.hideLoading()
  },

  executeClassify: function (frame) {
    if (this.classifier && this.classifier.isReady() && !this.data.predicting) {
      this.setData({
        predicting: true
      }, () => {
        this.classifier.detect(frame).then((res) => {
          this.classifier.drawBoxes(this.ctx, res)

          this.setData({
            predicting: false,
          })
          // console.log(res)
        }).catch((err) => {
          console.log(err)
        })
      })
    }
  }
})
