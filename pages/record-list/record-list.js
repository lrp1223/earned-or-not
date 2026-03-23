// pages/record-list/record-list.js
const app = getApp();

Page({
  data: {
    type: '',
    typeText: '',
    records: [],
    page: 1,
    pageSize: 10,
    total: 0,
    hasMore: false,
    loading: false,
    winColor: '#52c41a',
    loseColor: '#ff4d4f'
  },

  onLoad(options) {
    const type = options.type || 'lottery';
    const map = { lottery: '彩', scratch: '刮', mahjong: '麻' };
    this.setData({
      type,
      typeText: map[type] || type
    });
    this.loadSettings();
    this.loadRecords();
  },

  loadSettings() {
    const settings = wx.getStorageSync('userSettings') || {};
    this.setData({
      winColor: settings.winColor || '#52c41a',
      loseColor: settings.loseColor || '#ff4d4f'
    });
  },

  loadRecords() {
    if (this.data.loading) return;
    this.setData({ loading: true });
    
    wx.showLoading({ title: '加载中...' });
    
    wx.cloud.callFunction({
      name: 'stats',
      data: {
        action: 'getTypeRecords',
        type: this.data.type,
        page: this.data.page,
        pageSize: this.data.pageSize
      }
    }).then(res => {
      wx.hideLoading();
      this.setData({ loading: false });
      
      if (res.result && res.result.success) {
        const newRecords = res.result.data.map(item => ({
          ...item,
          netStr: item.net.toFixed(2),
          timeStr: this.formatTime(item.createTime)
        }));
        
        this.setData({
          records: this.data.page === 1 ? newRecords : [...this.data.records, ...newRecords],
          total: res.result.pagination.total,
          hasMore: res.result.pagination.hasMore
        });
      }
    }).catch(err => {
      wx.hideLoading();
      this.setData({ loading: false });
      console.error('加载失败:', err);
    });
  },

  loadMore() {
    if (!this.data.hasMore || this.data.loading) return;
    this.setData({ page: this.data.page + 1 });
    this.loadRecords();
  },

  formatTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')}`;
  }
});