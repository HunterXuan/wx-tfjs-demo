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
    //
  },

  /**
     * 生命周期函数--监听页面初次渲染完成
     */
  onReady: async function () {
    setTimeout(() => {
      this.ctx = wx.createCanvasContext(CANVAS_ID);
    }, 500);

    // await this.initModel();

    const context = wx.createCameraContext();
    let count = 0;
    const listener = context.onCameraFrame((frame) => {
      this.executeClassify(frame);
      // count = count + 1;
      // if (count === 3) {
      //   count = 0;
      //   this.executeClassify(frame);
      // }
    })
    listener.start();
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    THREE.PLATFORM.dispose();
  },

  // initModel: async function () {
  //   // this.showLoadingToast();

  //   // this.hideLoadingToast();
  //   wx.createSelectorQuery()
  //     .select('#gl')
  //     .node()
  //     .exec((res) => {
  //       const canvas = res[0].node;
  //       // console.log('canvas', canvas);
  //       const platform = new WechatPlatform(canvas);
  //       platform.enableDeviceOrientation('game'); // 开启DeviceOrientation
  //       this.platform = platform;
  //       THREE.PLATFORM.set(platform);

  //       const scene = new THREE.Scene();
  //       const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  //       const camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
  //       const gltfLoader = new GLTFLoader();

  //       const controls = new OrbitControls(camera, canvas);
  //       controls.enableDamping = true;

  //       gltfLoader.loadAsync('https://626c-blog-541fe4-1257925894.tcb.qcloud.la/nft/card.glb').then((gltf: GLTF) => {
  //         // @ts-ignore
  //         gltf.parser = null;
  //         gltf.scene.position.y = -2;
  //         scene.add(gltf.scene);
  //         scene.scale.set(1, 1, 1);
  //         console.log('gltf', gltf);
  //       });

  //       camera.position.z = 15;
  //       renderer.outputEncoding = THREE.sRGBEncoding;
  //       scene.add(new THREE.AmbientLight(0xffffff, 1.0))
  //       scene.add(new THREE.DirectionalLight(0xffffff, 1.0))
  //       renderer.setSize(canvas.width, canvas.height);
  //       renderer.setPixelRatio(THREE.$window.devicePixelRatio);

  //       const render = () => {
  //         if (!this.disposing) this.frameId = THREE.$requestAnimationFrame(render);
  //         controls.update();
  //         renderer.render(scene, camera);
  //       }
  //       render()
  //     })
  // },

  initARController: async function (frame: any) {
    this.arController = new ARController({
      inputWidth: frame.width,
      inputHeight: frame.height,
      maxTrack: 1,
      onUpdate: (data) => {
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
    const ratio = proj[5] / proj[0]; // (r-l) / (t-b)

    this.scene = new THREE.Scene();

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

      console.log('canvas', canvas.width, canvas.height)
      console.log('frame', frame.width, frame.height)
      console.log('pixel ratio', THREE.$window.devicePixelRatio)
      // const controls = new OrbitControls(camera, canvas);
      // controls.enableDamping = true;

      camera.position.z = 15;
      renderer.outputEncoding = THREE.sRGBEncoding;
      this.scene.add(new THREE.AmbientLight(0xffffff, 1.0))
      this.scene.add(new THREE.DirectionalLight(0xffffff, 1.0))
      renderer.setSize(canvas.width, canvas.height);
      // renderer.setSize(frame.width, frame.height);
      renderer.setPixelRatio(THREE.$window.devicePixelRatio);

      this.renderer = renderer;
      this.camera = camera;

      const render = () => {
        if (!this.disposing) this.frameId = THREE.$requestAnimationFrame(render);
        // controls.update();
        this.renderer.render(this.scene, this.camera);
      };
      render();
    })

    const { dimensions } = await this.arController.addImageTargets('https://626c-blog-541fe4-1257925894.tcb.qcloud.la/nft/card.mind');
    console.log('dimentions', dimensions)

    const gltfLoader = new GLTFLoader();
    const gltf = await gltfLoader.loadAsync('https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.0.0/examples/image-tracking/assets/card-example/softmind/scene.gltf');
    const arModel = gltf.scene;
    arModel.visible = false;
    arModel.matrixAutoUpdate = false;
    this.arModels.push(arModel);

    // arModel.parser = null;
    this.scene.add(arModel);
    console.log('add model scene', this.scene);
    // this.scene.scale.set(1, 1, 1);
    // arModel.scene.position.y = -10;
    
    
    console.log('arModels:', this.arModels);

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

    console.log('dummyRun')
    try{
    await this.arController.dummyRun(frame);
    }catch(e) {
      console.error('dummyRun', e)
    }
  },

  onTX(e: any) {
    // this.platform.dispatchTouchEvent(e)
    // console.log('scene', this.scene)
  },

  executeClassify: async function (frame: any) {
    if (this.processing) {
      return;
    }

    this.processing = true;
    if (!this.arController) {
      await this.initARController(frame);
      console.log('init done')
    }

    // console.log('before processVideo');
    await this.arController.processVideo(frame);
    this.processing = false;
    // console.log('after processVideo')
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