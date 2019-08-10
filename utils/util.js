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
      result.size = [-1, Math.ceil(frameHeight / ratio), 3]
    } else {
      result.size = [Math.ceil(ratio * frameWidth), -1, 3]
    }
  } else {
    if (ratio > frameHeight / frameWidth) {
      result.start = [0, frameWidth - Math.ceil(frameHeight / ratio), 0]
    } else {
      result.start = [frameHeight - Math.floor(ratio * frameWidth), 0, 0]
    }
  }

  return result
}