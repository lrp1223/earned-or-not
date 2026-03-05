const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
exports.main = async (event, context) => {
  const { action } = event;
  const { OPENID } = cloud.getWXContext();
  const friends = await db.collection('friends').where({ _openid: OPENID }).get();
  const ids = [...friends.data.map(f => f.friendId), OPENID];
  let list = [];
  for (const id of ids) {
    const records = await db.collection(action.replace('get', '').replace('Rank', '').toLowerCase()).where({ _openid: id }).get();
    let net = 0;
    records.data.forEach(r => { net += (r.winAmount || r.amount || 0) - (r.cost || 0); });
    const user = await db.collection('users').where({ _openid: id }).get();
    list.push({ userId: id, nickname: user.data[0]?.nickname || '未知', net, isMe: id === OPENID });
  }
  list.sort((a, b) => b.net - a.net);
  return { success: true, data: list };
};