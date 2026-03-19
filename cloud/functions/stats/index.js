const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

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
    try {
      // 获取各集合数据（按时间倒序）
      const lotteryRes = await db.collection('lottery').where({ _openid: OPENID }).orderBy('createTime', 'desc').limit(10).get();
      const scratchRes = await db.collection('scratch').where({ _openid: OPENID }).orderBy('createTime', 'desc').limit(10).get();
      const mahjongRes = await db.collection('mahjong').where({ _openid: OPENID }).orderBy('createTime', 'desc').limit(10).get();

      // 合并记录
      let records = [];
      lotteryRes.data.forEach(i => {
        records.push({
          _id: i._id,
          type: 'lottery',
          typeText: '彩',
          lotteryType: i.lotteryType || '其他',
          net: (i.winAmount || 0) - (i.cost || 0),
          createTime: i.createTime
        });
      });
      scratchRes.data.forEach(i => {
        records.push({
          _id: i._id,
          type: 'scratch',
          typeText: '刮',
          net: (i.winAmount || 0) - (i.cost || 0),
          createTime: i.createTime
        });
      });
      mahjongRes.data.forEach(i => {
        records.push({
          _id: i._id,
          type: 'mahjong',
          typeText: '麻将',
          net: i.amount || 0,
          createTime: i.createTime
        });
      });

      // 按时间排序
      records.sort((a, b) => {
        if (!a.createTime || !b.createTime) return 0;
        return new Date(b.createTime) - new Date(a.createTime);
      });
      
      records = records.slice(0, limit);
      return { success: true, data: records };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  // 获取分类详细记录（支持分页）
  if (action === 'getTypeRecords') {
    const { type, page = 1, pageSize = 10 } = event;
    const skip = (page - 1) * pageSize;
    
    try {
      let collection;
      if (type === 'lottery') collection = 'lottery';
      else if (type === 'scratch') collection = 'scratch';
      else if (type === 'mahjong') collection = 'mahjong';
      else return { success: false, message: '未知类型' };
      
      const totalRes = await db.collection(collection).where({ _openid: OPENID }).count();
      const recordsRes = await db.collection(collection)
        .where({ _openid: OPENID })
        .orderBy('createTime', 'desc')
        .skip(skip)
        .limit(pageSize)
        .get();
      
      const records = recordsRes.data.map(i => {
        if (type === 'lottery' || type === 'scratch') {
          return {
            _id: i._id,
            type: type,
            typeText: type === 'lottery' ? '彩' : '刮',
            lotteryType: i.lotteryType || '其他',
            cost: i.cost || 0,
            winAmount: i.winAmount || 0,
            net: (i.winAmount || 0) - (i.cost || 0),
            remark: i.remark || '',
            createTime: i.createTime
          };
        } else {
          return {
            _id: i._id,
            type: 'mahjong',
            typeText: '麻将',
            amount: i.amount || 0,
            net: i.amount || 0,
            remark: i.remark || '',
            createTime: i.createTime
          };
        }
      });
      
      return { 
        success: true, 
        data: records,
        pagination: {
          page,
          pageSize,
          total: totalRes.total,
          hasMore: skip + records.length < totalRes.total
        }
      };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  return { success: false, message: '未知操作: ' + action };
};
