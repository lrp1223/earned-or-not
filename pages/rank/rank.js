Page({
  data: { currentTab: 'lottery', rankList: [] },
  onShow() { this.loadRank(this.data.currentTab); },
  switchTab(e) { const tab = e.currentTarget.dataset.tab; this.setData({ currentTab: tab }); this.loadRank(tab); },
  loadRank(type) {
    wx.cloud.callFunction({ name: 'rank', data: { action: 'get' + type.charAt(0).toUpperCase() + type.slice(1) + 'Rank' } })
      .then(res => { if (res.result.success) this.setData({ rankList: res.result.data }); });
  }
});