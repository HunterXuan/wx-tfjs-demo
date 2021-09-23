// pages/basic/mobilenet/index.ts
const app = getApp<IAppOption>();

import * as model from '../../../models/mobilenet/model';

Page({

  frame: null as any,

  /**
   * 页面的初始数据
   */
  data: {
    predictionBlockHeight: app.globalData.systemInfo.screenHeight - app.globalData.systemInfo.screenWidth - app.globalData.menuHeaderHeight,
    predicting: false,
    predictionRate: '0',
    preditionResults: [],
    result: ''
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
    await this.initModel();

    // Start the camera API to feed the captured images to the models.
    const context = wx.createCameraContext();

    let count = 0;
    const listener = context.onCameraFrame((frame) => {
      count = count + 1;
      if (count === 3) {
        count = 0;
        this.frame = frame;

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

  showLoadingToast: function () {
    wx.showLoading({
      title: '拼命加载模型',
    });
  },

  hideLoadingToast: function () {
    wx.hideLoading()
  },

  executeClassify: async function (frame: WechatMiniprogram.OnCameraFrameCallbackResult) {
    if (model.isReady() && !this.data.predicting) {
      this.setData({
        predicting: true
      }, async () => {
        const start = Date.now()
        const predictionResults = await model.classify(frame)
        const end = Date.now()

        this.setData({
          predicting: false,
          predictionRate: (1000 / (end - start)).toFixed(2),
          predictionResults: predictionResults
        })
      })
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: 'AI Pocket - 图像分类'
    };
  }
});

export {};