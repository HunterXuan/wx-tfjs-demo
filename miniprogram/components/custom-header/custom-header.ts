"use strict";

const app = getApp<IAppOption>();

Component({
  /**
   * 组件的一些选项
   */
  options: {
    addGlobalClass: true,
    multipleSlots: true
  },

  /**
   * 组件的对外属性
   */
  properties: {
    bgColor: <any>{
      type: String,
      default: ''
    },

    isCustom: <any>{
      type: [Boolean, String],
      default: false
    },

    isBack: <any>{
      type: [Boolean, String],
      default: false
    },

    bgImage: <any>{
      type: String,
      default: ''
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    statusBarHeight: app.globalData.statusBarHeight,
    menuHeaderHeight: app.globalData.menuHeaderHeight,
    menuButtonBoundingRect: app.globalData.menuButtonBoundingRect
  },

  /**
   * 组件的方法列表
   */
  methods: {
    BackPage() {
      if (getCurrentPages().length > 1) {
        wx.navigateBack({
          delta: 1
        });
      } else {
        this.toHome();
      }
    },

    toHome() {
      wx.reLaunch({
        url: '/pages/index/index',
      })
    }
  }
});

export {};