const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { action } = event;
  const { OPENID } = cloud.getWXContext();

  // 获取所有用户
  const users = await db.collection('users').get();
  
  let list = [];
  
  for (const user of users.data) {
    const userId = user._openid;
    const nickname = user.nickname || '匿名用户';
    
    // 获取该用户的所有记录
    const [lottery, scratch, mahjong] = await Promise.all([
      db.collection('lottery').where({ _openid: userId }).get(),
      db.collection('scratch').where({ _openid: userId }).get(),
      db.collection('mahjong').where({ _openid: userId }).get()
    ]);
    
    // 计算各类盈亏
    let lotteryNet = 0, scratchNet = 0, mahjongNet = 0, totalNet = 0;
    
    lottery.data.forEach(i => { lotteryNet += (i.winAmount || 0) - (i.cost || 0); });
    scratch.data.forEach(i => { scratchNet += (i.winAmount || 0) - (i.cost || 0); });
    mahjong.data.forEach(i => { mahjongNet += i.amount || 0; });
    
    totalNet = lotteryNet + scratchNet + mahjongNet;
    
    // 根据 action 返回对应类型的盈亏
    let net = 0;
    if (action === 'getLotteryRank') net = lotteryNet;
    else if (action === 'getScratchRank') net = scratchNet;
    else if (action === 'getMahjongRank') net = mahjongNet;
    else net = totalNet; // 默认总排行
    
    list.push({
      userId: userId,
      nickname: nickname,
      net: net,
      isMe: userId === OPENID
    });
  }
  
  // 按盈亏排序
  list.sort((a, b) => b.net - a.net);
  
  return { success: true, data: list };
};
