import * as tf from '@tensorflow/tfjs-core';
import {buildModelViewProjectionTransform, computeScreenCoordiate} from '../estimation/utils';

const AR2_DEFAULT_TS = 6;
const AR2_DEFAULT_TS_GAP = 1;
const AR2_SEARCH_SIZE = 10;
const AR2_SEARCH_GAP = 1;
const AR2_SIM_THRESH = 0.8;

const TRACKING_KEYFRAME = 1;

// For some mobile device, only 16bit floating point texture is supported
//   ref: https://www.tensorflow.org/js/guide/platform_environment#precision
// Empirical results shows that modelViewProjectTransform can go up beyond that, resulting in error
// We get around this by dividing the transform matrix by 1000, and then multiply back inside webgl program
const PRECISION_ADJUST = 1000;

export class Tracker {
	trackingDataList: any;
	imageListList: any;
	projectionTransform: any;
	debugMode: boolean;
	featurePointsListT: any[];
	imagePixelsListT: any[];
	imagePropertiesListT: any[];
	kernelCaches: {
		computeMatching: any,
		_computeColoredProjection: any,
		computeProjection: any
	};
	markerDimensions: any;
	trackingKeyframeList: any;

  constructor(markerDimensions: any[][], trackingDataList: string | any[], projectionTransform: number[][], inputWidth: any, inputHeight: any, debugMode=false) {
    this.markerDimensions = markerDimensions;
    this.trackingDataList = trackingDataList;
    this.projectionTransform = projectionTransform;
    this.debugMode = debugMode;

    this.trackingKeyframeList = [];
    for (let i = 0; i < trackingDataList.length; i++) {
      this.trackingKeyframeList.push(trackingDataList[i][TRACKING_KEYFRAME]);
    }

    // prebuild feature and marker pixel tensors
    let maxCount = 0;
    for (let i = 0; i < this.trackingKeyframeList.length; i++) {
      maxCount = Math.max(maxCount, this.trackingKeyframeList[i].points.length);
    }
    this.featurePointsListT = [];
    this.imagePixelsListT = [];
    this.imagePropertiesListT = [];

    for (let i = 0; i < this.trackingKeyframeList.length; i++) {
      const {featurePoints, imagePixels, imageProperties} = this._prebuild(this.trackingKeyframeList[i], maxCount);
      this.featurePointsListT[i] = featurePoints;
      this.imagePixelsListT[i] = imagePixels;
      this.imagePropertiesListT[i] = imageProperties;
    }

    this.kernelCaches = {
			computeMatching: null,
			_computeColoredProjection: null,
			computeProjection: null
		};
  }

  dummyRun(inputT: tf.Tensor3D) {
    let transform = [[1,1,1,1], [1,1,1,1], [1,1,1,1]];
    for (let targetIndex = 0; targetIndex < this.featurePointsListT.length; targetIndex++) {
      for (let i = 0; i < this.featurePointsListT[targetIndex].length; i++) {
				this.track(inputT, transform, targetIndex);
      }
    }
  }

  captureRegion(inputImageT: any, lastModelViewTransform: number[][], targetIndex: any, captureWidth: any, captureHeight: any) {
    const modelViewProjectionTransform = buildModelViewProjectionTransform(this.projectionTransform, lastModelViewTransform);
    const modelViewProjectionTransformT = this._buildAdjustedModelViewTransform(modelViewProjectionTransform);
    const projectedImageT = this._computeColoredProjection(modelViewProjectionTransformT, inputImageT, targetIndex, captureWidth, captureHeight);

		// @ts-ignore
    const projectedImage = projectedImageT.arraySync();

    modelViewProjectionTransformT.dispose();
		// @ts-ignore
    projectedImageT.dispose();

    return projectedImage;
  }

