// pages/index/index.js
Page({
  data: {
    totalNet: 0,
    totalNetStr: '+0.00',
    recentRecords: [],
    loading: true,
    userProfile: null
  },

  onLoad() {
    // 从数据库获取用户信息
    this.loadUserProfile();
  },

  onShow() {
    this.loadStats();
    this.loadRecords();
  },

  loadUserProfile() {
    wx.cloud.callFunction({
      name: 'user',
      data: { action: 'getProfile' }
    }).then(res => {
      if (res.result && res.result.success && res.result.data) {
        this.setData({ userProfile: res.result.data });
      }
    });
  },

  showSetName() {
    wx.showModal({
      title: '设置昵称',
      editable: true,
      placeholderText: '请输入您的昵称',
      success: (res) => {
        if (res.confirm && res.content) {
          this.setNickname(res.content);
        }
      }
    });
  },

  setNickname(nickname) {
    wx.cloud.callFunction({
      name: 'user',
      data: { action: 'setProfile', nickname }
    }).then(res => {
      if (res.result && res.result.success) {
        this.setData({
          userProfile: { nickname }
        });
        wx.showToast({ title: '设置成功' });
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
  },

  editRecord(e) {
    const { id, type } = e.currentTarget.dataset;
    wx.showActionSheet({
      itemList: ['编辑', '删除'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 编辑
          wx.navigateTo({
            url: `/pages/record/record?type=${type}&id=${id}&mode=edit`
          });
        } else if (res.tapIndex === 1) {
          // 删除
          this.deleteRecord(id, type);
        }
      }
    });
  },

  deleteRecord(id, type) {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，是否继续？',
      success: (res) => {
        if (res.confirm) {
          wx.cloud.callFunction({
            name: type,
            data: { action: 'delete', id }
          }).then(() => {
            wx.showToast({ title: '删除成功' });
            this.loadRecords();
            this.loadStats();
          });
        }
      }
    });
  },

  viewAll() {
    wx.switchTab({ url: '/pages/stats/stats' });
  }
});
