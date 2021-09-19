// pages/basic/handpose/index.ts
const app = getApp<IAppOption>();

import * as model from '../../../models/handpose/model';

const CANVAS_ID = 'canvas';

Page({

  ctx: null as unknown as WechatMiniprogram.CanvasContext,

  /**
   * Page initial data
   */
  data: {
    cameraBlockHeight: app.globalData.systemInfo.screenHeight - app.globalData.menuHeaderHeight,
    predicting: false,
    videoWidth: null,
    videoHeight: null
  },

  /**
  * 生命周期函数--监听页面加载
  */
  onLoad: function () {
    //
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: async function () {
    setTimeout(() => {
      this.ctx = wx.createCanvasContext(CANVAS_ID);
    }, 500);

    await this.initModel();

    const context = wx.createCameraContext();
    let count = 0;
    const listener = context.onCameraFrame((frame) => {
      count = count + 1;
      if (count === 3) {
        count = 0;
        this.executeClassify(frame);
      }
    })
    listener.start();
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    //
  },

  initModel: async function () {
    this.showLoadingToast();

    await model.load();

    this.hideLoadingToast();

    if (!model.isReady()) {
      wx.showToast({
        title: '网络连接异常',
        icon: 'none'
      });
    }
  },

  executeClassify: async function (frame: any) {
    if (model.isReady() && !this.data.predicting) {
      this.setData({
        predicting: true
      }, async () => {
        const hands = await model.estimateHands(frame, {width: app.globalData.systemInfo.screenWidth, height: this.data.cameraBlockHeight});

        model.drawSingleHand(this.ctx, hands);
        this.setData({
          predicting: false,
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
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: 'AI Pocket - 手势识别'
    }
  }
})