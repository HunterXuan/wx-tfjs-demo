// pages/game/nft/index.ts
const app = getApp<IAppOption>();

import { Controller as ARController } from '../../../models/nft';

import * as THREE from 'three-platformize';
import { WechatPlatform } from 'three-platformize/src/WechatPlatform';
import { GLTF, GLTFLoader } from 'three-platformize/examples/jsm/loaders/GLTFLoader';

const CANVAS_ID = 'canvas'

Page({

  ctx: null as any,

  arController: null as unknown as ARController,

  threejs: null,

  disposing: false,
  platform: null as unknown as WechatPlatform,
  frameId: -1,

  scene: null as unknown as THREE.Scene,
  arModels: [] as GLTF[],
  postMatrixList: [] as THREE.Matrix4[],
  processing: false,

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
    this.scene = new THREE.Scene();
  },

  /**
     * 生命周期函数--监听页面初次渲染完成
     */
  onReady: async function () {
    setTimeout(() => {
      this.ctx = wx.createCanvasContext(CANVAS_ID);
    }, 500);

    const context = wx.createCameraContext();
    const listener = context.onCameraFrame((frame) => {
      this.executeClassify(frame);
    })
    listener.start();
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    THREE.PLATFORM.dispose();
  },

  initARController: async function (frame: any) {
    this.showLoadingToast();

    this.arController = new ARController({
      inputWidth: frame.width,
      inputHeight: frame.height,
      maxTrack: 1,
      onUpdate: (data: { type?: any; targetIndex?: any; worldMatrix?: any; }) => {
        if (data.type === 'updateMatrix') {
          console.log('onUpdate:', new Date().getTime(), data);
          const {targetIndex, worldMatrix} = data;

          for (let i = 0; i < this.arModels.length; i++) {
            if (i === targetIndex) {
              try {
                this.arModels[i].visible = worldMatrix !== null;
                if (worldMatrix !== null) {
                  const m = new THREE.Matrix4();
                  const v = new THREE.Vector3(0.005, 0.005, 0.005);
                  m.elements = worldMatrix;
                  m.multiply(this.postMatrixList[i]);
                  m.scale(v);
                  this.arModels[i].matrix = m;
                }
                // console.log('scene', this.scene)
              } catch (e) {
                console.error('updateMatrix', e)
              }
            }
          }
        }
      }
    });

    const proj = this.arController.getProjectionMatrix();
    const fov = 2 * Math.atan(1/proj[5] ) * 180 / Math.PI; // vertical fov
    const near = proj[14] / (proj[10] - 1.0);
    const far = proj[14] / (proj[10] + 1.0);

    wx.createSelectorQuery()
    .select('#gl')
    .node()
    .exec(async (res) => {
      const canvas = res[0].node;
      const platform = new WechatPlatform(canvas);
      platform.enableDeviceOrientation('game'); // 开启DeviceOrientation
      this.platform = platform;
      THREE.PLATFORM.set(platform);

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      const camera = new THREE.PerspectiveCamera(fov, canvas.width / canvas.height, near, far);

      camera.position.z = 15;
      renderer.outputEncoding = THREE.sRGBEncoding;
      this.scene.add(new THREE.AmbientLight(0xffffff, 1.0))
      this.scene.add(new THREE.DirectionalLight(0xffffff, 1.0))
      renderer.setSize(canvas.width, canvas.height);
      renderer.setPixelRatio(THREE.$window.devicePixelRatio);

      const render = () => {
        if (!this.disposing) {
          this.frameId = THREE.$requestAnimationFrame(render);
        }
        renderer.render(this.scene, camera);
      };
      render();
    });

    const { dimensions } = await this.arController.addImageTargets('https://ai.flypot.cn/pocket/models/nft/card.mind');

    const gltfLoader = new GLTFLoader();
    const gltf = await gltfLoader.loadAsync('https://ai.flypot.cn/pocket/models/nft/softmind/scene.gltf');
    const arModel = gltf.scene;
    arModel.visible = false;
    arModel.matrixAutoUpdate = false;
    this.arModels.push(arModel);

    this.scene.add(arModel);

    for (let i = 0; i < this.arModels.length; i++) {
      const [markerWidth, markerHeight] = dimensions[i];
      const position = new THREE.Vector3();
      const quaternion = new THREE.Quaternion();
      const scale = new THREE.Vector3();
      position.x = markerWidth / 2;
      position.y = markerWidth / 2 + (markerHeight - markerWidth) / 2;
      scale.x = markerWidth;
      scale.y = markerWidth;
      scale.z = markerWidth;

      this.postMatrixList[i] = new THREE.Matrix4();
      this.postMatrixList[i].compose(position, quaternion, scale);
      console.log('postMatrixList', this.postMatrixList)
    }

    try {
      await this.arController.dummyRun(frame);
    } catch(e) {
      console.error('dummyRun', e);
    }

    this.hideLoadingToast();
  },

  executeClassify: async function (frame: any) {
    if (this.processing) {
      return;
    }

    this.processing = true;
    if (!this.arController) {
      await this.initARController(frame);
    }

    await this.arController.processVideo(frame);
    this.processing = false;
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