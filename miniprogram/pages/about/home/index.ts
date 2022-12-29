// pages/about/home/index.ts

Page({

  /**
   * 页面的初始数据
   */
  data: {
    viewCount: 0 as any,
    starCount: 0 as any,
    forkCount: 0 as any,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    let starCount = 426;
    let viewCount = 15678;
    let forkCount = 88;

    this.setData({
      starCount: this.formatNum(starCount),
      viewCount: this.formatNum(viewCount),
      forkCount: this.formatNum(forkCount),
    })
  },

  /**
   * 格式化数字
   * 
   * @param n
   * @returns 
   */
  formatNum: function (num: number) {
    let numStr;

    if (num <= 0) {
      numStr = 'N/A';
    } else if (num < 1000) {
      numStr = num.toString();
    } else if (num < 10000) {
      numStr = (num / 1000).toFixed(1) + 'k';
    } else if (num > 10000) {
      numStr = (num / 10000).toFixed(1) + 'w';
    }

    return numStr;
  },

  showQrcode: function () {
    wx.previewImage({
      urls: ['https://ai.flypot.cn/pocket/images/zan-code.jpg'],
      current: 'https://ai.flypot.cn/pocket/images/zan-code.jpg' // 当前显示图片的http链接      
    })
  }
})