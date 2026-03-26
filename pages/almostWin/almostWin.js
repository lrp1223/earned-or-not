// pages/almostWin/almostWin.js
Page({
  data: {
    cards: [
      { value: 0, scratched: false, animating: false },
      { value: 0, scratched: false, animating: false },
      { value: 0, scratched: false, animating: false }
    ],
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
    const stats = wx.getStorageSync('almostWinStats') || {};
    if (stats.date === today) {
      this.setData({
        playCount: stats.playCount || 0,
        winCount: stats.winCount || 0
      });
    }
  },

  saveStats() {
    const today = new Date().toDateString();
    wx.setStorageSync('almostWinStats', {
      date: today,
      playCount: this.data.playCount,
      winCount: this.data.winCount
    });
  },

  newGame() {
    // 生成3个1-9的随机数，控制分布让"差一点"更常见
    const cards = [];
    const target = 20;
    
    // 70%概率生成"差一点"的组合（15-19分）
    const isClose = Math.random() < 0.7;
    
    if (isClose) {
      // 生成15-19分的组合
      const a = Math.floor(Math.random() * 6) + 4; // 4-9
      const b = Math.floor(Math.random() * 6) + 4; // 4-9
      const sum = a + b;
      const c = Math.min(9, Math.max(1, target - sum + Math.floor(Math.random() * 3) - 1));
      cards.push(a, b, c);
    } else {
      // 完全随机
      for (let i = 0; i < 3; i++) {
        cards.push(Math.floor(Math.random() * 9) + 1);
      }
    }

    // 打乱顺序
    cards.sort(() => Math.random() - 0.5);

    this.setData({
      cards: cards.map(v => ({ value: v, scratched: false, animating: false })),
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

    // 动画
    cards[index].animating = true;
    this.setData({ cards });
    
    setTimeout(() => {
      cards[index].scratched = true;
      cards[index].animating = false;
      
      const score = cards.reduce((sum, c) => sum + (c.scratched ? c.value : 0), 0);
      const allScratched = cards.every(c => c.scratched);
      
      this.setData({ cards, score });

      if (allScratched) {
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
