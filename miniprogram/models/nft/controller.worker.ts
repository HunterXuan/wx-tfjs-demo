import { Matcher } from './image-target/matching/matcher';
import { Estimator } from './image-target/estimation/estimator';

var projectionTransform = null;
var matchingDataList: string | any[] = [];
var debugMode = false;
var matcher: Matcher | null = null;
var estimator: Estimator | null = null;

const postMessage = (data: any, callback: any) => {
  callback({data});
};

export class Worker {
  public onmessage = (e: any)=>{console.log('message', e)};

  postMessage (data: any) {
    this.processMessage({data});
  }

  processMessage (msg: any) {
    const {data} = msg;

    if (data.type === 'setup') {
      console.log('worker setup', data);
      projectionTransform = data.projectionTransform;
      matchingDataList = data.matchingDataList;
      debugMode = data.debugMode;
      matcher = new Matcher(data.inputWidth, data.inputHeight, debugMode);
      estimator = new Estimator(data.projectionTransform);
    } else if (data.type === 'match') {
      // console.log('worker match', data);
      
      const interestedTargetIndexes = data.targetIndexes;

      let matchedTargetIndex = -1;
      let matchedModelViewTransform = null;
      let matchedDebugExtra = null;

      for (let i = 0; i < interestedTargetIndexes.length; i++) {
        const matchingIndex = interestedTargetIndexes[i];

        // @ts-ignore
        const {keyframeIndex, screenCoords, worldCoords, debugExtra} = matcher.matchDetection(matchingDataList[matchingIndex], data.featurePoints);
        // console.log('matchDetection', matchingDataList[matchingIndex], keyframeIndex, screenCoords, worldCoords, debugExtra)
        matchedDebugExtra = debugExtra;

        if (keyframeIndex !== -1) {
          // @ts-ignore
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
      // @ts-ignore
      const finalModelViewTransform = estimator.refineEstimate({initialModelViewTransform: modelViewTransform, worldCoords, screenCoords});
      postMessage({
        type: 'trackUpdateDone',
        modelViewTransform: finalModelViewTransform,
      }, this.onmessage);
    }
  }
};
