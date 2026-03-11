// pages/rank/rank.js
Page({
  data: { currentTab: 'total', rankList: [] },
  
  onShow() { this.loadRank(this.data.currentTab); },
  
  switchTab(e) { 
    const tab = e.currentTarget.dataset.tab; 
    this.setData({ currentTab: tab }); 
    this.loadRank(tab); 
  },
  
  loadRank(type) {
    const actionMap = {
      'total': 'getTotalRank',
      'lottery': 'getLotteryRank',
      'scratch': 'getScratchRank',
      'mahjong': 'getMahjongRank'
    };

    wx.cloud.callFunction({
      name: 'rank',
      data: { action: actionMap[type] || 'getTotalRank' }
    }).then(res => {
      if (res.result.success) {
        const list = res.result.data.map(item => {
          const net = parseFloat(item.net) || 0;
          return {
            ...item,
            net: net,
            netStr: net.toFixed(2),
            avatarError: false,
            // 使用本地缓存的头像URL
            avatarUrl: this.getCachedAvatar(item.userId, item.avatarUrl)
          };
        });
        this.setData({ rankList: list });
      }
    });
  },

  // 获取缓存的头像URL
  getCachedAvatar(userId, serverUrl) {
    if (!serverUrl) return '';
    
    const cacheKey = `avatar_${userId}`;
    const cached = wx.getStorageSync(cacheKey);
    
    // 如果有缓存且未过期（7天），使用缓存
    if (cached && cached.url && Date.now() - cached.time < 7 * 24 * 60 * 60 * 1000) {
      return cached.url;
    }
    
    // 否则缓存新URL
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
    
    // 标记错误并从缓存中删除
    item.avatarError = true;
    wx.removeStorageSync(`avatar_${item.userId}`);
    
    this.setData({ rankList: list });
  }
});
