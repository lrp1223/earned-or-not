const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { action, limit = 5 } = event;
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

  if (action === 'getRecentRecords') {
    // 从三个集合获取最近记录
    const [lottery, scratch, mahjong] = await Promise.all([
      db.collection('lottery').where({ _openid: OPENID }).orderBy('createTime', 'desc').limit(limit).get(),
      db.collection('scratch').where({ _openid: OPENID }).orderBy('createTime', 'desc').limit(limit).get(),
      db.collection('mahjong').where({ _openid: OPENID }).orderBy('createTime', 'desc').limit(limit).get()
    ]);

    // 合并记录
    let records = [];
    lottery.data.forEach(i => {
      records.push({
        _id: i._id,
        type: 'lottery',
        typeText: '彩票',
        net: (i.winAmount || 0) - (i.cost || 0),
        createTime: i.createTime
      });
    });
    scratch.data.forEach(i => {
      records.push({
        _id: i._id,
        type: 'scratch',
        typeText: '刮刮乐',
        net: (i.winAmount || 0) - (i.cost || 0),
        createTime: i.createTime
      });
    });
    mahjong.data.forEach(i => {
      records.push({
        _id: i._id,
        type: 'mahjong',
        typeText: '麻将',
        net: i.amount || 0,
        createTime: i.createTime
      });
    });

    // 按时间排序
    records.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
    records = records.slice(0, limit);

    return { success: true, data: records };
  }

  return { success: false, message: '未知操作' };
};
