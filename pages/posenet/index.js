// pages/posnet/index.js
import * as posenet from '@tensorflow-models/posenet'
import { detectPoseInRealTime, drawPoses } from '../../models/posenet/posenet'

const CANVAS_ID = 'canvas'
const POSENET_URL = 'https://ai.flypot.cn/models/posenet/model.json'

Page({
  data: {
    predicting: false
  },

  posenetModel: null,

  canvas: null,

  poses: null,

  ctx: null,

  initPosenet() {
    if (this.posenetModel == null) {
      this.showLoadingToast()

      posenet
        .load({
          architecture: 'MobileNetV1',
          outputStride: 16,
          inputResolution: 193,
          multiplier: 0.5,
          modelUrl: POSENET_URL
        })
        .then((model) => {
          this.posenetModel = model

          this.hideLoadingToast()
      });
    }
  },

  executePosenet(frame) {
    if (this.posenetModel && !this.data.predicting) {
      this.setData({
        predicting: true
      }, () => {
        detectPoseInRealTime(frame, this.posenetModel, false)
          .then((poses) => {
            this.poses = poses
            drawPoses(this.ctx, this.poses)
            
            this.setData({
              predicting: false
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

  async onReady() {
    // console.log('create canvas context for #image...')

    setTimeout(() => {
      this.ctx = wx.createCanvasContext(CANVAS_ID);
      // console.log('ctx', this.ctx);
    }, 500)

    this.initPosenet()

    const context = wx.createCameraContext(this)
    const listener = context.onCameraFrame((frame) => {
      this.executePosenet(frame)
    })
    listener.start()
  },

  onUnload() {
    if (this.posenetModel) {
      this.posenetModel.dispose()
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: 'AI Pocket - 人体动作捕捉'
    }
  }
})