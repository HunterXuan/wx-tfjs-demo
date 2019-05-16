//index.js
//获取应用实例
const app = getApp()
const tfc = require('../../utils/tf-core.js')
const tfcon = require('../../utils/tf-converter.js')
const SCAVENGER_CLASSES = require('../../utils/classes.js')

Page({
  data: {
    model: '',
    photoWidth: 0,
    photoHeight: 0,
    showImage: true
  },

  onLoad: function () {
    let that = this
    wx.showLoading({
      title: '拼命加载模型',
    })
    /*
    wx.downloadFile({
      url: 'https://hunterx.leanapp.cn/model/group1-shard1of1',
      success: function (res) {
        console.log(res)
      }
    })
    wx.request({
      url: 'https://hunterx.leanapp.cn/model/group1-shard1of1',
      dataType: '',
      responseType: 'arraybuffer',
      success: function (res) {
        resolve(generateResponse(res));
      },
      fail: function (res) {
        console.log(res)
      }
    })*/
    
    tfcon.loadFrozenModel(
      'https://hunterx.leanapp.cn/model/tensorflowjs_model.pb',
      'https://hunterx.leanapp.cn/model/weights_manifest.json'
    ).then(function (res) {
      app.globalData.model = res
      //console.log(res)
      //console.log(app.globalData.model)
      let warmUpRes = that.warmUp()
      //warmUpRes.dataSync()
      //console.log(warmUpRes)
      //console.log(warmUpRes.dataSync())
      //let predictions = that.predict(tfc.zeros([224, 224, 3]))
      //console.log(predictions)
      //let topKClasses = that.getTopKClasses(predictions, 5)
      //console.log(topKClasses)
      wx.hideLoading()
    })
  },

  onShow: function () {
    //
    //console.log(global)
  },

  predict: function (input) {
    //console.log('predict')
    //console.log(new Date())
    let PREPROCESS_DIVISOR = tfc.scalar(255 / 2)

    let preprocessedInput = tfc.div(
      tfc.sub(input.asType('float32'), PREPROCESS_DIVISOR),
      PREPROCESS_DIVISOR)

    let reshapedInput =
      preprocessedInput.reshape([1, ...preprocessedInput.shape]);

    let dict = {}
    dict['input'] = reshapedInput
    //console.log(new Date())
    return app.globalData.model.execute(dict, 'final_result')
  },

  getTopKClasses: function (predictions, topK) {
    //console.log('top')
    //console.log(new Date())
    let values = predictions.dataSync()
    //console.log(values)
    predictions.dispose()
    let predictionList = []
    for (let i = 0; i < values.length; i++) {
      predictionList.push({ value: values[i], index: i})
    }

    predictionList = predictionList.sort((a, b) => {
      return b.value - a.value
    }).slice(0, topK)

    return predictionList.map(x => {
      return { label: SCAVENGER_CLASSES[x.index], value: x.value };
    })
  },

  warmUp: function () {
    return this.predict(tfc.zeros([224, 224, 3]))
  },

  openAndTag: function () {
    let that = this
    wx.chooseImage({
      success: (res) => {
        const ctx = wx.createCanvasContext('canvas', this);
        ctx.drawImage(res.tempFilePaths[0], 0, 0)
        ctx.draw()
        //console.log(this)
        wx.canvasGetImageData({
          canvasId: 'canvas',
          x: 0,
          y: 0,
          width: 224,
          height: 224,
          success: (res) => {
            let tmp = tfc.fromPixels(res)
            //console.log(tmp)
            console.log(this.getTopKClasses(this.predict(tmp), 5))

            //console.log('end')
            //console.log(new Date())
          }
        })
      }
    })
  },

  drawImage: function (imagePath) {
    const cv = wx.createCanvasContext('canvas', this)
    const drawFunc = () => {
      cv.drawImage(imagePath, 0, 0, this.data.photoWidth, this.data.photoWidth, 0, 0, 224, 224)
      cv.draw()
    }
    if (this.data.photoWidth == 0) {
      wx.getImageInfo({
        src: imagePath,
        success: (res) => {
          this.setData({
            photoWidth: res.width,
            photoHeight: res.height
          }, () => {
            drawFunc()
          })
        }
      })
    } else {
      drawFunc()
    }
  },

  takeAndPredict: function () {
    wx.showLoading({
      title: '疯狂识别中',
    })
    const ctx = wx.createCameraContext()
    ctx.takePhoto({
      quality: 'high',
      success: (res) => {
        this.setData({
          showImage: true
        }, () => {
          this.drawImage(res.tempImagePath)
          setTimeout(() => {
            wx.canvasGetImageData({
              canvasId: 'canvas',
              x: 0,
              y: 0,
              width: 224,
              height: 224,
              success: (res) => {
                //console.log(res)
                let tmp = tfc.fromPixels(res)
                //console.log(tmp)
                let pres = this.getTopKClasses(this.predict(tmp), 5)
                console.log(pres)
                wx.hideLoading()
                /*
                wx.showModal({
                  title: '111',
                  content: JSON.stringify(pres),
                })
                */
                wx.showToast({
                  icon: 'none',
                  title: pres[0]['label'] + ' [' + (pres[0]['value'] * 100).toFixed(2) + '%] ' +  pres[1]['label'] + ' [' + (pres[1]['value'] * 100).toFixed(2) + '%] ' + pres[2]['label'] + ' [' + (pres[2]['value'] * 100).toFixed(2) + '%]',
                  duration: 2000
                })

                //console.log('end')
                //console.log(new Date())
              }
            })
          }, 1000)
        })
      }
    })
  }
})
