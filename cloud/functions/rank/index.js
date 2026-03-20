const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

// 计算单个用户的盈亏（优化：使用聚合查询）
async function calcUserNet(userId, type) {
  let net = 0;
  
  if (type === 'total' || type === 'lottery') {
    const lotteryRes = await db.collection('lottery').where({ _openid: userId }).get();
    lotteryRes.data.forEach(i => { net += (i.winAmount || 0) - (i.cost || 0); });
  }
  
  if (type === 'total' || type === 'scratch') {
    const scratchRes = await db.collection('scratch').where({ _openid: userId }).get();
    scratchRes.data.forEach(i => { net += (i.winAmount || 0) - (i.cost || 0); });
  }
  
  if (type === 'total' || type === 'mahjong') {
    const mahjongRes = await db.collection('mahjong').where({ _openid: userId }).get();
    mahjongRes.data.forEach(i => { net += i.amount || 0; });
  }
  
  return net;
}

exports.main = async (event, context) => {
  const { action, page = 1, pageSize = 20 } = event;
  const { OPENID } = cloud.getWXContext();
  
  // 映射 action 到类型
  const typeMap = {
    'getLotteryRank': 'lottery',
    'getScratchRank': 'scratch',
    'getMahjongRank': 'mahjong'
  };
  const calcType = typeMap[action] || 'total';

  try {
    // 获取所有用户（限制数量，避免数据量过大）
    const usersRes = await db.collection('users').limit(100).get();
    
    // 并行计算所有用户的盈亏
    const userPromises = usersRes.data.map(async (user) => {
      const userId = user._openid;
      const net = await calcUserNet(userId, calcType);
      
      // 处理头像URL
      let avatarUrl = user.customAvatarUrl || user.avatarUrl || '';
      if (avatarUrl && avatarUrl.startsWith('cloud://')) {
        try {
          const { fileList } = await cloud.getTempFileURL({ fileList: [avatarUrl] });
          avatarUrl = fileList[0].tempFileURL || avatarUrl;
        } catch (e) {
          console.log('转换头像URL失败:', e);
        }
      }
      
      return {
        userId: userId,
        nickname: user.nickname || '匿名用户',
        avatarUrl: avatarUrl,
        net: net,
        isMe: userId === OPENID
      };
    });
    
    let list = await Promise.all(userPromises);
    
    // 按盈亏排序
    list.sort((a, b) => b.net - a.net);
    
    // 分页
    const total = list.length;
    const start = (page - 1) * pageSize;
    const paginatedList = list.slice(start, start + pageSize);
    
    return { 
      success: true, 
      data: paginatedList,
      pagination: {
        page,
        pageSize,
        total,
        hasMore: start + paginatedList.length < total
      }
    };
  } catch (err) {
    console.error('排行计算失败:', err);
    return { success: false, message: err.message };
  }
};
