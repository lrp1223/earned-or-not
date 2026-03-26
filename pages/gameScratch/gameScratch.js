// pages/gameScratch/gameScratch.js
Page({
  data: {
    cards: [],
    selectedCount: 0,
    score: 0,
    result: null,
    gameOver: false,
    playCount: 0,
    winCount: 0
  },

  onLoad() {
    this.newGame();
    this.loadStats();
  },

  loadStats() {
    const today = new Date().toDateString();
    const stats = wx.getStorageSync('gameScratchStats') || {};
    if (stats.date === today) {
      this.setData({
        playCount: stats.playCount || 0,
        winCount: stats.winCount || 0
      });
    }
  },

  saveStats() {
    const today = new Date().toDateString();
    wx.setStorageSync('gameScratchStats', {
      date: today,
      playCount: this.data.playCount,
      winCount: this.data.winCount
    });
  },

  newGame() {
    // 生成9张牌，其中3张高分牌，6张普通牌
    const cards = [];
    
    // 3张高分牌（4-9分）
    for (let i = 0; i < 3; i++) {
      cards.push({
        value: Math.floor(Math.random() * 6) + 4,
        scratched: false,
        animating: false
      });
    }
    
    // 6张普通牌（1-6分）
    for (let i = 0; i < 6; i++) {
      cards.push({
        value: Math.floor(Math.random() * 6) + 1,
        scratched: false,
        animating: false
      });
    }
    
    // 打乱顺序
    cards.sort(() => Math.random() - 0.5);

    this.setData({
      cards,
      selectedCount: 0,
      score: 0,
      result: null,
      gameOver: false
    });
  },

  scratchCard(e) {
    if (this.data.gameOver) return;

    const index = e.currentTarget.dataset.index;
    const cards = this.data.cards;
    
    if (cards[index].scratched) return;

    // 检查是否已选3张
    if (this.data.selectedCount >= 3) {
      wx.showToast({ title: '只能选3张', icon: 'none' });
      return;
    }

    // 动画
    cards[index].animating = true;
    this.setData({ cards });
    
    setTimeout(() => {
      cards[index].scratched = true;
      cards[index].animating = false;
      
      const selectedCount = this.data.selectedCount + 1;
      const score = cards.reduce((sum, c) => sum + (c.scratched ? c.value : 0), 0);
      
      this.setData({ cards, selectedCount, score });

      if (selectedCount >= 3) {
        this.checkResult(score);
      }
    }, 300);
  },

  checkResult(score) {
    const playCount = this.data.playCount + 1;
    let winCount = this.data.winCount;
    let result = {};

    if (score >= 20) {
      winCount++;
      result = {
        icon: '🎉',
        text: '中奖啦！',
        sub: `获得${score}分，太棒了！`,
        retryText: '再玩一次'
      };
    } else if (score >= 17) {
      result = {
        icon: '😤',
        text: '差一点！',
        sub: `${score}分，就差${20 - score}分！再来！`,
        retryText: '不服，再来！'
      };
    } else if (score >= 12) {
      result = {
        icon: '😅',
        text: '还差一点',
        sub: `${score}分，运气差一点点`,
        retryText: '再来试试'
      };
    } else {
      result = {
        icon: '😭',
        text: '运气不佳',
        sub: `${score}分，这也差太远了...`,
        retryText: '再来！'
      };
    }

    this.setData({
      result,
      gameOver: true,
      playCount,
      winCount
    });
    this.saveStats();
  }
});
