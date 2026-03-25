// pages/climbGame/climbGame.js
Page({
  data: {
    levels: [],
    currentLevel: 0,
    currentPrize: 0,
    nextPrize: 0,
    scratchCards: [],
    diceResult: '',
    canClimb: false,
    gameOver: false,
    win: false,
    finalPrize: 0
  },

  onLoad() {
    this.newGame();
  },

  newGame() {
    // 生成10个关卡位置（S形路径）
    const levels = [];
    for (let i = 0; i < 10; i++) {
      const row = Math.floor(i / 2);
      const isLeft = i % 2 === 0;
      levels.push({
        x: isLeft ? 20 + row * 8 : 80 - row * 8,
        y: 10 + i * 9,
        prize: this.getPrize(i)
      });
    }

    this.setData({
      levels,
      currentLevel: 0,
      currentPrize: 0,
      nextPrize: levels[1].prize,
      scratchCards: [
        { value: '↑', scratched: false, type: 'up' },
        { value: '↑', scratched: false, type: 'up' },
        { value: '↓', scratched: false, type: 'down' }
      ],
      diceResult: '',
      canClimb: false,
      gameOver: false,
      win: false,
      finalPrize: 0
    });
  },

  getPrize(level) {
    const prizes = [0, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000];
    return prizes[level] || 0;
  },

  scratchCard(e) {
    if (this.data.diceResult) return;

    const index = e.currentTarget.dataset.index;
    const cards = this.data.scratchCards;
    
    // 随机打乱结果
    const results = ['↑', '↑', '↓'];
    for (let i = results.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [results[i], results[j]] = [results[j], results[i]];
    }

    // 显示选中的卡片
    cards[index].value = results[index];
    cards[index].scratched = true;
    cards[index].type = results[index] === '↑' ? 'up' : 'down';

    const isUp = results[index] === '↑';
    
    this.setData({
      scratchCards: cards,
      diceResult: isUp ? '上升!' : '下降!',
      canClimb: true
    });
  },

  climbUp() {
    const { currentLevel, levels, diceResult } = this.data;
    const isUp = diceResult === '上升!';
    
    let newLevel = currentLevel + (isUp ? 1 : -1);
    newLevel = Math.max(0, Math.min(newLevel, levels.length - 1));

    const currentPrize = levels[newLevel].prize;
    const nextPrize = newLevel < levels.length - 1 ? levels[newLevel + 1].prize : 0;

    // 检查是否登顶
    if (newLevel === levels.length - 1) {
      this.setData({
        gameOver: true,
        win: true,
        finalPrize: currentPrize,
        currentLevel: newLevel,
        currentPrize
      });
      return;
    }

    // 重置刮卡区
    this.setData({
      currentLevel: newLevel,
      currentPrize,
      nextPrize,
      scratchCards: [
        { value: '↑', scratched: false, type: 'up' },
        { value: '↑', scratched: false, type: 'up' },
        { value: '↓', scratched: false, type: 'down' }
      ],
      diceResult: '',
      canClimb: false
    });
  },

  cashOut() {
    const { currentPrize } = this.data;
    this.setData({
      gameOver: true,
      win: false,
      finalPrize: currentPrize
    });
  }
});
