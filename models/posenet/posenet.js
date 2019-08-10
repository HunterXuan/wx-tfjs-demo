import * as tf from '@tensorflow/tfjs-core'

import { drawKeypoints, drawSkeleton } from './util'

import { getFrameSliceOptions } from '../../utils/util'

// export const videoWidth = 288
// export const videoHeight = 352
export const videoWidth = wx.getSystemInfoSync().windowWidth
export const videoHeight = wx.getSystemInfoSync().windowHeight
// const scale = wx.getSystemInfoSync().windowWidth / 288

/**
 * Feeds an image to posenet to estimate poses - this is where the magic
 * happens. This function loops with a requestAnimationFrame method.
 */
export async function detectPoseInRealTime(image, net, mirror) {
  const video = tf.tidy(() => {
    const temp = tf.tensor(new Uint8Array(image.data), [image.height, image.width, 4])
    const sliceOptions = getFrameSliceOptions('front', image.width, image.height, videoWidth, videoHeight)
    
    return temp.slice(sliceOptions.start, sliceOptions.size).resizeBilinear([videoHeight, videoWidth])
  })

  // since images are being fed from a webcam
  const flipHorizontal = mirror

  const pose = await net.estimateSinglePose(
    video, { flipHorizontal })
  video.dispose()
  return [pose]
}

export function drawPoses(ctx, poses) {
  if (!ctx && !poses) {
    return
  }
  
  const minPoseConfidence = 0.3
  const minPartConfidence = 0.3
  // For each pose (i.e. person) detected in an image, loop through the poses
  // and draw the resulting skeleton and keypoints if over certain confidence
  // scores
  poses.forEach(({ score, keypoints }) => {
    if (score >= minPoseConfidence) {
      drawKeypoints(keypoints, minPartConfidence, ctx)
      drawSkeleton(keypoints, minPartConfidence, ctx)
    }
  })
  ctx.draw()
  return poses
}