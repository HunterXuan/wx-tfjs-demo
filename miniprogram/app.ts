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
  async onLaunch (options) {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        // env: 'my-env-id',
        traceUser: true,
      });
    }

    // SystemInfo
    const systemInfo = wx.getSystemInfoSync();
    let rect = wx.getMenuButtonBoundingClientRect();
    this.globalData.menuButtonBoundingRect = rect;
    this.globalData.statusBarHeight = systemInfo.statusBarHeight;
    this.globalData.menuHeaderHeight = rect.bottom + rect.top - systemInfo.statusBarHeight;
    this.globalData.systemInfo = wx.getSystemInfoSync();

    // OpenId
    let loginRes = await wx.cloud.callFunction({
      name: 'Login',
      data: {
        referrer: options.query['referrer'] || ''
      }
    });

    // @ts-ignore
    const openId = loginRes?.result?.openid || '';
    this.globalData.openid = openId;

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
  }
})