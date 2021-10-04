// pages/game/nft/index.ts
const app = getApp<IAppOption>();

import { Controller as ARController } from '../../../models/nft';

import * as THREE from 'three-platformize';
import { WechatPlatform } from 'three-platformize/src/WechatPlatform';
import { GLTF, GLTFLoader } from 'three-platformize/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three-platformize/examples/jsm/controls/OrbitControls';

const CANVAS_ID = 'canvas'

Page({

  ctx: null as any,

  arController: null as unknown as ARController,

  threejs: null,

  disposing: false,
  platform: null as unknown as WechatPlatform,
  frameId: -1,

  /**
   * Page initial data
   */
  data: {
    cameraBlockHeight: app.globalData.systemInfo.screenHeight - app.globalData.menuHeaderHeight,
    predicting: false,
    videoWidth: null,
    videoHeight: null
  },

  /**
  * 生命周期函数--监听页面加载
  */
  onLoad: function () {
    //
  },

  /**
     * 生命周期函数--监听页面初次渲染完成
     */
  onReady: async function () {
    setTimeout(() => {
      this.ctx = wx.createCanvasContext(CANVAS_ID);
    }, 500);

    await this.initModel();

    const context = wx.createCameraContext();
    let count = 0;
    const listener = context.onCameraFrame((frame) => {
      count = count + 1;
      if (count === 3) {
        count = 0;
        this.executeClassify(frame);
      }
    })
    listener.start();
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    THREE.PLATFORM.dispose();
  },

  initModel: async function () {
    // this.showLoadingToast();

    // this.hideLoadingToast();
    wx.createSelectorQuery()
      .select('#gl')
      .node()
      .exec((res) => {
        const canvas = res[0].node;
        console.log('canvas', canvas);
        const platform = new WechatPlatform(canvas);
        platform.enableDeviceOrientation('game'); // 开启DeviceOrientation
        this.platform = platform;
        THREE.PLATFORM.set(platform);

        const scene = new THREE.Scene();
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        const camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
        const gltfLoader = new GLTFLoader();

        const controls = new OrbitControls(camera, canvas);
        controls.enableDamping = true;

        gltfLoader.loadAsync('https://626c-blog-541fe4-1257925894.tcb.qcloud.la/nft/card.glb').then((gltf: GLTF) => {
          // @ts-ignore
          gltf.parser = null;
          gltf.scene.position.y = -2;
          scene.add(gltf.scene);
          scene.scale.set(1, 1, 1);
          console.log('gltf', gltf)
        });

        camera.position.z = 15;
        renderer.outputEncoding = THREE.sRGBEncoding;
        scene.add(new THREE.AmbientLight(0xffffff, 1.0))
        scene.add(new THREE.DirectionalLight(0xffffff, 1.0))
        renderer.setSize(canvas.width, canvas.height);
        renderer.setPixelRatio(THREE.$window.devicePixelRatio);

        const render = () => {
          if (!this.disposing) this.frameId = THREE.$requestAnimationFrame(render);
          controls.update();
          renderer.render(scene, camera);
        }
        render()
      })
  },

  onTX(e: any) {
    this.platform.dispatchTouchEvent(e)
  },

  executeClassify: async function (frame: any) {
    if (!this.arController) {
      // this.arController = new ARController({inputWidth: frame.width, inputHeight: frame.height});
      // await this.arController.addImageTargets('https://626c-blog-541fe4-1257925894.tcb.qcloud.la/nft/card.mind');
      // this.arController = new nft.default.ARControllerNFT(frame.width, frame.height, '', {});
      // this.arController.addEventListener('getNFTMarker', (evt: any) => {console.log('getNFTMarker', evt)});
      // this.arController.addEventListener('lostNFTMarker', (evt: any) => {console.log('lostNFTMarker', evt)});
      // await this.arController.loadNFTMarker('https://626c-blog-541fe4-1257925894.tcb.qcloud.la/nft/pinball');
    }

    // console.log(await this.arController.detect(frame));
  },

  showLoadingToast() {
    wx.showLoading({
      title: '拼命加载模型',
    })
  },

  hideLoadingToast() {
    wx.hideLoading()
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: 'AI Pocket - 目标追踪'
    }
  }
})