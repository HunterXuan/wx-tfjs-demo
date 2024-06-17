// pages/game/chat-gpt/index.ts
import { generateUUID } from '../../../utils/util';

const app = getApp<IAppOption>();

const fullScrollViewHeight = app.globalData.systemInfo.screenHeight - app.globalData.menuHeaderHeight - 100*wx.getSystemInfoSync().windowWidth/750;

const bannerAdShowedPositions = [5, 13, 21];
const popUpAdShowedPositions = [9, 17];

Page({

  /**
   * 页面的初始数据
   */
  data: {
    interstitialAd: null as unknown as WechatMiniprogram.InterstitialAd,
    adShowed: false,

    scrollViewHeight: fullScrollViewHeight,
    scrollTop: 0,
    inputBottom: 0,
    text: '',
    inputFocus: false,

    chatList: [{type:'normal', user:'bot', message:'很高兴认识你'}] as {type: string, user: string, message: string}[],
    conversationId: '',
    lastMessageId: '',
    conversationCookie: '',

    tipsMap: {
      'model': { idx: 0, data: { name: '' } },
      'slow-down': { idx: -1, data: { text: '' } },
      'sponsor': { idx: 15, data: {} },
      'ad': { idx: -1, data: {} },
    },
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.initConversationId();

    this.login();

    this.initAd();

    this.initModel();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    wx.showModal({
      content: '暂时下线',
    });
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: 'ChatGPT 体验',
      imageUrl: 'https://ai.flypot.cn/mp/ai-pocket/images/chat.jpg'
    };
  },

  onShareTimeline() {
    return {
      title: 'ChatGPT 体验',
      imageUrl: 'https://ai.flypot.cn/mp/ai-pocket/images/chat.jpg'
    };
  },

  initConversationId() {
    this.data.conversationId = generateUUID();
  },

  initModel() {
    wx.request({
      url: 'https://ai.flypot.cn/mp/ai-pocket/proxy/chat-gpt/chat',
      method: 'HEAD',
      header: {
        conversation: this.data.conversationId,
      },
      success: (res: any) => {
        if (res?.header?.['X-Chat-Model']) {
          this.data.tipsMap.model.data.name = res?.header?.['X-Chat-Model'];
          this.setData({
            tipsMap: this.data.tipsMap,
          });
        }
      },
    })
  },

  initAd() {
    if (wx.createInterstitialAd) {
      this.data.interstitialAd = wx.createInterstitialAd({ adUnitId: 'adunit-f23fe77457aec849' });
      this.data.interstitialAd.onLoad(() => {
        console.log('onLoad event emit');
      });
      this.data.interstitialAd.onError((err) => {
        console.error('onError event emit', err);
      });
      this.data.interstitialAd.onClose((res) => {
        console.log('onClose event emit', res);
      });
    }
  },

  login() {
    if (app.globalData.user.token === '') {
      // 登录
      wx.login({
        success: (res) => {
          wx.request({
            url: 'https://ai.flypot.cn/mp/ai-pocket/proxy/chat-gpt/login',
            method: 'POST',
            dataType: 'json',
            data: {
              code: res.code,
            },
            success: (res: any) => {
              if (res.statusCode === 200 && res?.data?.token) {
                app.globalData.user.token = res.data.token;
              } else {
                wx.showToast({
                  title: '初始化失败',
                  icon: 'error',
                });
              }
            },
            fail: (err) => {
              console.error('login fail:', err);
              wx.showToast({
                title: '初始化失败',
                icon: 'error',
              });
            }
          })
        },
        fail: (err) => {
          console.error('login fail:', err);
          wx.showToast({
            title: '初始化失败',
            icon: 'error',
          });
        }
      });
    }
  },

  handleInputFocus(e: any) {
    this.setData({
      inputBottom: e.detail.height,
      scrollViewHeight: fullScrollViewHeight - e.detail.height,
    }, () => {
      this.updateScrollTop();
    });
  },

  handleInputBlur() {
    this.setData({
      inputBottom: 0,
      scrollViewHeight: fullScrollViewHeight,
    }, () => {
      this.updateScrollTop();
    });
  },

  handleInput: function (e: any) {
    // 快速赋值
    this.data.text = e.detail.value
  },

  handleConfirm: function () {
    if (this.data.text.length == 0) {
      return;
    }

    const message = this.data.text;
    const chatList = this.data.chatList;

    chatList.push({type: 'normal', user: 'me', message: this.data.text});
    chatList.push({type: 'typing', user: 'bot', message: '输入中...'});

    this.setData({
      text: '',
      chatList: chatList,
    }, () => {
      this.updateScrollTop();

      let successRes: any = null;
      let failRes: any = null;

      wx.request({
        url: 'https://ai.flypot.cn/mp/ai-pocket/proxy/chat-gpt/chat',
        method: 'POST',
        dataType: 'json',
        data: {
          conversation: this.data.conversationId,
          parent: this.data.lastMessageId,
          message: message,
        },
        header: {
          cookie: 'sticky=' + this.data.conversationCookie,
          Authorization: 'Bearer ' + app.globalData.user.token,
        },
        success: (res: any) => { successRes = res; },
        fail: (err) => { failRes = err; },
        complete: () => {
          if (successRes) {
            console.log('success res:', successRes);
          } else {
            console.log('fail res:', failRes);
          }

          if (chatList.length > 0 && chatList[chatList.length-1].type == 'typing') {
            chatList.pop();
          }

          chatList.push({type: 'normal', user: 'bot', message: successRes?.data?.message || '服务开小差了...'});
          
          // tips map
          const tipsMap = this.data.tipsMap;
          if (successRes) {
            tipsMap.model.data.name = successRes?.data?.model || tipsMap.model.data.name;

            // slow down
            if (successRes.statusCode === 429) {
              const resetTime = successRes.header['X-Ratelimit-Reset'] || 0;
              const leftTime = Math.round(resetTime ? (resetTime - new Date().getTime()/1000) : 60)
              tipsMap['slow-down'].idx = chatList.length - 1;
              tipsMap['slow-down'].data.text = '服务繁忙，请'+leftTime+'秒后再试';
            }
          }
          if (failRes || bannerAdShowedPositions.indexOf(chatList.length) >= 0) {
            tipsMap.ad.idx = chatList.length - 1;
          }

          this.setData({
            lastMessageId: successRes?.data?.id || this.data.lastMessageId,
            conversationCookie: this.extractStickyCookie(successRes?.cookies),
            chatList: chatList,
            tipsMap,
          }, () => {
            this.updateScrollTop();
            this.checkAndShowAd();
          });
        },
      })
    });
  },

  extractStickyCookie: function (cookies: string[]) {
    let cookie = this.data.conversationCookie;
    cookies.forEach(item => {
      if (item.includes('sticky=')) {
        const startIdx = item.indexOf('=');
        const endIdx = item.indexOf(';');
        cookie = item.substr(startIdx+1, endIdx-startIdx-1);
      }
    });

    return cookie;
  },

  checkAndShowAd: function () {
    if (this.data.interstitialAd) {
      if (popUpAdShowedPositions.indexOf(this.data.chatList.length) < 0) {
        return;
      }

      this.data.interstitialAd.show().then(() => {
        this.data.adShowed = true;
        this.setData({
          inputFocus: false,
        });
      }).catch((err) => {
        console.error('Show ad error', err);
      })
    }
  },

  updateScrollTop: function () {
    this.setData({
      scrollTop: this.data.chatList.length * 1000,
    });
  },

  showQrcode: function () {
    wx.previewImage({
      urls: ['https://ai.flypot.cn/mp/ai-pocket/images/zan-code.jpg'],
      current: 'https://ai.flypot.cn/mp/ai-pocket/images/zan-code.jpg', // 当前显示图片的http链接      
    });
  },

  handleAdLoad: function () {
    this.updateScrollTop();
  },
})