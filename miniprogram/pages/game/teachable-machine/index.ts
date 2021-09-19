// pages/game/teachable-machine/index.ts
const app = getApp<IAppOption>();

import * as model from '../../../models/teachable-machine/model';

Page({

  ctx: null as unknown as WechatMiniprogram.CameraContext,

  frame: null as any,
  
  /**
   * 页面的初始数据
   */
  data: {
    predictionBlockHeight: app.globalData.systemInfo.screenHeight - app.globalData.systemInfo.screenWidth - app.globalData.menuHeaderHeight,
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
    ] as { label: string, images: {}[] }[]
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
    this.ctx = wx.createCameraContext();

    let count = 0;
    const listener = this.ctx.onCameraFrame((frame) => {
      count = count + 1;
      if (count === 3) {
        count = 0;
        this.frame = frame;

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

  showLoadingToast() {
    wx.showLoading({
      title: '拼命加载模型',
    })
  },

  hideLoadingToast() {
    wx.hideLoading();
  },

  onSegmentChange: function (e: any) {
    this.setData({
      currentSegment: e.target.dataset.index
    });
  },

  takeSample: function() {
    this.addSample(this.data.currentSegment)

    this.ctx.takePhoto({
      quality: 'normal',
      success: (res) => {
        let imageGroups = this.data.imageGroups;
        imageGroups[this.data.currentSegment].images.push({
          'imagePath': res.tempImagePath
        })

        this.setData({
          imageGroups: imageGroups
        })
      }
    })
  },

  cleanSample: function () {
    let imageGroups = this.data.imageGroups;
    imageGroups[this.data.currentSegment].images = [];

    this.setData({
      imageGroups: imageGroups
    });

    model.clearClass(this.data.currentSegment);
  },

  addSample: function (index: number) {
    model.addExample(this.frame, index);
  },

  executeClassify: function (frame: any) {
    if (model.isReady() && model.getNumClasses() == 3 && !this.data.predicting) {
      this.setData({
        predicting: true
      }, async () => {
        const prediction = await model.predictClass(frame);
        this.setData({
          predicting: false,
          prediction: this.data.imageGroups[prediction.classIndex].label
        });
      })
    }
  },

  handleInputChange: function(e: any) {
    const imageGroups = this.data.imageGroups;
    imageGroups[this.data.currentSegment]['label'] = e.detail.value;
    this.setData({
      imageGroups: imageGroups
    });
  },

  showHelp: function () {
    this.setData({
      showHelpModal: true,
    });
  },

  hideHelp: function () {
    this.setData({
      showHelpModal: false,
    });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: 'AI Pocket - 初识 AI'
    };
  }
})