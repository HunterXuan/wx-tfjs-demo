//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    list: [
      {
        title: '物品识别',
        img: 'https://ai.flypot.cn/pocket/images/index-imagenet-bg.jpg',
        url: '/pages/basic/mobilenet/index'
      },
      {
        title: '动作捕捉',
        img: 'https://ai.flypot.cn/pocket/images/index-posenet-bg.jpg',
        url: '/pages/basic/posenet/index'
      },
      {
        title: '初识 AI',
        img: 'https://ai.flypot.cn/pocket/images/index-teach-bg.jpg',
        url: '/pages/game/teachable-machine/index'
      }
    ]
  },

  onShareAppMessage() {
    return {
      title: 'AI Pocket - 口袋里的 AI'
    }
  },
 
  handleCardClicked(e) {
    wx.navigateTo({
      url: e.currentTarget.dataset.url
    })
  },

  goToCoupon: function (e) {
    wx.navigateToMiniProgram({
      "appId": "wxece3a9a4c82f58c9",
      "extraData": {},
      "path": "pages/sharePid/web/index?scene=https://s.click.ele.me/DQ8a1uu"
    })
  }
})
