// pages/game/nft/index.ts
const app = getApp<IAppOption>();

import { Controller as ARController } from '../../../models/nft';

console.log(ARController)

const CANVAS_ID = 'canvas'

Page({

  ctx: null as any,

  arController: null as unknown as ARController,

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
    // this.showLoadingToast();

    // this.hideLoadingToast();
  },

  executeClassify: async function (frame: any) {
    if (!this.arController) {
      this.arController = new ARController({inputWidth: frame.width, inputHeight: frame.height});
      await this.arController.addImageTargets('https://626c-blog-541fe4-1257925894.tcb.qcloud.la/nft/card.mind');
      // this.arController = new nft.default.ARControllerNFT(frame.width, frame.height, '', {});
      // this.arController.addEventListener('getNFTMarker', (evt: any) => {console.log('getNFTMarker', evt)});
      // this.arController.addEventListener('lostNFTMarker', (evt: any) => {console.log('lostNFTMarker', evt)});
      // await this.arController.loadNFTMarker('https://626c-blog-541fe4-1257925894.tcb.qcloud.la/nft/pinball');
    }

    console.log(await this.arController.detect(frame));
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
      title: 'AI Pocket - 目标追踪'
    }
  }
})