  track(inputImageT: any, lastModelViewTransform: any, targetIndex: number) {
		let debugExtra = {};

    const modelViewProjectionTransform = buildModelViewProjectionTransform(this.projectionTransform, lastModelViewTransform);
    const modelViewProjectionTransformT = this._buildAdjustedModelViewTransform(modelViewProjectionTransform);

    // const markerWidth = this.markerDimensions[targetIndex][0];
    // const markerHeight = this.markerDimensions[targetIndex][1];
    // const keyframeWidth = this.trackingKeyframeList[targetIndex].width; 
    // const keyframeHeight = this.trackingKeyframeList[targetIndex].height; 

    const featurePointsT = this.featurePointsListT[targetIndex];
    const imagePixelsT = this.imagePixelsListT[targetIndex];
    const imagePropertiesT = this.imagePropertiesListT[targetIndex];

    const projectedImageT = this._computeProjection(modelViewProjectionTransformT, inputImageT, targetIndex);

		// @ts-ignore
    const {matchingPointsT, simT} = this._computeMatching(featurePointsT, imagePixelsT, imagePropertiesT, projectedImageT);

		// @ts-ignore
    const matchingPoints = matchingPointsT.arraySync() as number[][];
		// @ts-ignore
    const sim = simT.arraySync() as number[];
		// console.log('sim', sim, matchingPoints)

    const trackingFrame = this.trackingKeyframeList[targetIndex];
    const worldCoords = [];
    const screenCoords = [];
    const goodTrack = [];

    for (let i = 0; i < matchingPoints.length; i++) {
      if (sim[i] > AR2_SIM_THRESH && i < trackingFrame.points.length) {
				goodTrack.push(i);
				const point = computeScreenCoordiate(modelViewProjectionTransform, matchingPoints[i][0], matchingPoints[i][1]);
				screenCoords.push(point);
				worldCoords.push({x: trackingFrame.points[i].x / trackingFrame.scale, y: trackingFrame.points[i].y / trackingFrame.scale, z: 0});
      }
    }

    if (this.debugMode) {
      debugExtra = {
				// @ts-ignore
				projectedImage: projectedImageT.arraySync(),
				// @ts-ignore
				matchingPoints: matchingPointsT.arraySync(),
				goodTrack,
				trackedPoints: screenCoords
      }
    }

    // tensors cleanup
    modelViewProjectionTransformT.dispose();
		// @ts-ignore
    projectedImageT.dispose();
		// @ts-ignore
    matchingPointsT.dispose();
		// @ts-ignore
    simT.dispose();

    return {worldCoords, screenCoords, debugExtra};
  }

