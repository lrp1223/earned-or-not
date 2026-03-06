const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { action, id, cost, winAmount, mahjongType } = event;
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
    await db.collection('lottery').doc(id).remove();
    return { success: true };
  }

  return { success: false, message: '未知操作' };
};
