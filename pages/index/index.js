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
        // 格式化数据
        const records = res.result.data.map(item => {
          const net = parseFloat(item.net) || 0;
          return {
            ...item,
            net: net,
            netStr: (net >= 0 ? '+' : '') + net.toFixed(2),
            timeStr: this.formatTime(item.createTime)
          };
        });
        this.setData({ recentRecords: records });
      }
    }).catch(err => {
      console.error('加载记录失败:', err);
    });
  },

  formatTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  goRecord(e) {
    wx.navigateTo({
      url: `/pages/record/record?type=${e.currentTarget.dataset.type}`
    });
  }
});
