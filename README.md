# wx-tfjs-demo
微信小程序运行 TensorFlow 的 Demo

# 实现思路
改造 tfjs-core，使 TensorFlow.js 可以运行在小程序中。小程序调用摄像头成像，将图片显示在 `canvas` 上，通过小程序的 API 可以获取到 `canvas` 的「类 ImageData」数据，再调用 tfjs 的 API 实现预测。

对实现的坎坷经历感兴趣的，可以看看博文 [tfjs 移植到微信小程序](https://hunterx.xyz/try-tfjs-on-wx.html) 和 [TensorFlowJS 移植再次尝试](https://hunterx.xyz/retry-tfjs-on-wx.html)。

# Demo
![](https://hunterx.xyz/retry-tfjs-on-wx/demo.gif)

