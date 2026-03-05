const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const amount = (parseFloat(event.cost) || 0) * (event.mahjongType === 'win' ? 1 : -1);
  await db.collection('mahjong').add({ data: { _openid: OPENID, amount, createTime: db.serverDate() } });
  return { success: true };
};