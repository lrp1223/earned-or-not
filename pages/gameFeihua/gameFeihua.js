// pages/feihuaGame/feihuaGame.js
const { getRandomKey, isValidPoem, getAIResponse, keys } = require('./poems.js');

Page({
  data: {
    gameState: 'ready',
    currentKey: '',
    inputValue: '',
    combo: 0,
    highScore: 0,
    timeLeft: 30,
    timer: null,
    history: [],
    usedPoems: [],
    title: '',
    result: null
  },

  onLoad() {
    this.loadHighScore();
  },

  onUnload() {
    this.clearTimer();
  },

  loadHighScore() {
    const highScore = wx.getStorageSync('feihuaHighScore') || 0;
    this.setData({ highScore });
  },

  saveHighScore(score) {
    if (score > this.data.highScore) {
      wx.setStorageSync('feihuaHighScore', score);
      this.setData({ highScore: score });
    }
  },

  startGame() {
    const key = getRandomKey();
    this.setData({
      gameState: 'playing',
      currentKey: key,
      inputValue: '',
      combo: 0,
      timeLeft: 30,
      history: [],
      usedPoems: [],
      title: '诗词新手',
      result: null
    });
    this.startTimer();
  },

  getTitle(combo) {
    if (combo >= 20) return '诗词状元';
    if (combo >= 15) return '诗词榜眼';
    if (combo >= 10) return '诗词探花';
    if (combo >= 5) return '诗词举人';
    if (combo >= 3) return '诗词秀才';
    return '诗词新手';
  },

  startTimer() {
    this.clearTimer();
    this.data.timer = setInterval(() => {
      const timeLeft = this.data.timeLeft - 1;
      if (timeLeft <= 0) {
        this.gameOver('timeout');
      } else {
        this.setData({ timeLeft });
      }
    }, 1000);
  },

  clearTimer() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.data.timer = null;
    }
  },

  onInput(e) {
    this.setData({ inputValue: e.detail.value });
  },

  submitAnswer() {
    const input = this.data.inputValue.trim();
    const { currentKey, usedPoems } = this.data;

    if (!input) {
      wx.showToast({ title: '请输入诗句', icon: 'none' });
      return;
    }

    if (!isValidPoem(input, currentKey, usedPoems)) {
      if (usedPoems.includes(input)) {
        wx.showToast({ title: '这句诗已经用过了', icon: 'none' });
      } else if (!input.includes(currentKey)) {
        wx.showToast({ title: `诗句必须包含"${currentKey}"字`, icon: 'none' });
      }
      return;
    }

    // 成功
    const combo = this.data.combo + 1;
    const history = [...this.data.history, { type: 'player', text: input }];
    const newUsedPoems = [...usedPoems, input];

    this.setData({
      inputValue: '',
      combo,
      timeLeft: 30,
      history,
      usedPoems: newUsedPoems,
      title: this.getTitle(combo)
    });

    // AI回应
    setTimeout(() => this.aiResponse(newUsedPoems), 800);
  },

  aiResponse(usedPoems) {
    const { currentKey } = this.data;
    const aiPoem = getAIResponse(currentKey, usedPoems);

    if (!aiPoem) {
      this.gameOver('win');
      return;
    }

    const history = [...this.data.history, { type: 'ai', text: aiPoem }];
    this.setData({
      history,
      usedPoems: [...usedPoems, aiPoem],
      timeLeft: 30
    });
  },

  gameOver(reason) {
    this.clearTimer();
    this.saveHighScore(this.data.combo);

    let result = {};
    if (reason === 'win') {
      result = {
        icon: '🎉',
        title: '你赢了！',
        text: `AI答不上来，你赢了${this.data.combo}回合！`,
        btnText: '再来一局'
      };
    } else {
      result = {
        icon: '⏰',
        title: '时间到！',
        text: `你接了${this.data.combo}句诗，${this.data.title}`,
        btnText: '再试一次'
      };
    }

    this.setData({ gameState: 'over', result });
  },

  restart() {
    this.startGame();
  },

  changeKey() {
    if (this.data.gameState !== 'playing') return;
    const newKey = getRandomKey();
    this.setData({ currentKey: newKey });
    wx.showToast({ title: `换字：${newKey}`, icon: 'none' });
  }
});
