const {extract} = require('./image-target/tracker/extract');
const {buildImageList} = require('./image-target/image-list');

const postMessage = (data, callback) => {
  callback({data});
};

export class Worker {
  public onmessage = (e: any)=>{console.log('message', e)};

  postMessage (data) {
    this.processMessage({data});
  }

  processMessage (msg: { data: any; }) {
    const {data} = msg;
    if (data.type === 'compile') {
      //console.log("worker compile...");
      const {targetImages} = data;
      const percentPerImage = 50.0 / targetImages.length;
      let percent = 0.0;
      const list = [];
      for (let i = 0; i < targetImages.length; i++) {
        const targetImage = targetImages[i];
        const imageList = buildImageList(targetImage);
        const percentPerAction = percentPerImage / imageList.length;

        //console.log("compiling tracking...", i);
        const trackingData = _extractTrackingFeatures(imageList, (index) => {
    //console.log("done tracking", i, index);
    percent += percentPerAction
    postMessage({type: 'progress', percent}, this.onmessage);
        });
        list.push(trackingData);
      }
      postMessage({
        type: 'compileDone',
        list,
      }, this.onmessage);
    }
  }
};

const _extractTrackingFeatures = (imageList, doneCallback) => {
  const featureSets = [];
  for (let i = 0; i < imageList.length; i++) {
    const image = imageList[i];
    const points = extract(image);

    const featureSet = {
      scale: image.scale,
      width: image.width,
      height: image.height,
      points,
    };
    featureSets.push(featureSet);

    doneCallback(i);
  }
  return featureSets;
}