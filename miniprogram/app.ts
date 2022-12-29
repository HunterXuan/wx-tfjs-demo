// app.ts
import * as tf from '@tensorflow/tfjs-core';
import * as webgl from '@tensorflow/tfjs-backend-webgl';
import * as fetchWechat from 'fetch-wechat';
const plugin = requirePlugin('tfjsPlugin');

App<IAppOption>({
  globalData: {
    menuButtonBoundingRect: {} as WechatMiniprogram.Rect,
    statusBarHeight: 0,
    menuHeaderHeight: 0,
    systemInfo: {} as WechatMiniprogram.SystemInfo,
    openid: ''
  },
  async onLaunch () {
    // SystemInfo
    const systemInfo = wx.getSystemInfoSync();
    let rect = wx.getMenuButtonBoundingClientRect();
    this.globalData.menuButtonBoundingRect = rect;
    this.globalData.statusBarHeight = systemInfo.statusBarHeight;
    this.globalData.menuHeaderHeight = rect.bottom + rect.top - systemInfo.statusBarHeight;
    this.globalData.systemInfo = wx.getSystemInfoSync();

    // Debug: Cannot create a canvas in this context
    // Detect webgl version: https://stackoverflow.com/questions/51428435/how-to-determine-webgl-and-glsl-version
    // tf.ENV.flagRegistry.WEBGL_VERSION.evaluationFn = () => {return 1};
    plugin.configPlugin({
      // polyfill fetch function
      fetchFunc: fetchWechat.fetchFunc(),
      // inject tfjs runtime
      tf,
      // inject webgl backend
      webgl,
      // provide webgl canvas
      canvas: wx.createOffscreenCanvas(0, 0)
    });
  },

  async onShow () {
  },
})