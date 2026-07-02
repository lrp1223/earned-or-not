// pages/rank/rank.js
const api = require('../../utils/api');

Page({
  data: { 
    currentTab: 'total', 
    rankList: [],
    winColor: '#52c41a',
    loseColor: '#ff4d4f',
    page: 1,
    pageSize: 20,
    hasMore: false,
    loading: false
  },
  
  onShow() {
    getApp().globalData.loginReady.then(() => this.doShow());
  },

  doShow() {
    this.loadSettings();
    if (!api.hasIdentity()) {
      this.setData({ rankList: [], hasMore: false });
      return;
    }
    this.setData({ page: 1, rankList: [] });
    this.loadRank(this.data.currentTab, 1);
  },

  loadSettings() {
    const settings = wx.getStorageSync('userSettings') || {};
    this.setData({
      winColor: settings.winColor || '#52c41a',
      loseColor: settings.loseColor || '#ff4d4f'
    });
  },
  
  switchTab(e) { 
    const tab = e.currentTarget.dataset.tab; 
    this.setData({ currentTab: tab, page: 1, rankList: [] }); 
    this.loadRank(tab, 1); 
  },
  
  loadRank(type, page = 1) {
    if (this.data.loading) return;
    this.setData({ loading: true });

    api.getRank(type, page, this.data.pageSize).then(res => {
      this.setData({ loading: false });
      const list = res.data.list.map(item => {
        const net = parseFloat(item.net) || 0;
        return {
          ...item,
          net: net,
          netStr: net.toFixed(2),
          avatarError: false,
          avatarUrl: this.getCachedAvatar(item.userId, item.avatarUrl)
        };
      });
      
      this.setData({ 
        rankList: page === 1 ? list : [...this.data.rankList, ...list],
        page: page,
        hasMore: res.data.hasMore
      });
    }).catch(() => {
      this.setData({ loading: false });
    });
  },

  loadMore() {
    if (!this.data.hasMore || this.data.loading) return;
    this.loadRank(this.data.currentTab, this.data.page + 1);
  },

  getCachedAvatar(userId, serverUrl) {
    if (!serverUrl) return '';
    
    const cacheKey = `avatar_${userId}`;
    const cached = wx.getStorageSync(cacheKey);
    
    if (cached && cached.url && Date.now() - cached.time < 7 * 24 * 60 * 60 * 1000) {
      return cached.url;
    }
    
    wx.setStorageSync(cacheKey, {
      url: serverUrl,
      time: Date.now()
    });
    
    return serverUrl;
  },

  onAvatarError(e) {
    const index = e.currentTarget.dataset.index;
    const list = this.data.rankList;
    const item = list[index];
    
    item.avatarError = true;
    wx.removeStorageSync(`avatar_${item.userId}`);
    
    this.setData({ rankList: list });
  },

  onShareAppMessage() {
    const tabNames = { total: '总排行', lottery: '彩排行', scratch: '刮排行', mahjong: '麻排行' };
    return {
      title: `来看看${tabNames[this.data.currentTab]}，你排第几？`,
      path: '/pages/rank/rank',
      imageUrl: '/images/logo.png'
    };
  },

  onShareTimeline() {
    return {
      title: '赚了么排行榜 - 看看谁是大赢家',
      query: '',
      imageUrl: '/images/logo.png'
    };
  }
});
