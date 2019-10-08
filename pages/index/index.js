//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    result: ''
  },

  jumpTo(event) {
    let tab = event.target.dataset.tab
    let page = event.target.dataset.dest
    if (tab) {
      wx.switchTab({
        url: '/pages/' + tab + '/index',
      })
    } else if (page) {
      wx.navigateTo({
        url: '/pages/' + page + '/index',
      })
    }
  },

  onReady() {
    
  },

  onUnload() {
    //
  },

  onShareAppMessage() {
    return {
      title: 'AI Pocket'
    }
  }
})
