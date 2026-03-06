// pages/index/index.js
Page({
  data: {
    totalNet: 0,
    totalNetStr: '+0.00',
    recentRecords: [],
    loading: true,
    nickname: '赚了么用户',
    avatarUrl: '',
    showActionMenu: false,
    currentRecord: null
  },

  onLoad() {
    this.loadUserProfile();
  },

  onShow() {
    this.loadUserProfile();
    this.loadStats();
    this.loadRecords();
  },

  loadUserProfile() {
    wx.cloud.callFunction({
      name: 'user',
      data: { action: 'getProfile' }
    }).then(res => {
      if (res.result && res.result.success && res.result.data) {
        const nickname = res.result.data.nickname || '赚了么用户';
        const avatarUrl = res.result.data.avatarUrl || '';
        this.setData({ nickname, avatarUrl });
      }
    }).catch(err => {
      console.log('获取用户信息失败', err);
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
  },

  editRecord(e) {
    const { id, type } = e.currentTarget.dataset;
    this.setData({
      showActionMenu: true,
      currentRecord: { id, type }
    });
  },

  hideActionMenu() {
    this.setData({ showActionMenu: false, currentRecord: null });
  },

  onEdit() {
    const { id, type } = this.data.currentRecord;
    this.hideActionMenu();
    wx.navigateTo({
      url: `/pages/record/record?type=${type}&id=${id}&mode=edit`
    });
  },

  onDelete() {
    const { id, type } = this.data.currentRecord;
    this.hideActionMenu();
    this.deleteRecord(id, type);
  },

  deleteRecord(id, type) {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，是否继续？',
      confirmColor: '#ff6b6b',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          wx.cloud.callFunction({
            name: type,
            data: { action: 'delete', id }
          }).then((res) => {
            wx.hideLoading();
            if (res.result && res.result.success) {
              wx.showToast({ title: '删除成功', icon: 'success' });
              // 延迟刷新，让用户看到提示
              setTimeout(() => {
                this.loadRecords();
                this.loadStats();
              }, 500);
            } else {
              wx.showToast({ title: '删除失败', icon: 'none' });
            }
          }).catch(err => {
            wx.hideLoading();
            console.error('删除失败', err);
            wx.showToast({ title: '删除失败', icon: 'none' });
          });
        }
      }
    });
  },

  viewAll() {
    wx.switchTab({ url: '/pages/stats/stats' });
  }
});
