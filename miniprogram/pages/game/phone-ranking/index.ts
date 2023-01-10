// pages/game/teachable-machine/index.ts
const app = getApp<IAppOption>();

import { isTypedArray } from '@tensorflow/tfjs-core/dist/util';
import * as model from '../../../models/mobilenet/model';

const rankingRecordsKey = 'RANKING_RECORDS_KEY';

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
    // 比拼记录
    rankingRecords: [] as {time: string, score: number}[],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    try {
      const strValue = wx.getStorageSync(rankingRecordsKey);
      if (strValue) {
        const objValue = JSON.parse(strValue);
        if (objValue) {
          this.setData({
            rankingRecords: objValue,
          });
        }
      }
    } catch (e) {
      console.error("getStorageSync err:", e);
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: async function () {
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
    this.saveRankingRecords();
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

  saveRankingRecords: function () {
    const nowTime = new Date();
    const rankingRecords = this.data.rankingRecords || [];
    rankingRecords.push({
      time: nowTime.getFullYear() + '/' + (nowTime.getMonth() + 1) + '/' + nowTime.getDate(),
      score: this.avgPredictionScore,
    });
    this.setData({
      rankingRecords: rankingRecords,
    });
    try {
      wx.setStorageSync(rankingRecordsKey, JSON.stringify(rankingRecords));
    } catch (e) {
      console.error('setStorageSync err:', e);
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: '一起来算力比拼！',
      path: '/pages/game/phone-ranking/index',
    };
  },

  onShareTimeline: function () {
    return {
      title: '一起来算力比拼！',
    };
  },
});
