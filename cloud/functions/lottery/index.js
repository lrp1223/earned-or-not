const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 确保用户存在
async function ensureUser(OPENID) {
  const user = await db.collection('users').where({ _openid: OPENID }).get();
  if (user.data.length === 0) {
    await db.collection('users').add({
      data: {
        _openid: OPENID,
        nickname: '赚了么用户',
        avatarUrl: '',
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    });
  }
}

exports.main = async (event, context) => {
  const { action, id, cost, winAmount } = event;
  const { OPENID } = cloud.getWXContext();

  if (action === 'add') {
    await ensureUser(OPENID);
    await db.collection('lottery').add({
      data: {
        _openid: OPENID,
        cost: parseFloat(cost) || 0,
        winAmount: parseFloat(winAmount) || 0,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    });
    return { success: true };
  }

  if (action === 'update' && id) {
    const record = await db.collection('lottery').doc(id).get();
    if (record.data._openid !== OPENID) {
      return { success: false, message: '无权修改' };
    }
    await db.collection('lottery').doc(id).update({
      data: {
        cost: parseFloat(cost) || 0,
        winAmount: parseFloat(winAmount) || 0,
        updateTime: db.serverDate()
      }
    });
    return { success: true };
  }

  if (action === 'delete' && id) {
    try {
      const record = await db.collection('lottery').doc(id).get();
      if (record.data._openid !== OPENID) {
        return { success: false, message: '无权删除' };
      }
      await db.collection('lottery').doc(id).remove();
      return { success: true };
    } catch (err) {
      console.error('删除失败:', err);
      return { success: false, message: err.message || '删除失败' };
    }
  }

  return { success: false, message: '未知操作' };
};
