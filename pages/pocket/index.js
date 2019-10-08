// pages/pocket/index.js
//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    result: ''
  },

  jumpTo(event) {
    let page = event.target.dataset.dest
    console.log(page)
    wx.navigateTo({
      url: '/pages/' + page + '/index',
    })
  },

  onReady() {

  },

  onUnload() {
    //
  },
  
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: 'AI Pocket - 基础篇'
    }
  }
})
