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
  }
})
