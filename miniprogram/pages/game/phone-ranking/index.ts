// pages/game/teachable-machine/index.ts
const app = getApp<IAppOption>();

import * as model from '../../../models/mobilenet/model';

Page({

  maxPredictRound: 50,

  avgPredictionScore: 0,

  predicionScoreList: [] as number[],

  /**
   * 页面的初始数据
   */
  data: {
    // 手机配置
    phoneInfo: {
      system: app.globalData.systemInfo.system,
      brand: app.globalData.systemInfo.brand,
      model: app.globalData.systemInfo.model,
      platform: app.globalData.systemInfo.platform,
    },
    // 比分显示
    btnStatus: 'waiting' as ('waiting' | 'loading' | 'predicting' | 'done'),
    btnText: '0',
    // 排行分
    rankingList: [],
    // 好友排行榜
    showRankModal: false,
    friendRankList: [],
    myRank: 0,
    // 分享海报
    posterUrl: '',
    posterConfig: {},
    posterModalVisible: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: async function () {
    // this.genRankingPicture();
    await this.initRankingList();
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    //
  },

  initModel: async function () {
    await model.load();

    if (!model.isReady()) {
      wx.showToast({
        title: '网络连接异常',
        icon: 'none'
      });
    }
  },

  initRankingList: async function () {
    const db = wx.cloud.database();
    // @ts-ignore
    const aggResult = await db.collection('phone_rankings').aggregate().group({
      _id: '$phone.model',
      score: db.command.aggregate.avg('$score')
    })
    .sort({
      score: -1,
    })
    .end();

    if (aggResult.list.length) {
      const maxScore = aggResult.list[0]?.score || 10000;
      const rankingList = aggResult.list.map((item: { _id: any; score: number; }) => {
        return {
          model: item._id,
          score: Math.round(item.score),
          normalized_score: 100 * item.score / maxScore
        };
      });
      this.setData({
        rankingList: rankingList as any,
      })
    }
  },

  handleRankingBtnClick: async function () {
    switch (this.data.btnStatus) {
      case 'waiting':
        this.data.btnStatus = 'loading';
        this.setData(this.data);

        await this.initModel();

        this.data.btnStatus = 'predicting';
        this.setData(this.data);

        if (model.isReady()) {
          while (this.predicionScoreList.length < this.maxPredictRound) {
            await this.processPredictionScore();
            // slow down
            await new Promise(resolve => {
              setTimeout(resolve, 100);
            });
          }
          await this.processAvgPredictionScore();
        }

        this.data.btnStatus = 'done';
        this.setData(this.data);
        break;
      case 'predicting':
        wx.showToast({
          title: '请稍后再试',
          icon: 'none'
        });
        break;
      case 'done':
      default:
        this.data.btnStatus = 'waiting';
        this.predicionScoreList = [];
        this.setData(this.data, async () => {
          await this.handleRankingBtnClick();
        });
        break;
    }
  },

  processPredictionScore: async function () {
    const randomTensor = model.getRandomTensor();
    const start = Date.now();
    await model.warmUp(randomTensor);
    const end = Date.now();
    randomTensor.dispose();
    const predictionScore = Math.round(100 * 1000 / (end - start));
    const btnText = predictionScore.toString();
    this.predicionScoreList.push(predictionScore);

    this.setData({
      btnText,
    });

  },

  processAvgPredictionScore: async function () {
    this.calAvgPredictionScore();
    await this.uploadAvgPredictionScore();
    // this.genRankingPicture();
    await this.initRankingList();
    wx.showToast({
      title: '结束啦！',
      icon: 'success',
      duration: 5000
    });
  },

  calAvgPredictionScore: function () {
    let total = 0;
    this.predicionScoreList.forEach((score: number) => {
      total = total + score;
    });

    this.avgPredictionScore = Math.round(total / this.predicionScoreList.length);
    const btnText = this.avgPredictionScore.toString();
    this.setData({
      btnText
    });
  },

  uploadAvgPredictionScore: async function () {
    // @ts-ignore
    if (['devtools', 'microsoft', 'mac', 'windows'].includes(app.globalData.systemInfo.platform)) {
      return;
    }

    // 简化逻辑，一个用户仅保存最新比分
    const db = wx.cloud.database();
    await db.collection('phone_rankings').doc(app.globalData.openid).set({
      data: {
        phone: this.data.phoneInfo,
        score: this.avgPredictionScore,
        updated_at: new Date().getTime(),
      }
    });
  },

  genRankingPicture: function () {
    this.setData({
      posterConfig: {
        width: 500,
        height: 400,
        // debug: true,
        texts: [
          {
            x: 64,
            y: 128,
            text: '88888',
            fontSize: 72,
            color: '#fff',
            lineHeight: 40,
            zIndex: 20,
          }
        ],
        images: [
          {
            x: 0,
            y: 0,
            url: 'https://626c-blog-541fe4-1257925894.tcb.qcloud.la/images/share.jpg',
            width: 500,
            height: 400,
            zIndex: 10,
          },
        ],
        lines: []
      }
    }, () => {
      this.selectComponent('#poster').onCreate(true);
    });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: '一起来算力比拼！',
      path: '/pages/game/phone-ranking/index?referrer=' + app.globalData.openid
    };
  },

  onShareTimeline: function () {
    return {
      title: '一起来算力比拼！',
      query: 'referrer=' + app.globalData.openid
    };
  },

  handleFriendsRankBtnClick: async function () {
    const userProfile = await wx.getUserProfile({
      desc: '用于生成好友排行榜'
    });
    if (userProfile.userInfo) {
      wx.showLoading({
        title: '加载中'
      });

      const db = wx.cloud.database();
      await db.collection('user_info').doc(app.globalData.openid).set({
        data: {
          ...userProfile.userInfo,
          updated_at: new Date().getTime(),
        }
      });

      const friendRankRes = await wx.cloud.callFunction({
        name: 'GetFriendsRank'
      });
      // @ts-ignore
      const friendRankList = friendRankRes?.result?.list;

      wx.hideLoading();

      if (friendRankList.length) {
        let myRank = 0;
        for (let i = 0; i < friendRankList.length; i++) {
          if (friendRankList[i].openid === app.globalData.openid) {
            myRank = i + 1;
          }
        }

        this.setData({
          myRank,
          friendRankList,
        });

        this.showRank();
        return;
      }
    }

    wx.showToast({
      title: '发生错误',
      icon: 'error'
    });
  },

  showRank: function () {
    this.setData({
      showRankModal: true,
    });
  },

  hideRank: function () {
    this.setData({
      showRankModal: false,
    });
  },

  hidePosterModal: function () {
    this.setData({
      posterModalVisible: false,
    });
  },

  onPosterSuccess: function (e: any) {
    const { detail } = e;
    this.setData({
      posterModalVisible: true,
      posterUrl: detail,
    });
  },

  onPosterFail: function () {
    wx.showToast({
      title: '生成图片失败',
      icon: 'none'
    })
  },
});
