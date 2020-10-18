// pages/teachable-machine/index.js
const app = getApp()

import { Classifier } from '../../../models/teachable-machine/classifier.js'

Page({

  ctx: null,

  frame: null,

  classifier: null,
  
  /**
   * 页面的初始数据
   */
  data: {
    predictionBlockHeight: app.globalData.systemInfo.screenHeight - app.globalData.systemInfo.screenWidth - app.globalData.CustomBar,
    currentSegment: 0,
    predicting: false,
    prediction: '样本不足',
    showHelpModal: false,
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
    //
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

    this.classifier = new Classifier('back', {
      width: app.globalData.systemInfo.windowWidth,
      height: app.globalData.systemInfo.windowWidth
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
      currentSegment: e.target.dataset.index
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
    this.setData({
      showHelpModal: true,
    })
  },

  hideHelp: function() {
    this.setData({
      showHelpModal: false,
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