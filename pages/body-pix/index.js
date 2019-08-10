// pages/body-pix/index.js
import * as bodyPix from '@tensorflow-models/body-pix'
bodyPix.checkpoints[0.25].url = 'https://ai.flypot.cn/models/body-pix/'
bodyPix.checkpoints[0.5].url = 'https://ai.flypot.cn/models/body-pix/'
bodyPix.checkpoints[0.75].url = 'https://ai.flypot.cn/models/body-pix/'
bodyPix.checkpoints[1].url = 'https://ai.flypot.cn/models/body-pix/'
//console.log(bodyPix)

import {
  detectBodySegmentation,
  toMaskImageData
} from '../../models/body-pix/body-pix'

const CANVAS_ID = 'canvas'
const POSENET_URL = 'https://ai.flypot.cn/models/posenet/model.json'

Page({

  /**
   * Page initial data
   */
  data: {
    predicting: false,
    videoWidth: null,
    videoHeight: null
  },

  bodyPixModel: null,

  canvas: null,

  segmentation: null,

  initModel: function() {
    if (this.bodyPixModel == null) {
      this.showLoadingToast()

      bodyPix.load(0.5).then((model) => {
        this.bodyPixModel = model

        this.hideLoadingToast()
      })
    }
  },

  executeModel: function(frame) {
    if (this.bodyPixModel && !this.data.predicting) {
      this.setData({
        predicting: true
      }, () => {
        detectBodySegmentation(frame, this.data.videoWidth, this.data.videoHeight, this.bodyPixModel).then((segmentation) => {
          //this.segmentation = segmentation
          //console.log(segmentation)
          const maskImageData = toMaskImageData(segmentation)
          //console.log(maskImageData)
          wx.canvasPutImageData({
            canvasId: CANVAS_ID,
            data: maskImageData.data,
            x: 0,
            y: 0,
            width: maskImageData.width,
            height: maskImageData.height,
            complete: () => {
              this.setData({
                predicting: false
              })
            }
          })
        })
        //console.log(this.segmentation)
      })
    }
  },

  showLoadingToast: function() {
    wx.showLoading({
      title: '拼命加载模型',
    })
  },

  hideLoadingToast: function() {
    wx.hideLoading()
  },

  initVideoSize: function() {
    wx.getSystemInfo({
      success: ({
        windowWidth,
        windowHeight
      }) => {
        this.setData({
          videoHeight: windowHeight,
          videoWidth: windowWidth
        })
      }
    })
  },

  /**
   * Lifecycle function--Called when page is initially rendered
   */
  onReady: async function() {
    this.initVideoSize()
    this.initModel()

    const context = wx.createCameraContext(this)
    const listener = context.onCameraFrame((frame) => {
      this.executeModel(frame)
    })
    listener.start()
  },

  /**
   * Lifecycle function--Called when page unload
   */
  onUnload: function() {
    if (this.bodyPixModel) {
      this.bodyPixModel.dispose()
    }
  }
})