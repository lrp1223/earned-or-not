const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const friends = await db.collection('friends').where({ _openid: OPENID }).get();
  return { success: true, data: friends.data };
};