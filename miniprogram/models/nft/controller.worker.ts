import { Matcher } from './image-target/matching/matcher';
import { Estimator } from './image-target/estimation/estimator';

var projectionTransform = null;
var matchingDataList: string | any[] = [];
var debugMode = false;
var matcher = null;
var estimator = null;

const postMessage = (data, callback) => {
  callback({data});
};

export class Worker {
  public onmessage = (e: any)=>{console.log('message', e)};

  postMessage (data) {
    this.processMessage({data});
  }

  processMessage (msg) {
    const {data} = msg;

    if (data.type === 'setup') {
      projectionTransform = data.projectionTransform;
      matchingDataList = data.matchingDataList;
      debugMode = data.debugMode;
      matcher = new Matcher(data.inputWidth, data.inputHeight, debugMode);
      estimator = new Estimator(data.projectionTransform);

      console.log('setup, matchingDataList', matchingDataList)
    } else if (data.type === 'match') {
      console.log('match, matchingDataList', matchingDataList)
      
      const interestedTargetIndexes = data.targetIndexes;

      let matchedTargetIndex = -1;
      let matchedModelViewTransform = null;
      let matchedDebugExtra = null;

      for (let i = 0; i < interestedTargetIndexes.length; i++) {
        const matchingIndex = interestedTargetIndexes[i];

        const {keyframeIndex, screenCoords, worldCoords, debugExtra} = matcher.matchDetection(matchingDataList[matchingIndex], data.featurePoints);
        matchedDebugExtra = debugExtra;

        if (keyframeIndex !== -1) {
          const modelViewTransform = estimator.estimate({screenCoords, worldCoords});

          if (modelViewTransform) {
            matchedTargetIndex = matchingIndex;
            matchedModelViewTransform = modelViewTransform;
          }
          break;
        }
      }

      postMessage({
        type: 'matchDone',
        targetIndex: matchedTargetIndex,
        modelViewTransform: matchedModelViewTransform,
        debugExtra: matchedDebugExtra
      }, this.onmessage);

    } else if (data.type === 'trackUpdate') {
      const {modelViewTransform, worldCoords, screenCoords} = data;
      const finalModelViewTransform = estimator.refineEstimate({initialModelViewTransform: modelViewTransform, worldCoords, screenCoords});
      postMessage({
        type: 'trackUpdateDone',
        modelViewTransform: finalModelViewTransform,
      }, this.onmessage);
    }
  }
};