  _computeMatching(featurePointsT: { shape: any[]; }, imagePixelsT: any, imagePropertiesT: any, projectedImageT: tf.Tensor<tf.Rank>) {
    const templateOneSize = AR2_DEFAULT_TS;
    const templateSize = templateOneSize * 2 + 1;
    const templateGap = AR2_DEFAULT_TS_GAP;
    const searchOneSize = AR2_SEARCH_SIZE * templateGap;
    const searchGap = AR2_SEARCH_GAP;
    const searchSize = searchOneSize * 2 + 1;
    const targetHeight = projectedImageT.shape[0];
    const targetWidth = projectedImageT.shape[1];
    const featureCount = featurePointsT.shape[0];

    if (!this.kernelCaches.computeMatching) {
      const kernel1 = {
				variableNames: ['features', 'markerPixels', 'markerProperties', 'targetPixels'],
				outputShape: [featureCount, searchSize * searchSize],
				userCode: `
					void main() {
						ivec2 coords = getOutputCoords();
						int featureIndex = coords[0];
						int searchOffsetIndex = coords[1];
						int markerWidth = int(getMarkerProperties(0));
						int markerHeight = int(getMarkerProperties(1));
						float markerScale = getMarkerProperties(2);
						int searchOffsetX = imod(searchOffsetIndex, ${searchSize}) * ${searchGap};
						int searchOffsetY = searchOffsetIndex / ${searchSize} * ${searchGap};
						int sCenterX = int(getFeatures(featureIndex, 0) * markerScale);
						int sCenterY = int(getFeatures(featureIndex, 1) * markerScale);
						int sx = sCenterX + searchOffsetX - ${searchOneSize};
						int sy = sCenterY + searchOffsetY - ${searchOneSize};
						if (sx < ${templateOneSize} || sx >= (${targetWidth} - ${templateOneSize}) || sy < ${templateOneSize} || sy >= (${targetHeight} - ${templateOneSize})) {
							setOutput(-2.);
						} else {
							float sumPoint = 0.;
							float sumPointSquare = 0.;
							float sumTemplate = 0.;
							float sumTemplateSquare = 0.;
							float sumPointTemplate = 0.;
							for (int templateOffsetY = 0; templateOffsetY < ${templateSize}; templateOffsetY++) {
								for (int templateOffsetX = 0; templateOffsetX < ${templateSize}; templateOffsetX++) {
									int fx2 = sCenterX + templateOffsetX - ${templateOneSize};
									int fy2 = sCenterY + templateOffsetY - ${templateOneSize};
									int sx2 = sx + templateOffsetX - ${templateOneSize};
									int sy2 = sy + templateOffsetY - ${templateOneSize};
									int markerPixelIndex = fy2 * markerWidth + fx2;
									float markerPixel = getMarkerPixels(markerPixelIndex);
									float targetPixel = getTargetPixels(sy2, sx2);
									sumTemplate += markerPixel;
									sumTemplateSquare += markerPixel * markerPixel;
									sumPoint += targetPixel;
									sumPointSquare += targetPixel * targetPixel;
									sumPointTemplate += targetPixel * markerPixel;
								}
							}
							// Normalized cross-correlation
							// !important divide first avoid overflow (e.g. sumPoint / count * sumPoint)
							float count = float(${templateSize} * ${templateSize});
							float pointVariance = sqrt(sumPointSquare - sumPoint / count * sumPoint);
							float templateVariance = sqrt(sumTemplateSquare - sumTemplate / count * sumTemplate);
							if (pointVariance < 0.0000001) {
								setOutput(-3.);
							} else if (templateVariance < 0.0000001) {
								// setOutput(sumTemplate);
								setOutput(-4.);
							} else {
								sumPointTemplate -= sumPoint / count * sumTemplate;
								float sim = sumPointTemplate / pointVariance / templateVariance;
								setOutput(sim);
							}
						}
					}
				`
			};

			const kernel2 = {
				variableNames: ['featurePoints', 'markerProperties', 'maxIndex'],
				outputShape: [featureCount, 2], // [x, y]
				userCode: `
					void main() {
						ivec2 coords = getOutputCoords();
						float markerScale = getMarkerProperties(2);
						int featureIndex = coords[0];
						int maxIndex = int(getMaxIndex(featureIndex));
						int searchLocationIndex = maxIndex / ${searchSize * searchSize};
						int searchOffsetIndex = imod(maxIndex, ${searchSize * searchSize});
						if (coords[1] == 0) {
							int searchOffsetX = imod(searchOffsetIndex, ${searchSize}) * ${searchGap};
							setOutput(getFeaturePoints(featureIndex, 0) + float(searchOffsetX - ${searchOneSize}) / markerScale);
						} else if (coords[1] == 1) {
							int searchOffsetY = searchOffsetIndex / ${searchSize} * ${searchGap};
							setOutput(getFeaturePoints(featureIndex, 1) + float(searchOffsetY - ${searchOneSize}) / markerScale);
						}
					}
				`
      }

      const kernel3 = {
				variableNames: ['sims', 'maxIndex'],
				outputShape: [featureCount],
				userCode: `
					void main() {
						int featureIndex = getOutputCoords();
						int maxIndex = int(getMaxIndex(featureIndex));
						setOutput(getSims(featureIndex, maxIndex));
					}
				`
      }

      this.kernelCaches.computeMatching = [kernel1, kernel2, kernel3];
    }

    return tf.tidy(() => {
      const programs = this.kernelCaches.computeMatching;
      const allSims = this._compileAndRun(programs[0], [featurePointsT, imagePixelsT, imagePropertiesT, projectedImageT]);
			// @ts-ignore
      const maxIndex = tf.argMax(allSims, 1);
      const matchingPointsT = this._compileAndRun(programs[1], [featurePointsT, imagePropertiesT, maxIndex]);
      const simT = this._compileAndRun(programs[2], [allSims, maxIndex]);
      return {matchingPointsT, simT};
    });
  }

