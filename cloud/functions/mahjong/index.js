const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { action, id, cost, mahjongType } = event;
  const { OPENID } = cloud.getWXContext();

  if (action === 'add') {
    const amount = (parseFloat(cost) || 0) * (mahjongType === 'win' ? 1 : -1);
    await db.collection('mahjong').add({
      data: {
        _openid: OPENID,
        amount,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    });
    return { success: true };
  }

  if (action === 'update' && id) {
    const record = await db.collection('mahjong').doc(id).get();
    if (record.data._openid !== OPENID) {
      return { success: false, message: '无权修改' };
    }
    const amount = (parseFloat(cost) || 0) * (mahjongType === 'win' ? 1 : -1);
    await db.collection('mahjong').doc(id).update({
      data: {
        amount,
        updateTime: db.serverDate()
      }
    });
    return { success: true };
  }

  if (action === 'delete' && id) {
    try {
      const record = await db.collection('mahjong').doc(id).get();
      if (record.data._openid !== OPENID) {
        return { success: false, message: '无权删除' };
      }
      await db.collection('mahjong').doc(id).remove();
      return { success: true };
    } catch (err) {
      console.error('删除失败:', err);
      return { success: false, message: err.message || '删除失败' };
    }
  }

  return { success: false, message: '未知操作' };
};
