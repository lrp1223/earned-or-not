// pages/idiomGame/idiomGame.js
const { getRandomIdiom, isValidIdiom, getAIResponse } = require('./idioms.js');

Page({
  data: {
    // 游戏状态
    gameState: 'ready', // ready, playing, over
    
    // 当前成语
    currentIdiom: '',
    
    // 需要接的字
    targetChar: '',
    
    // 玩家输入
    inputValue: '',
    
    // 连击数
    combo: 0,
    
    // 最高分
    highScore: 0,
    
    // 倒计时
    timeLeft: 10,
    timer: null,
    
    // 历史记录
    history: [],
    
    // 称号
    title: '',
    
    // 结果
    result: null
  },

  onLoad() {
    this.loadHighScore();
  },

  onUnload() {
    this.clearTimer();
  },

  // 加载最高分
  loadHighScore() {
    const highScore = wx.getStorageSync('idiomHighScore') || 0;
    this.setData({ highScore });
  },

  // 保存最高分
  saveHighScore(score) {
    if (score > this.data.highScore) {
      wx.setStorageSync('idiomHighScore', score);
      this.setData({ highScore: score });
    }
  },

  // 开始游戏
  startGame() {
    const idiom = getRandomIdiom();
    this.setData({
      gameState: 'playing',
      currentIdiom: idiom,
      targetChar: idiom[idiom.length - 1],
      inputValue: '',
      combo: 0,
      timeLeft: 10,
      history: [idiom],
      title: this.getTitle(0),
      result: null
    });
    this.startTimer();
  },

  // 获取称号
  getTitle(combo) {
    if (combo >= 50) return '成语博士';
    if (combo >= 30) return '成语硕士';
    if (combo >= 20) return '成语学士';
    if (combo >= 10) return '成语高中生';
    if (combo >= 5) return '成语初中生';
    return '成语小学生';
  },

  // 开始倒计时
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

  // 清除定时器
  clearTimer() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.data.timer = null;
    }
  },

  // 输入变化
  onInput(e) {
    this.setData({ inputValue: e.detail.value });
  },

  // 提交答案
  submitAnswer() {
    const input = this.data.inputValue.trim();
    
    if (!input) {
      wx.showToast({ title: '请输入成语', icon: 'none' });
      return;
    }

    if (input.length !== 4) {
      wx.showToast({ title: '请输入4字成语', icon: 'none' });
      return;
    }

    // 检查首字是否匹配
    if (input[0] !== this.data.targetChar) {
      wx.showToast({ 
        title: `必须以"${this.data.targetChar}"开头`, 
        icon: 'none' 
      });
      return;
    }

    // 检查成语是否有效
    if (!isValidIdiom(input)) {
      wx.showToast({ title: '这不是一个常见成语', icon: 'none' });
      return;
    }

    // 检查是否已用过
    if (this.data.history.includes(input)) {
      wx.showToast({ title: '这个成语已经用过了', icon: 'none' });
      return;
    }

    // 成功接龙
    const combo = this.data.combo + 1;
    const history = [...this.data.history, input];
    
    this.setData({
      currentIdiom: input,
      targetChar: input[input.length - 1],
      inputValue: '',
      combo,
      timeLeft: 10,
      history,
      title: this.getTitle(combo)
    });

    // AI接龙
    setTimeout(() => this.aiResponse(), 500);
  },

  // AI回应
  aiResponse() {
    const aiIdiom = getAIResponse(this.data.targetChar);
    
    if (!aiIdiom || this.data.history.includes(aiIdiom)) {
      // AI接不上，玩家获胜
      this.gameOver('win');
      return;
    }

    const history = [...this.data.history, aiIdiom];
    this.setData({
      currentIdiom: aiIdiom,
      targetChar: aiIdiom[aiIdiom.length - 1],
      history,
      timeLeft: 10
    });
  },

  // 游戏结束
  gameOver(reason) {
    this.clearTimer();
    this.saveHighScore(this.data.combo);

    let result = {};
    if (reason === 'win') {
      result = {
        icon: '🎉',
        title: '你赢了！',
        text: `AI接不上来，你赢了${this.data.combo}回合！`,
        btnText: '再来一局'
      };
    } else if (reason === 'timeout') {
      result = {
        icon: '⏰',
        title: '时间到！',
        text: `你接了${this.data.combo}个成语，${this.data.title}`,
        btnText: '再试一次'
      };
    }

    this.setData({
      gameState: 'over',
      result
    });
  },

  // 重新开始
  restart() {
    this.startGame();
  }
});