  _computeProjection(modelViewProjectionTransformT: tf.Tensor<tf.Rank>, inputImageT: any, targetIndex: number) {
    const markerWidth = this.trackingKeyframeList[targetIndex].width;
    const markerHeight = this.trackingKeyframeList[targetIndex].height;
    const markerScale = this.trackingKeyframeList[targetIndex].scale;
    const kernelKey = markerWidth + "-" + markerHeight;

    if (!this.kernelCaches.computeProjection) {
      this.kernelCaches.computeProjection = {};
    }

    if (!this.kernelCaches.computeProjection[kernelKey]) {
      const kernel = {
				variableNames: ['M', 'pixel'],
				outputShape: [markerHeight, markerWidth],
				userCode: `
					void main() {
						ivec2 coords = getOutputCoords();
						float m00 = getM(0, 0) * ${PRECISION_ADJUST}.;
						float m01 = getM(0, 1) * ${PRECISION_ADJUST}.;
						float m03 = getM(0, 3) * ${PRECISION_ADJUST}.;
						float m10 = getM(1, 0) * ${PRECISION_ADJUST}.;
						float m11 = getM(1, 1) * ${PRECISION_ADJUST}.;
						float m13 = getM(1, 3) * ${PRECISION_ADJUST}.;
						float m20 = getM(2, 0) * ${PRECISION_ADJUST}.;
						float m21 = getM(2, 1) * ${PRECISION_ADJUST}.;
						float m23 = getM(2, 3) * ${PRECISION_ADJUST}.;
						float y = float(coords[0]) / float(${markerScale});
						float x = float(coords[1]) / float(${markerScale});
						float uz = (x * m20) + (y * m21) + m23;
						float oneOverUz = 1. / uz;
						float ux = (x * m00) + (y * m01) + m03;
						float uy = (x * m10) + (y * m11) + m13;
						ux = floor(ux * oneOverUz + 0.5);
						uy = floor(uy * oneOverUz + 0.5);
						setOutput(getPixel(int(uy), int(ux)));
					}
				`
      };

      this.kernelCaches.computeProjection[kernelKey] = kernel;
    }

    return tf.tidy(() => {
      const program = this.kernelCaches.computeProjection[kernelKey];
      const result = this._compileAndRun(program, [modelViewProjectionTransformT, inputImageT]);
      return result;
    });
  }

