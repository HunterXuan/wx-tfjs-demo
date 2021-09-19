import * as knn from './knn-classifier';
import * as mobilenet from '../mobilenet/model';

let model: knn.KNNClassifier;

export const load = async () => {
  await mobilenet.load();
  model = knn.create();
};

export const isReady = () => {
  return mobilenet.isReady() && !!model;
};

export const getNumClasses = () => {
  return model.getNumClasses();
};

export const clearClass = (label: number | string) => {
  model.clearClass(label);
};

export const clearAllClasses = () => {
  model.clearAllClasses();
};

export const addExample = async (frame: any, index: number) => {
  const logits = await mobilenet.infer(frame);
  model.addExample(logits, index);
  logits.dispose();
};

export const predictClass = async (frame: any, topK = 3) => {
  const logits = await mobilenet.infer(frame);
  const result = model.predictClass(logits, topK);
  
  logits.dispose();

  return result;
};
