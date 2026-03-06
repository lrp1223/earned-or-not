const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { action, nickname, avatarUrl } = event;
  const { OPENID } = cloud.getWXContext();

  if (action === 'getOpenid') {
    return { success: true, openid: OPENID };
  }

  if (action === 'getProfile') {
    const user = await db.collection('users').where({ _openid: OPENID }).get();
    if (user.data.length > 0) {
      return { success: true, data: user.data[0] };
    }
    return { success: false, message: '用户不存在' };
  }

  if (action === 'setProfile') {
    // 检查用户是否已存在
    const user = await db.collection('users').where({ _openid: OPENID }).get();
    if (user.data.length > 0) {
      // 更新
      await db.collection('users').doc(user.data[0]._id).update({
        data: { nickname, avatarUrl, updateTime: db.serverDate() }
      });
    } else {
      // 创建
      await db.collection('users').add({
        data: {
          _openid: OPENID,
          nickname: nickname || '赚了么用户',
          avatarUrl: avatarUrl || '',
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      });
    }
    return { success: true };
  }

  return { success: false, message: '未知操作' };
};
