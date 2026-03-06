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
        // 格式化数据
        const list = res.result.data.map(item => {
          const net = parseFloat(item.net) || 0;
          return {
            ...item,
            net: net,
            netStr: net.toFixed(2)
          };
        });
        this.setData({ rankList: list });
      }
    });
  }
});
