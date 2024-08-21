// app.ts
import * as tf from '@tensorflow/tfjs-core';
import * as webgl from '@tensorflow/tfjs-backend-webgl';
import { setupWechatPlatform } from './plugins/wechat_platform';
import { fetchFunc } from './plugins/fetch';

const updateManager = wx.getUpdateManager();

App<IAppOption>({
  globalData: {
    menuButtonBoundingRect: {} as WechatMiniprogram.Rect,
    statusBarHeight: 0,
    menuHeaderHeight: 0,
    systemInfo: {} as WechatMiniprogram.SystemInfo,
    user: {
      token: ''
    }
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

    tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 67108864)

    setupWechatPlatform({
      fetchFunc: fetchFunc,
      // inject tfjs runtime
      tf,
      // inject webgl backend
      webgl,
      // provide webgl canvas
      canvas: wx.createOffscreenCanvas(0, 0),
    });
  },

  async onShow () {
    updateManager.onCheckForUpdate((res) => {
      console.log(res.hasUpdate);
    });

    updateManager.onUpdateReady(() => {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用',
        success(res) {
          if (res.confirm) {
            updateManager.applyUpdate();
          }
        },
      });
    });

    updateManager.onUpdateFailed((err) => {
      console.error('update failed:', err);
    });
  },
})