  _computeColoredProjection(modelViewProjectionTransformT: tf.Tensor<tf.Rank>, inputImageT: any, targetIndex: number, captureWidth: number, captureHeight: string) {
    const markerWidth = this.trackingKeyframeList[targetIndex].width;
    // const markerHeight = this.trackingKeyframeList[targetIndex].height;
    const markerScale = this.trackingKeyframeList[targetIndex].scale;

    const captureScale = markerScale * captureWidth / markerWidth;

    const kernelKey = captureWidth + "-" + captureHeight;

    if (!this.kernelCaches._computeColoredProjection) {
      this.kernelCaches._computeColoredProjection = {};
    }

    if (!this.kernelCaches._computeColoredProjection[kernelKey]) {
      const kernel = {
				variableNames: ['M', 'pixel'],
				outputShape: [captureHeight, captureWidth, 3],
				userCode: `
					void main() {
						ivec3 coords = getOutputCoords();
						float m00 = getM(0, 0) * ${PRECISION_ADJUST}.;
						float m01 = getM(0, 1) * ${PRECISION_ADJUST}.;
						float m03 = getM(0, 3) * ${PRECISION_ADJUST}.;
						float m10 = getM(1, 0) * ${PRECISION_ADJUST}.;
						float m11 = getM(1, 1) * ${PRECISION_ADJUST}.;
						float m13 = getM(1, 3) * ${PRECISION_ADJUST}.;
						float m20 = getM(2, 0) * ${PRECISION_ADJUST}.;
						float m21 = getM(2, 1) * ${PRECISION_ADJUST}.;
						float m23 = getM(2, 3) * ${PRECISION_ADJUST}.;
						float y = float(coords[0]) / float(${captureScale});
						float x = float(coords[1]) / float(${captureScale});
						float uz = (x * m20) + (y * m21) + m23;
						float oneOverUz = 1. / uz;
						float ux = (x * m00) + (y * m01) + m03;
						float uy = (x * m10) + (y * m11) + m13;
						ux = floor(ux * oneOverUz + 0.5);
						uy = floor(uy * oneOverUz + 0.5);
						setOutput(getPixel(int(uy), int(ux), coords[2]));
					}
				`
      };

      this.kernelCaches._computeColoredProjection[kernelKey] = kernel;
    }

    return tf.tidy(() => {
      const program = this.kernelCaches._computeColoredProjection[kernelKey];
      const result = this._compileAndRun(program, [modelViewProjectionTransformT, inputImageT]);
      return result;
    });
  }
  
  _buildAdjustedModelViewTransform(modelViewProjectionTransform: number[][]) {
    return tf.tidy(() => {
      let modelViewProjectionTransformAdjusted: number[][] = [];
      for (let i = 0; i < modelViewProjectionTransform.length; i++) {
				modelViewProjectionTransformAdjusted.push([]);
				for (let j = 0; j < modelViewProjectionTransform[i].length; j++) {
					modelViewProjectionTransformAdjusted[i].push(modelViewProjectionTransform[i][j] / PRECISION_ADJUST);
				}
      }
      const t = tf.tensor(modelViewProjectionTransformAdjusted, [3, 4]);
      return t;
    });
  }

  _prebuild(trackingFrame: any, maxCount: number) {
    return tf.tidy(() => {
			// console.log('trackingFrame', trackingFrame)
      const scale = trackingFrame.scale;

      const p = [];
      for (let k = 0; k < maxCount; k++) {
				if (k < trackingFrame.points.length) {
					p.push([trackingFrame.points[k].x / scale, trackingFrame.points[k].y / scale]);
				} else {
					p.push([-1, -1]);
				}
      }
			// console.log('p', p)
      // const imagePixelsTmp = tf.browser.fromPixels({
			// 	data: trackingFrame.data,
			// 	width: trackingFrame.width,
			// 	height: trackingFrame.height,
			// }, 1);
			// const imagePixels = tf.reshape(imagePixelsTmp, [trackingFrame.width * trackingFrame.height]);
			const imagePixels = tf.tensor1d(trackingFrame.data);
			// console.log('imagePixels', imagePixels.shape, imagePixels.arraySync())
      const imageProperties = tf.tensor([trackingFrame.width, trackingFrame.height, trackingFrame.scale], [3], 'float32');
      const featurePoints = tf.tensor(p, [p.length, 2], 'float32');

      return {
				featurePoints,
				imagePixels,
				imageProperties
      }
    });
  }

	// @ts-ignore
  _compileAndRun(program: any, inputs: any[]) {
		try {
			const backend = tf.backend();
			// @ts-ignore
			const outInfo = backend.compileAndRun(program, inputs);
			return tf.engine().makeTensorFromDataId(outInfo.dataId, outInfo.shape, outInfo.dtype);
		} catch (e) {
			console.log('_compileAndRun', e)
		}
  }
}

