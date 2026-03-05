// pages/friends/friends.js
Page({
  data: {
    keyword: '',
    searchResult: [],
    friends: []
  },

  onShow() {
    this.loadFriends();
  },

  onInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  search() {
    const { keyword } = this.data;
    if (!keyword.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '搜索中...' });
    wx.cloud.callFunction({
      name: 'friend',
      data: { action: 'search', keyword: keyword.trim() }
    }).then(res => {
      wx.hideLoading();
      if (res.result.success) {
        this.setData({ searchResult: res.result.data });
        if (res.result.data.length === 0) {
          wx.showToast({ title: '未找到用户', icon: 'none' });
        }
      }
    });
  },

  addFriend(e) {
    const friendId = e.currentTarget.dataset.id;
    wx.cloud.callFunction({
      name: 'friend',
      data: { action: 'add', friendId }
    }).then(res => {
      if (res.result.success) {
        wx.showToast({ title: '添加成功' });
        this.setData({ searchResult: [], keyword: '' });
        this.loadFriends();
      } else {
        wx.showToast({ title: res.result.message || '添加失败', icon: 'none' });
      }
    });
  },

  loadFriends() {
    wx.cloud.callFunction({
      name: 'friend',
      data: { action: 'list' }
    }).then(res => {
      if (res.result.success) {
        this.setData({ friends: res.result.data });
      }
    });
  }
});
