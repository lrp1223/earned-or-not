Page({
  data: { keyword: '', friends: [] },
  onShow() { this.loadFriends(); },
  onInput(e) { this.setData({ keyword: e.detail.value }); },
  search() { /* 搜索逻辑 */ },
  loadFriends() {
    wx.cloud.callFunction({ name: 'friend', data: { action: 'list' } })
      .then(res => { if (res.result.success) this.setData({ friends: res.result.data }); });
  }
});