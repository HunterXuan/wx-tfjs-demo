/// <reference path="../node_modules/miniprogram-api-typings/index.d.ts" />

interface IAppOption {
  globalData: {
    menuButtonBoundingRect: WechatMiniprogram.Rect,
    statusBarHeight: number,
    menuHeaderHeight: number,
    systemInfo: WechatMiniprogram.SystemInfo,
  }
}
