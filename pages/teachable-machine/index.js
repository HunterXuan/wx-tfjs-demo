// pages/teachable-machine/index.js
import { Squeezer } from '../../models/teachable-machine/squeezer.js'
import * as knnClassifier from '../../models/teachable-machine/knn-classifier.js'

Page({

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

  ctx: null,
  frame: null,
  squeezer: null,
  knn: null,

  initSqueezer() {
    if (this.squeezer == null) {
      this.showLoadingToast()
      const squeezer = new Squeezer()
      squeezer.load().then(() => {
        this.squeezer = squeezer
        this.hideLoadingToast()
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
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    this.knn = knnClassifier.create()
    this.initSqueezer()

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
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

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

    this.knn.clearClass(this.data.currentSegment)
  },

  addSample: function(index) {
    const tensor = this.squeezer.squeeze(
      this.frame.data,
      { width: this.frame.width, height: this.frame.height }
    )

    this.knn.addExample(tensor, index)
  },

  executeClassify: function(frame) {
    if (this.squeezer && this.knn && !this.data.predicting) {
      if (this.knn.getNumClasses() === 3) {
        this.setData({
          predicting: true
        }, () => {
          const tensor = this.squeezer.squeeze(
            frame.data,
            { width: frame.width, height: frame.height }
          )

          // console.log(tensor)

          this.knn.predictClass(tensor, 3).then((res) => {
            // console.log(res)
            this.setData({
              predicting: false,
              prediction: this.data.imageGroups[res.classIndex].label
            })
          })
        })
      } else {
        this.setData({
          prediction: '样本不足'
        })
      }
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