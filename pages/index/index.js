// pages/index/index.js
Page({
  data: {
    totalNet: 0,
    totalNetStr: '+0.00',
    recentRecords: [],
    loading: true,
    userInfo: null
  },

  onLoad() {
    // 检查本地缓存
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({ userInfo });
    }
  },

  onShow() {
    this.loadStats();
    this.loadRecords();
  },

  getUserProfile() {
    wx.getUserProfile({
      desc: '用于展示用户头像和昵称',
      success: (res) => {
        const userInfo = res.userInfo;
        this.setData({ userInfo });
        wx.setStorageSync('userInfo', userInfo);
      },
      fail: (err) => {
        console.log('获取用户信息失败', err);
        wx.showToast({ title: '需要授权才能显示头像', icon: 'none' });
      }
    });
  },

  loadStats() {
    wx.cloud.callFunction({
      name: 'stats',
      data: { action: 'getPersonalStats' }
    }).then(res => {
      if (res.result && res.result.success) {
        const totalNet = parseFloat(res.result.data.totalNet) || 0;
        this.setData({
          totalNet: totalNet,
          totalNetStr: (totalNet >= 0 ? '+' : '') + totalNet.toFixed(2),
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
