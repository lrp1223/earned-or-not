const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { action, id, cost, winAmount } = event;
  const { OPENID } = cloud.getWXContext();

  if (action === 'add') {
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
    // 先检查权限
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
      // 先检查权限
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
