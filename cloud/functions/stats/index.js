const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { action, limit = 5 } = event;
  const { OPENID } = cloud.getWXContext();

  console.log('=== 云函数开始执行 ===');
  console.log('action:', action);
  console.log('OPENID:', OPENID);

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

  // 测试：直接返回固定数据
  if (action === 'getRecentRecords') {
    console.log('返回测试数据');
    return { 
      success: true, 
      data: [
        { _id: '1', type: 'lottery', typeText: '彩票', net: -10, createTime: new Date() },
        { _id: '2', type: 'scratch', typeText: '刮刮乐', net: 5, createTime: new Date() }
      ],
      message: '测试返回'
    };
  }

  console.log('未知操作:', action);
  return { success: false, message: '未知操作: ' + action };
};
