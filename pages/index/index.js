// pages/index/index.js
Page({
  data: {
    totalNet: 0,
    recentRecords: [],
    loading: true
  },

  onShow() {
    this.loadStats();
    this.loadRecords();
  },

  loadStats() {
    wx.cloud.callFunction({
      name: 'stats',
      data: { action: 'getPersonalStats' }
    }).then(res => {
      if (res.result && res.result.success) {
        this.setData({
          totalNet: res.result.data.totalNet,
          loading: false
        });
      }
    }).catch(err => {
      console.error('加载统计失败:', err);
      this.setData({ loading: false });
    });
  },

  loadRecords() {
    wx.cloud.callFunction({
      name: 'stats',
      data: { action: 'getRecentRecords', limit: 5 }
    }).then(res => {
      if (res.result && res.result.success) {
        this.setData({ recentRecords: res.result.data });
      }
    }).catch(err => {
      console.error('加载记录失败:', err);
    });
  },

  goRecord(e) {
    wx.navigateTo({
      url: `/pages/record/record?type=${e.currentTarget.dataset.type}`
    });
  }
});
