const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
exports.main = async (event, context) => {
  const { action } = event;
  const { OPENID } = cloud.getWXContext();
  if (action === 'getOpenid') return { success: true, openid: OPENID };
  if (action === 'add') {
    await db.collection('lottery').add({ data: { _openid: OPENID, cost: parseFloat(event.cost) || 0, winAmount: parseFloat(event.winAmount) || 0, createTime: db.serverDate() } });
    return { success: true };
  }
  return { success: false };
};