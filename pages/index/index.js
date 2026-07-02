// pages/index/index.js
const api = require('../../utils/api');

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
    getApp().globalData.loginReady.then(() => {
      if (api.hasIdentity()) {
        this.loadUserProfile();
      } else {
        this.setData({ loading: false });
      }
    });
  },

  onShow() {
    getApp().globalData.loginReady.then(() => this.doShow());
  },

  doShow() {
    this.loadSettings();
    if (api.hasIdentity()) {
      this.loadUserProfile();
      this.loadStats();
      this.loadRecords();
    } else {
      this.setData({ loading: false });
    }
  },

  loadSettings() {
    const settings = wx.getStorageSync('userSettings') || {};
    this.setData({
      winColor: settings.winColor || '#52c41a',
      loseColor: settings.loseColor || '#ff4d4f'
    });
  },

  loadUserProfile() {
    api.getProfile().then(res => {
      if (res.data) {
        const nickname = res.data.nickname || '赚了么用户';
        const cached = wx.getStorageSync('avatarCache') || '';
        const avatar = res.data.avatarBase64 || cached || res.data.avatarUrl || '';
        if (res.data.avatarBase64) {
          wx.setStorageSync('avatarCache', res.data.avatarBase64);
        }
        this.setData({ nickname, avatarUrl: avatar });
      }
    }).catch(err => {
      console.log('获取用户信息失败', err);
    });
  },

  loadStats() {
    api.getPersonalStats().then(res => {
      const totalNet = parseFloat(res.data.totalNet) || 0;
      this.setData({
        totalNet: totalNet,
        totalNetStr: (totalNet >= 0 ? '+' : '') + totalNet.toFixed(2),
        loading: false
      });
    }).catch(err => {
      console.error('加载统计失败:', err);
      this.setData({ loading: false });
    });
  },

  loadRecords() {
    api.getRecentRecords(5).then(res => {
      console.log('首页加载记录:', res);
      const records = res.data.map(item => {
        const net = parseFloat(item.net) || 0;
        return {
          ...item,
          type: (item.recordType || '').toLowerCase(),
          net: net,
          netStr: (net >= 0 ? '+' : '') + net.toFixed(2),
          timeStr: this.formatTime(item.createTime)
        };
      });
      this.setData({ recentRecords: records });
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
      currentRecord: { id, type: (type || '').toLowerCase() }
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
    this.deleteRecord(id);
  },

  deleteRecord(id) {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，是否继续？',
      confirmColor: '#ff6b6b',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          api.deleteRecord(id).then(() => {
            wx.hideLoading();
            wx.showToast({ title: '删除成功', icon: 'success' });
            setTimeout(() => {
              this.loadRecords();
              this.loadStats();
            }, 500);
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
  },

  goFortune() {
    wx.navigateTo({ url: '/pages/fortune/fortune' });
  },

  onShareAppMessage() {
    return {
      title: `我在赚了么记录了${this.data.totalNet >= 0 ? '赚' : '亏'}了${Math.abs(this.data.totalNet).toFixed(2)}元，快来一起记账吧！`,
      path: '/pages/index/index',
      imageUrl: '/images/logo.png'
    };
  },

  onShareTimeline() {
    return {
      title: '赚了么 - 记录你的彩、刮、麻盈亏',
      query: '',
      imageUrl: '/images/logo.png'
    };
  }
});
