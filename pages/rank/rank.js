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
            avatarError: false
          };
        });
        this.setData({ rankList: list });
      }
    });
  },

  onAvatarError(e) {
    const index = e.currentTarget.dataset.index;
    const list = this.data.rankList;
    list[index].avatarError = true;
    this.setData({ rankList: list });
  }
});
