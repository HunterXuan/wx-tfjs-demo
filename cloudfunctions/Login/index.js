// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();

  await addShareLink(wxContext.OPENID, event.referrer || '');

  return {
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
    shareInfo: event.cloudIdFromShareInfo
  };
}

const addShareLink = async (openid, referrer) => {
  if (referrer) {
    const db = cloud.database();
    await db.collection('share_links').add({
      data: {
        openid,
        referrer,
      }
    });
  }
};