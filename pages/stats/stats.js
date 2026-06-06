// pages/stats/stats.js
const api = require('../../utils/api');

Page({
  data: {
    stats: {
      lottery: { net: 0 },
      scratch: { net: 0 },
      mahjong: { net: 0 },
      totalNet: 0
    },
    winColor: '#52c41a',
    loseColor: '#ff4d4f'
  },

  onShow() {
    const app = getApp();
    if (!app.globalData.userId) {
      app.globalData.loginReady.then(() => this.doShow());
      return;
    }
    this.doShow();
  },

  doShow() {
    this.loadSettings();
    wx.showLoading({ title: '加载中...' });
    
    api.getPersonalStats().then(res => {
      wx.hideLoading();
      console.log('stats返回:', res);

      const data = res.data;
      this.setData({
        stats: {
          lottery: { net: data.lotteryNet },
          scratch: { net: data.scratchNet },
          mahjong: { net: data.mahjongNet },
          totalNet: data.totalNet
        }
      });
    }).catch(err => {
      wx.hideLoading();
      console.error('stats错误:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    });
  },

  loadSettings() {
    const settings = wx.getStorageSync('userSettings') || {};
    this.setData({
      winColor: settings.winColor || '#52c41a',
      loseColor: settings.loseColor || '#ff4d4f'
    });
  },

  goRecordList(e) {
    const type = e.currentTarget.dataset.type;
    wx.navigateTo({
      url: `/pages/record-list/record-list?type=${type}`
    });
  }
});
