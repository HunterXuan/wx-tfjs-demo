const tf = require('@tensorflow/tfjs');
const mobilenet = require('@tensorflow-models/mobilenet');
const posenet = require('@tensorflow-models/posenet');
const bodypix = require('@tensorflow-models/body-pix');
const cocoSSD = require('@tensorflow-models/coco-ssd');
const handPose = require('@tensorflow-models/handpose');
const face = require('@tensorflow-models/face-landmarks-detection');
const fs = require('fs');

const mobilenetPredict = async () => {
  // mobilenet
  const model = await mobilenet.load({
    version: 1,
    modelUrl: 'https://www.gstaticcnapps.cn/tfhub-tfjs-modules/google/imagenet/mobilenet_v1_025_224/classification/1/model.json'
  });
  return await model.infer(tf.zeros([1, 224, 224, 3]));
};

const posenetPredict = async () => {
  // posenet
  const model = await posenet.load(
    {
      architecture: 'MobileNetV1',
      outputStride: 16,
      inputResolution: 193,
      multiplier: 0.5,
      modelUrl: 'https://www.gstaticcnapps.cn/tfjs-models/savedmodel/posenet/mobilenet/float/050/model-stride16.json'
    }
  );
  return await model.estimateSinglePose(tf.zeros([513, 513, 3]));
};

const bodypixPredict = async () => {
  // body-pix
  const model = await bodypix.load({
    architecture: 'MobileNetV1',
    outputStride: 16,
    multiplier: 0.5,
    modelUrl: 'https://www.gstaticcnapps.cn/tfjs-models/savedmodel/bodypix/mobilenet/float/050/model-stride16.json'
  });
  return await model.segmentPerson(tf.zeros([73, 73, 3]));
};

const cocoSSDPredict = async () => {
  // body-pix
  const model = await cocoSSD.load({
    modelUrl: 'https://ai.flypot.cn/models/coco-ssd/model.json'
  });
  return await model.detect(tf.zeros([227, 227, 3], 'int32'));
};

const handPosePredict = async () => {
  // handpose
  const model = await handPose.load();
  return await model.estimateHands(tf.zeros([128, 128, 3]));
};

const facePredict = async () => {
  // face
  const model = await face.load();
  return await model.estimateFaces({input: tf.zeros([128, 128, 3])});
};

tf.profile(async () => {
  try {
    await mobilenetPredict();
    await posenetPredict();
    await bodypixPredict();
    await cocoSSDPredict();
    await facePredict();
    // await handPosePredict();
  } catch (e) {
    console.error('error:', e);
  }
}).then(e => {
  console.log('kernels:', e.kernelNames);

  let rawData = fs.readFileSync('./tfjs_config.json');
  let tfjsConfig = JSON.parse(rawData);
  tfjsConfig.kernels = e.kernelNames;
  fs.writeFileSync('./tfjs_config.json', JSON.stringify(tfjsConfig, null, 2));
});