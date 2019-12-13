const systemInfo = wx.getSystemInfoSync()

export function getFrameSliceOptions(devicePosition, frameWidth, frameHeight, displayWidth, displayHeight) {
  let result = {
    start: [0, 0, 0],
    size: [-1, -1, 3]
  }

  const ratio = displayHeight / displayWidth

  let direction = 'top-down' // bottom-up

  if (systemInfo.platform === 'android' && devicePosition === 'back') {
    direction = 'bottom-up'
  }

  if (direction === 'top-down') {
    if (ratio > frameHeight / frameWidth) {
      result.start = [0, Math.ceil((frameWidth - Math.ceil(frameHeight / ratio)) / 2), 0]
      result.size = [-1, Math.ceil(frameHeight / ratio), 3]
    } else {
      result.start = [Math.ceil((frameHeight - Math.floor(ratio * frameWidth)) / 2), 0, 0]
      result.size = [Math.ceil(ratio * frameWidth), -1, 3]
    }
  } else {
    if (ratio > frameHeight / frameWidth) {
      result.start = [0, Math.ceil((frameWidth - Math.ceil(frameHeight / ratio)) / 2), 0]
      result.size = [-1, Math.ceil(frameHeight / ratio), 3]
    } else {
      result.start = [Math.ceil((frameHeight - Math.floor(ratio * frameWidth)) / 2), 0, 0]
      result.size = [Math.ceil(ratio * frameWidth), -1, 3]
    }
  }

  return result
}