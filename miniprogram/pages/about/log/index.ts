// pages/about/log/index.ts
Page({

  /**
   * 页面的初始数据
   */
  data: {
    changeLogs: [] as { tag: any; date: any; key_points: any; }[],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    const db = wx.cloud.database();
    db.collection('change_logs').orderBy('date', 'desc').get({
      success: (res) => {
        let changeLogs: { tag: any; date: any; key_points: any; }[] = [];
        res.data.forEach((log: any) => {
          changeLogs.push({
            tag: log.tag,
            date: log.date.toLocaleDateString(),
            key_points: log.key_points
          })
        });
        this.setData({
          changeLogs
        })
      }
    });
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
})