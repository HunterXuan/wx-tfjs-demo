// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const db = cloud.database();
  const _ = db.command;
  const $ = _.aggregate;

  const referrerList = [wxContext.OPENID];

  const referrerAggResult = await db.collection('share_links').aggregate()
    .match({
      openid: wxContext.OPENID
    })
    .limit(5)
    .group({
      _id: '$referrer'
    })
    .end();
  if (referrerAggResult.list.length) {
    referrerAggResult.list.forEach(item => {
      referrerList.push(item._id);
    });
  }

  const rankAggResult = await db.collection('share_links').aggregate()
    .match(_.or([
      {
        referrer: _.in(referrerList)
      },
      {
        openid: wxContext.OPENID
      }
    ]))
    .lookup({
      from: 'phone_rankings',
      localField: 'openid',
      foreignField: '_openid',
      as: 'scoreList',
    })
    .lookup({
      from: 'user_info',
      localField: 'openid',
      foreignField: '_openid',
      as: 'userList',
    })
    .replaceRoot({
      newRoot: {
        openid: '$openid',
        score_record: $.arrayElemAt(['$scoreList', 0]),
        user_info: $.arrayElemAt(['$userList', 0]),
      }
    })
    .group({
      _id: '$openid',
      openid: $.first('$openid'),
      score_record: $.first('$score_record'),
      user_info: $.first('$user_info'),
    })
    .match({
      score_record: _.nin([null])
    })
    .sort({
      'score_record.score': -1
    })
    .limit(15)
    .end();

  return rankAggResult;
}