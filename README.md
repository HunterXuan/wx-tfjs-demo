# wx-tfjs-demo
微信小程序运行 TensorFlow 的 Demo，代码与小程序「AI Pocket」同步更新。

# 实现思路

## 早期实现方式

改造 tfjs-core，使 TensorFlow.js 可以运行在小程序中。小程序调用摄像头成像，将图片显示在 `canvas` 上，通过小程序的 API 可以获取到 `canvas` 的「类 ImageData」数据，再调用 tfjs 的 API 实现预测。

对实现的坎坷经历感兴趣的，可以看看博文 [tfjs 移植到微信小程序](https://hunterx.xyz/try-tfjs-on-wx.html) 和 [TensorFlowJS 移植再次尝试](https://hunterx.xyz/retry-tfjs-on-wx.html)。

## 目前实现方式

由于 tfjs 已经优雅地实现对多平台的支持，具体表现为可以扩展 `platform` 实现「移植」，而且微信小程序也开放了更多有利的 API，目前不再采用侵入式地魔改 tfjs 的方式，而是借助 tfjs 的微信插件来提供模型的加载、训练、预测等功能。

尽管相比以前方便多了，但是由于小程序的 `onCameraFrame` 获取到的帧数据与所展示的不一致，而且是在不同的设备上（甚至相同设备的前后摄像头）对原始帧数据的处理方式都不一样，要想得到准确的预测结果，真叫人头大。

目前，我已经摸索出一套帧数据裁切方式，而且简单测试了下，效果不错。如果有照顾不到的机型，欢迎提 Issues & PR。

# 小程序 Demo
小程序改名「AI Pocket」了，感觉还是挺有意义的，所以我打算认真做好这个小程序了。附上小程序二维码，欢迎大家体验 & 提出改进意见！

![AIPocket](https://i.endpot.com/image/CIDDI/AIPocket.jpg)

# 合作与交流

## 合作

本人在前后端开发、Docker & Swarm、持续部署、人工智能 NLP 领域都有所积累，能够快速提供成套的解决方案，如果有机会，欢迎通过各种联系方式咨询合作事宜。

另外，本项目代码开源，欢迎各位感兴趣的同学一起添砖加瓦。当然，也不限制商用，但是请尊重他人的劳动成果，不要做一些「不厚道」的事。如果本项目对你有帮助，欢迎随意打赏。

![打赏](https://i.endpot.com/image/DGB9R/reward.jpg)

## 交流

可以关注下我的 [个人博客](https://hunterx.xyz)，或者个人微信公众号「猎人杂货铺」，会经常有一些技术分享 & 生活感悟，欢迎多多交流！

**关注公众号，留言获取「AI Pocket 交流群」的二维码，方便交流！~**

![猎人杂货铺 • 微信公众号](https://i.endpot.com/image/V4NUH/%E6%89%AB%E7%A0%81-%E7%8C%8E%E4%BA%BA%E6%9D%82%E8%B4%A7%E9%93%BA.png)

