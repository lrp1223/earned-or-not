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
    await db.collection('mahjong').doc(id).remove();
    return { success: true };
  }

  return { success: false, message: '未知操作' };
};
