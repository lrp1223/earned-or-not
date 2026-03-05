const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  await db.collection('scratch').add({ data: { _openid: OPENID, cost: parseFloat(event.cost) || 0, winAmount: parseFloat(event.winAmount) || 0, createTime: db.serverDate() } });
  return { success: true };
};