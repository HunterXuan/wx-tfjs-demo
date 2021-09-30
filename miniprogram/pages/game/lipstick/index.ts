// pages/game/lipstick/index.ts
const app = getApp<IAppOption>();

import * as model from '../../../models/face/model';

const CANVAS_ID = 'canvas'

Page({

  ctx: null as any,

  /**
   * Page initial data
   */
  data: {
    colorIndex: 0,
    currentColor: { r: 255, g: 0, b: 0, name: '正红' },
    alphaIndex: 5,
    colorList: [
      { r: 177, g: 60, b: 121, name: '玫红色' },
      { r: 187, g: 24, b: 19, name: '正橘色' },
      { r: 234, g: 78, b: 89, name: '星星色' },
      { r: 184, g: 18, b: 43, name: '正红色' },
      { r: 247, g: 94, b: 112, name: '嫣粉纱丽' },
      { r: 203, g: 34, b: 118, name: '雅紫纱蓉' },
      { r: 194, g: 116, b: 130, name: '绛紫丝绒' },
      { r: 192, g: 107, b: 114, name: '藕粉云罗' },
      { r: 187, g: 68, b: 74, name: '绯红香缎' },
      { r: 232, g: 110, b: 159, name: '莹亮裸粉' },
      { r: 222, g: 111, b: 92, name: '杏色府绸' },
      { r: 204, g: 109, b: 132, name: '堇色流纱' },
      { r: 237, g: 105, b: 93, name: '珊瑚雪纺' },
      { r: 220, g: 77, b: 141, name: '想你色' },
      { r: 250, g: 108, b: 85, name: '莹亮珊瑚橙' },
      { r: 217, g: 16, b: 14, name: '橙红织锦' },
      { r: 185, g: 100, b: 99, name: '裸色薄纱' },
      { r: 202, g: 64, b: 97, name: '珊瑚柚' },
      { r: 210, g: 67, b: 121, name: '纯真玫红' },
      { r: 220, g: 41, b: 35, name: '前卫霓红' },
      { r: 199, g: 21, b: 61, name: '明亮裸唇' },
      { r: 178, g: 93, b: 132, name: '明亮淡紫' },
      { r: 176, g: 16, b: 32, name: '红唇印象' },
      { r: 158, g: 44, b: 44, name: '疯狂玫瑰' },
      { r: 148, g: 2, b: 32, name: '摇滚红唇' },
      { r: 85, g: 0, b: 1, name: '天然浆果' },
    ],
    alphaList: [
      0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0
    ],
    predicting: false,
    colorPanelBlockHeight: app.globalData.systemInfo.screenHeight - app.globalData.systemInfo.screenWidth - app.globalData.menuHeaderHeight,
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
        const faces = await model.detectFaces(frame, {width: app.globalData.systemInfo.screenWidth, height: app.globalData.systemInfo.screenWidth});

        model.drawLipstick(this.ctx, faces, this.genColor());
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
      title: 'AI Pocket - 口红试色'
    }
  },

  genColor: function () {
    const currentColor = this.data.currentColor;
    const alpha = this.data.alphaList[this.data.alphaIndex];
    return 'rgba(' + currentColor.r + ',' + currentColor.g + ',' + currentColor.b + ',' + alpha + ')';
  },

  handleColorChange: function (evt: any) {
    const colorIndex = evt.target.dataset.index as number;
    this.setData({
      colorIndex,
      currentColor: this.data.colorList[colorIndex],
    });
  },

  handleAlphaChange: function (evt: any) {
    const alphaIndex = evt.target.dataset.index as number;
    this.setData({
      alphaIndex,
    });
  }
})