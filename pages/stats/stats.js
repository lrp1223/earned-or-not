// pages/stats/stats.js
Page({
  data: {
    stats: {
      lottery: { net: 0 },
      scratch: { net: 0 },
      mahjong: { net: 0 },
      totalNet: 0
    }
  },

  onShow() {
    wx.showLoading({ title: '加载中...' });
    
    wx.cloud.callFunction({
      name: 'stats',
      data: { action: 'getPersonalStats' }
    }).then(res => {
      wx.hideLoading();
      console.log('stats返回:', res.result);
      
      if (res.result && res.result.success) {
        this.setData({
          stats: res.result.data
        });
      } else {
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('stats错误:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    });
  }
});
