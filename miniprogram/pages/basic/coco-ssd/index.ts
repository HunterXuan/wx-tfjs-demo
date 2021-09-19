// pages/basic/coco-ssd/index.ts
const app = getApp<IAppOption>();

import * as model from '../../../models/coco-ssd/model';

const CANVAS_ID = 'canvas'

Page({

  ctx: null as any,

  /**
   * 页面的初始数据
   */
  data: {
    cameraBlockHeight: app.globalData.systemInfo.screenHeight - app.globalData.menuHeaderHeight,
    predicting: false
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

  showLoadingToast() {
    wx.showLoading({
      title: '拼命加载模型',
    })
  },

  hideLoadingToast() {
    wx.hideLoading()
  },

  executeClassify: async function (frame: any) {
    if (model.isReady() && !this.data.predicting) {
      this.setData({
        predicting: true
      }, async () => {
        const detectedObjects = await model.detect(frame, {width: app.globalData.systemInfo.screenWidth, height: this.data.cameraBlockHeight});
        model.drawBoxes(this.ctx, detectedObjects);
        this.setData({
          predicting: false,
        });
      })
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: 'AI Pocket - 通用物体检测'
    }
  }
})
