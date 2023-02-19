// index.ts

Page({
  data: {
    list: [
      {
        title: '图像分类',
        img: 'https://ai.flypot.cn/mp/ai-pocket/images/index-imagenet-bg.jpg',
        url: '/pages/basic/mobilenet/index'
      },
      {
        title: '姿势识别',
        img: 'https://ai.flypot.cn/mp/ai-pocket/images/index-posenet-bg.jpg',
        url: '/pages/basic/posenet/index'
      },
      {
        title: '初识 AI',
        img: 'https://ai.flypot.cn/mp/ai-pocket/images/index-teach-bg.jpg',
        url: '/pages/game/teachable-machine/index'
      }
    ]
  },

  onShareAppMessage() {
    return {
      title: 'AI Pocket - 口袋里的 AI'
    }
  },
 
  handleCardClicked(e: any) {
    wx.navigateTo({
      url: e.currentTarget.dataset.url
    })
  },

  goToCoupon: function () {
    wx.navigateToMiniProgram({
      "appId": "wxece3a9a4c82f58c9",
      "extraData": {},
      "path": "taoke/pages/shopping-guide/index?scene=9GWP2Ou"
    })
  }
});

export {};
