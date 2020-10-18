// miniprogram/pages/about/home/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    viewCount: 0,
    starCount: 0,
    forkCount: 0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let addUpNum = (i = 0) => {
      if (i < 20) {
        setTimeout(() => {
          this.setData({
            starCount: i,
            forkCount: i,
            viewCount: i
          }, 50)

          addUpNum(i+1)
        })
      } else {
        this.setData({
          starCount: this.coutNum(240),
          forkCount: this.coutNum(46),
          viewCount: this.coutNum(21000)
        })
      }
    }

    addUpNum()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  coutNum: function (e) {
    if (e > 1000 && e < 10000) {
      e = (e / 1000).toFixed(1) + 'k'
    }
    if (e > 10000) {
      e = (e / 10000).toFixed(1) + 'w'
    }
    return e
  },

  showModal: function (e) {
    this.setData({
      modalName: e.currentTarget.dataset.target
    })
  },

  hideModal: function (e) {
    this.setData({
      modalName: null
    })
  },

  showQrcode: function () {
    wx.previewImage({
      urls: ['https://ai.flypot.cn/pocket/images/zan-code.jpg'],
      current: 'https://ai.flypot.cn/pocket/images/zan-code.jpg' // 当前显示图片的http链接      
    })
  },
})