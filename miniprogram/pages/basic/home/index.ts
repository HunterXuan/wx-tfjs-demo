// pages/basic/home/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    elements: [
      { title: '图像分类', name: 'ImageNet', page: 'mobilenet', color: 'cyan', icon: 'scan' },
      { title: '姿势识别', name: 'PoseNet', page: 'posenet', color: 'blue', icon: 'light' },
      { title: '人像分割', name: 'BodyPix', page: 'body-pix', color: 'purple', icon: 'people' },
      { title: '目标检测', name: 'SSD', page: 'coco-ssd', color: 'mauve', icon: 'focus' },
      { title: '手势识别', name: 'HandPose', page: 'handpose', color: 'pink', icon: 'appreciate' },
      { title: '面部特征', name: 'Face', page: 'face', color: 'brown', icon: 'emoji' },
    ],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {

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

  }
})