// pages/teachable-machine/index.js
const fetchWechat = require('fetch-wechat')
const tf = require('@tensorflow/tfjs-core')
const plugin = requirePlugin('tfjsPlugin')

import { Classifier } from '../../models/teachable-machine/classifier.js'

Page({

  ctx: null,

  frame: null,

  classifier: null,
  
  /**
   * 页面的初始数据
   */
  data: {
    currentSegment: 0,
    predicting: false,
    prediction: '样本不足',
    imageGroups: [
      {
        label: '分类一',
        images: []
      },
      {
        label: '分类二',
        images: []
      },
      {
        label: '分类三',
        images: []
      },
    ]
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
    this.initClassifier()

    this.ctx = wx.createCameraContext(this)

    let count = 0
    const listener = this.ctx.onCameraFrame((frame) => {
      count = count + 1
      if (count === 3) {
        count = 0
        this.frame = frame

        this.executeClassify(frame)
      }
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

    this.classifier = new Classifier('back', {
      width: systemInfo.windowWidth,
      height: systemInfo.windowWidth
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

  onSegmentChange: function (e) {
    this.setData({
      currentSegment: e.detail.key
    })
  },

  takeSample: function() {
    this.addSample(this.data.currentSegment)

    this.ctx.takePhoto({
      quality: 'normal',
      success: (res) => {
        let imageGroups = this.data.imageGroups
        imageGroups[this.data.currentSegment].images.push({
          'imagePath': res.tempImagePath
        })

        this.setData({
          imageGroups: imageGroups
        })
      }
    })
  },

  cleanSample: function() {
    let imageGroups = this.data.imageGroups
    imageGroups[this.data.currentSegment].images = []

    this.setData({
      imageGroups: imageGroups
    })

    this.classifier.clearClass(this.data.currentSegment)
  },

  addSample: function(index) {
    this.classifier.addExample(this.frame, index)
  },

  executeClassify: function (frame) {
    if (this.classifier && this.classifier.getNumClasses() == 3 && !this.data.predicting) {
      this.setData({
        predicting: true
      }, () => {

        this.classifier.predictClass(frame).then((res) => {
          this.setData({
            predicting: false,
            prediction: this.data.imageGroups[res.classIndex].label
          })
        }).catch((err) => {
          console.log(err)
        })
      })
    }
  },

  handleInputChange: function(e) {
    const imageGroups = this.data.imageGroups
    imageGroups[this.data.currentSegment]['label'] = e.detail.value
    this.setData({
      imageGroups: imageGroups
    })
  },

  showHelp: function() {
    wx.showModal({
      title: '使用帮助',
      content: '1. 修改各分类的「分类别名」；\r\n2. 点击「采集样本」按钮可以采集一张分类图像；\r\n3. 点击「清空样本」清空某个分类下的样本；\r\n4. 所有分类均采集样本后，会自动实时预测',
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: 'AI Pocket - 初识 AI'
    }
  }
})