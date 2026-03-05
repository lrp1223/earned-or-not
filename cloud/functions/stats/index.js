const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
exports.main = async (event, context) => {
  const { action } = event;
  const { OPENID } = cloud.getWXContext();
  if (action === 'getPersonalStats') {
    const [lottery, scratch, mahjong] = await Promise.all([
      db.collection('lottery').where({ _openid: OPENID }).get(),
      db.collection('scratch').where({ _openid: OPENID }).get(),
      db.collection('mahjong').where({ _openid: OPENID }).get()
    ]);
    let lc = 0, lw = 0, sc = 0, sw = 0, mn = 0;
    lottery.data.forEach(i => { lc += i.cost || 0; lw += i.winAmount || 0; });
    scratch.data.forEach(i => { sc += i.cost || 0; sw += i.winAmount || 0; });
    mahjong.data.forEach(i => { mn += i.amount || 0; });
    return { success: true, data: { lottery: { net: lw - lc }, scratch: { net: sw - sc }, mahjong: { net: mn }, totalNet: (lw - lc) + (sw - sc) + mn } };
  }
  return { success: false };
};