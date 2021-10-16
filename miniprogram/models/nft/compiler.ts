import { Worker } from './compiler.worker';
import { Detector } from './image-target/detector/detector';
import { buildImageList, buildTrackingImageList } from './image-target/image-list';
import {build as hierarchicalClusteringBuild} from './image-target/matching/hierarchical-clustering';
import * as msgpack from '@msgpack/msgpack';
import * as tf from '@tensorflow/tfjs-core';
// TODO: better compression method. now grey image saved in pixels, which could be largere than original image

const CURRENT_VERSION = 2;

export class Compiler {
  data: any;

  constructor() {
    this.data = [];
  }

  // input html Images
  compileImageTargets(images: any[], progressCallback: (arg0: number) => void) {
    return new Promise(async (resolve, reject) => {
      const targetImages: { data?: any; height: any; width: any; }[] = [];
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const processCanvas = document.createElement('canvas');
        processCanvas.width = img.width;
        processCanvas.height = img.height;
        const processContext = processCanvas.getContext('2d');
        // @ts-ignore
        processContext.drawImage(img, 0, 0, img.width, img.height);
        // @ts-ignore
        const processData = processContext.getImageData(0, 0, img.width, img.height);

        const greyImageData = new Uint8Array(img.width * img.height);

        for (let i = 0; i < greyImageData.length; i++) {
          const offset = i * 4;
          greyImageData[i] = Math.floor((processData.data[offset] + processData.data[offset+1] + processData.data[offset+2])/3);
        }
        const targetImage = {data: greyImageData, height: img.height, width: img.width};
        targetImages.push(targetImage);
      }
      
      // compute matching data: 50% progress
      const percentPerImage = 50.0 / targetImages.length;
      let percent = 0.0;
      this.data = [];
      for (let i = 0; i < targetImages.length; i++) {
        const targetImage = targetImages[i];
        const imageList = buildImageList(targetImage);
        const percentPerAction = percentPerImage / imageList.length;
        const matchingData = await _extractMatchingFeatures(imageList, () => {
          percent += percentPerAction;
          progressCallback(percent);
        });
        this.data.push({
          targetImage: targetImage,
          imageList: imageList,
          matchingData: matchingData
        });
      }

      for (let i = 0; i < targetImages.length; i++) {
        const trackingImageList = buildTrackingImageList(targetImages[i]);
        this.data[i].trackingImageList = trackingImageList; 
      }

      // compute tracking data with worker: 50% progress
      const compileTrack = () => {
	      return new Promise((resolve, reject) => {
          const worker = new Worker();
          worker.onmessage = (e) => {
            if (e.data.type === 'progress') {
              progressCallback(50 + e.data.percent);
            } else if (e.data.type === 'compileDone') {
              resolve(e.data.list);
            }
          };
          worker.postMessage({type: 'compile', targetImages});
        });
      }

      const trackingDataList = await compileTrack();
      for (let i = 0; i < targetImages.length; i++) {
        // @ts-ignore
	      this.data[i].trackingData = trackingDataList[i];
      }
      resolve(this.data);
    });
  }

  // not exporting imageList because too large. rebuild this using targetImage
  exportData() {
    const dataList = [];
    for (let i = 0; i < this.data.length; i++) {
      dataList.push({
        //targetImage: this.data[i].targetImage,
        targetImage: {
          width: this.data[i].targetImage.width,
          height: this.data[i].targetImage.height,
        },
        trackingData: this.data[i].trackingData,
        matchingData: this.data[i].matchingData
      });
    }
    const buffer = msgpack.encode({
      v: CURRENT_VERSION,
      dataList
    });
    return buffer;
  }

  importData(buffer: any) {
    const content = msgpack.decode(new Uint8Array(buffer));

    // @ts-ignore
    if (!content.v || content.v !== CURRENT_VERSION) {
      console.error("Your compiled .mind might be outdated. Please recompile");
      return [];
    }
    // @ts-ignore
    const { dataList } = content;
    this.data = dataList;
    return this.data;
  }
}

const _extractMatchingFeatures = async (imageList: any[], doneCallback: { (): void; (arg0: number): void; }) => {
  const keyframes: { maximaPoints: { maxima: boolean; x: number; y: number; scale: number; angle: number[]; descriptors: number[]; }[]; minimaPoints: { maxima: boolean; x: number; y: number; scale: number; angle: number[]; descriptors: number[]; }[]; maximaPointsCluster: { rootNode: { centerPointIndex: any; leaf: boolean; children: never[]; pointIndexes: any; }; }; minimaPointsCluster: { rootNode: { centerPointIndex: any; leaf: boolean; children: never[]; pointIndexes: any; }; }; width: any; height: any; scale: any; }[] = [];
  for (let i = 0; i < imageList.length; i++) {
    const image = imageList[i];
    // TODO: can improve performance greatly if reuse the same detector. just need to handle resizing the kernel outputs
    const detector = new Detector(image.width, image.height);

    await tf.nextFrame();
    tf.tidy(() => {
      //const inputT = tf.tensor(image.data, [image.data.length]).reshape([image.height, image.width]);
      // @ts-ignore
      const inputT = tf.tensor(image.data, [image.data.length], 'float32').reshape([image.height, image.width]);
      //const ps = detector.detectImageData(image.data);
      const {featurePoints: ps} = detector.detect(inputT);

      const maximaPoints = ps.filter((p) => p.maxima); 
      const minimaPoints = ps.filter((p) => !p.maxima); 
      const maximaPointsCluster = hierarchicalClusteringBuild({points: maximaPoints});
      const minimaPointsCluster = hierarchicalClusteringBuild({points: minimaPoints});

      keyframes.push({
        maximaPoints,
        minimaPoints,
        maximaPointsCluster,
        minimaPointsCluster,
        width: image.width,
        height: image.height,
        scale: image.scale
      });
      doneCallback(i);
    });
  }
  return keyframes;
}
