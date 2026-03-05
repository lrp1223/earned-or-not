Page({
  data: { totalNet: 0, recentRecords: [] },
  onShow() { this.loadStats(); this.loadRecords(); },
  loadStats() {
    wx.cloud.callFunction({ name: 'stats', data: { action: 'getPersonalStats' } })
      .then(res => { if(res.result.success) this.setData({ totalNet: res.result.data.totalNet }); });
  },
  loadRecords() {
    wx.cloud.callFunction({ name: 'stats', data: { action: 'getRecentRecords', limit: 5 } })
      .then(res => { if(res.result.success) this.setData({ recentRecords: res.result.data }); });
  },
  goRecord(e) { wx.navigateTo({ url: `/pages/record/record?type=${e.currentTarget.dataset.type}` }); }
});