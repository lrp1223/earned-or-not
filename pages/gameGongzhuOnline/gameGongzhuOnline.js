// pages/gameGongzhuOnline/gameGongzhuOnline.js
// 拱猪在线对战 - REST API 版本

const SUITS = ['C', 'D', 'S', 'H'];
const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const SUIT_MAP = { 'S': '♠', 'H': '♥', 'C': '♣', 'D': '♦' };
const SCORE_CARDS = {
  'SQ': -100, 'DJ': 100,
  'HA': -50, 'HK': -40, 'HQ': -30, 'HJ': -20,
  'H10': -10, 'H9': -10, 'H8': -10, 'H7': -10, 'H6': -10, 'H5': -10
};

Page({
  data: {
    pageState: 'home',   // home | lobby | playing | result
    roomCode: '',
    isHost: false,
    myIndex: 0,
    playerCount: 0,
    players: [{ isEmpty: true }, { isEmpty: true }, { isEmpty: true }, { isEmpty: true }],

    currentRound: 1,
    currentPlayer: -1,
    countdown: 0,
    tableCards: [],
    playerHand: [],
    rawScores: [0, 0, 0, 0],
    displayScores: [0, 0, 0, 0],
    selectedCard: null,
    leadSuit: null,
    suitMap: SUIT_MAP,
    pollTimer: null,
    countdownTimer: null,

    showJoinInput: false,
    inputRoomId: ''
  },

  onLoad() {
    this.userInfo = wx.getStorageSync('userInfo') || { nickName: '玩家', avatarUrl: '' };
  },

  onUnload() {
    this.stopPolling();
    this.clearCountdown();
  },

  // ==================== Home ====================

  async createRoom() {
    wx.showLoading({ title: '创建中...' });
    this.request('POST', '/api/game/rooms', {
      nickname: this.userInfo.nickName,
      avatar: this.userInfo.avatarUrl || ''
    }).then(res => {
      wx.hideLoading();
      const d = res.data;
      this.setData({
        roomCode: d.roomCode, isHost: true, myIndex: d.myIndex,
        pageState: 'lobby', playerCount: d.playerCount,
        players: this.formatPlayers(d.players)
      });
      this.startPolling(d.roomCode);
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '创建失败', icon: 'none' });
    });
  },

  async joinRoom() {
    var code = this.data.inputRoomId;
    if (!code || code.length !== 6) {
      wx.showToast({ title: '请输入6位房间号', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '加入中...' });
    this.request('POST', '/api/game/rooms/' + code + '/join', {
      nickname: this.userInfo.nickName,
      avatar: this.userInfo.avatarUrl || ''
    }).then(res => {
      wx.hideLoading();
      var d = res.data;
      this.setData({
        roomCode: code, isHost: false, myIndex: d.myIndex,
        pageState: 'lobby', playerCount: d.playerCount,
        players: this.formatPlayers(d.players)
      });
      this.startPolling(code);
    }).catch(err => {
      wx.hideLoading();
      var msg = (err && err.message) || '加入失败';
      wx.showToast({ title: msg, icon: 'none' });
    });
  },

  showJoinModal() { this.setData({ showJoinInput: true, inputRoomId: '' }); },
  hideJoinModal() { this.setData({ showJoinInput: false }); },
  onRoomIdInput(e) { this.setData({ inputRoomId: e.detail.value }); },

  // ==================== Lobby ====================

  addAI() {
    if (this.data.playerCount >= 4) return;
    this.request('POST', '/api/game/rooms/' + this.data.roomCode + '/add-ai').then(res => {
      var d = res.data;
      this.setData({ playerCount: d.playerCount, players: this.formatPlayers(d.players) });
    });
  },

  startGame() {
    if (this.data.playerCount < 2) {
      wx.showToast({ title: '至少需要2人', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '发牌中...' });
    this.request('POST', '/api/game/rooms/' + this.data.roomCode + '/start').then(res => {
      wx.hideLoading();
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '开始失败', icon: 'none' });
    });
  },

  addAIAuto() {
    if (this.data.playerCount < 4) {
      this.addAI();
      setTimeout(() => this.addAIAuto(), 500);
    }
  },

  // ==================== Playing ====================

  selectCard(e) {
    if (this.data.currentPlayer !== this.data.myIndex) return;
    var index = e.currentTarget.dataset.index;
    var card = this.data.playerHand[index];
    var lead = this.data.leadSuit;
    var table = this.data.tableCards;
    if (table.length > 0 && card.suit !== lead) {
      var hasSuit = this.data.playerHand.some(function(c) { return c.suit === lead; });
      if (hasSuit) {
        wx.showToast({ title: '请跟花色', icon: 'none' });
        return;
      }
    }
    if (this.data.currentRound === 1 && table.length === 0 && card.id !== 'SJ') {
      wx.showToast({ title: '第一轮必须先出♠J', icon: 'none' });
      return;
    }
    this.setData({ selectedCard: index });
  },

  confirmPlay() {
    if (this.data.selectedCard === null) return;
    var card = this.data.playerHand[this.data.selectedCard];
    this.clearCountdown();
    this.request('POST', '/api/game/rooms/' + this.data.roomCode + '/play', {
      card: { suit: card.suit, rank: card.rank }
    }).then(res => {
      this.setData({ selectedCard: null });
    }).catch(err => {
      wx.showToast({ title: '出牌失败', icon: 'none' });
    });
  },

  // ==================== Polling ====================

  startPolling(roomCode) {
    this.stopPolling();
    this.pollTimer = setInterval(() => {
      this.request('GET', '/api/game/rooms/' + roomCode).then(res => {
        var d = res.data;
        if (d.status === 'WAITING') {
          if (this.data.pageState !== 'lobby') {
            this.setData({ pageState: 'lobby' });
          }
          this.setData({
            playerCount: d.playerCount,
            players: this.formatPlayers(d.players)
          });
        } else if (d.status === 'PLAYING' || d.status === 'FINISHED') {
          this.syncGameState(d.gameData, d.status);
        }
      });
    }, 2000);
  },

  stopPolling() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = null;
  },

  syncGameState(gameData, status) {
    if (!gameData) return;

    if (status === 'FINISHED') {
      this.setData({ pageState: 'result' });
      // Calculate rankings
      var totalScores = gameData.totalScores || [0,0,0,0];
      var finalScores = gameData.finalScores || [0,0,0,0];
      var sorted = [0,1,2,3].map(function(i) {
        return { idx: i, thisGame: finalScores[i], total: totalScores[i] };
      }).sort(function(a, b) { return b.total - a.total; });

      var sortedRank = [];
      for (var i = 0; i < sorted.length; i++) {
        var rank = i + 1;
        if (i > 0 && sorted[i].total === sorted[i-1].total) {
          rank = sortedRank[i-1].rank;
        }
        sortedRank.push({
          idx: sorted[i].idx, thisGame: sorted[i].thisGame,
          total: sorted[i].total, rank: rank, isLast: i === 3
        });
      }

      this.setData({
        sortedRank: sortedRank,
        finalScores: finalScores,
        totalScores: totalScores,
        rawScores: gameData.rawScores || [0,0,0,0]
      });
      return;
    }

    // PLAYING
    var myHand = (gameData.hands && gameData.hands[this.data.myIndex]) || [];
    myHand.sort(function(a, b) {
      return cardSortValue(a) - cardSortValue(b);
    });

    this.setData({
      pageState: 'playing',
      currentRound: gameData.currentRound || 1,
      currentPlayer: gameData.currentPlayer != null ? gameData.currentPlayer : -1,
      playerHand: myHand,
      tableCards: gameData.tableCards || [],
      rawScores: gameData.rawScores || [0,0,0,0],
      displayScores: gameData.rawScores || [0,0,0,0],
      leadSuit: gameData.leadSuit || null,
      collectedScoreCards: gameData.collectedScoreCards || [[],[],[],[]],
      pigPlayer: gameData.pigPlayer != null ? gameData.pigPlayer : -1,
      sheepPlayer: gameData.sheepPlayer != null ? gameData.sheepPlayer : -1
    });

    // Countdown for my turn
    if (gameData.currentPlayer === this.data.myIndex) {
      this.startCountdown();
    } else {
      this.clearCountdown();
    }
  },

  // ==================== Countdown ====================

  startCountdown() {
    this.clearCountdown();
    this.setData({ countdown: 30 });
    var that = this;
    this.countdownTimer = setInterval(function() {
      var n = that.data.countdown - 1;
      that.setData({ countdown: n });
      if (n <= 0) {
        that.clearCountdown();
        that.autoPlay();
      }
    }, 1000);
  },

  clearCountdown() {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.setData({ countdown: 0 });
  },

  autoPlay() {
    var hand = this.data.playerHand;
    var lead = this.data.leadSuit;
    var table = this.data.tableCards;
    var valid = hand.filter(function(c) {
      if (table.length === 0) return true;
      if (c.suit === lead) return true;
      return !hand.some(function(h) { return h.suit === lead; });
    });
    if (valid.length > 0) {
      var card = valid[0];
      var idx = hand.findIndex(function(c) { return c.id === card.id; });
      this.setData({ selectedCard: idx });
      this.confirmPlay();
    }
  },

  // ==================== Result ====================

  getPlayerPosition(playerIndex) {
    var rel = (playerIndex - this.data.myIndex + 4) % 4;
    return ['pos-bottom', 'pos-right', 'pos-top', 'pos-left'][rel];
  },

  playAgain() {
    this.startGame();
  },

  exitGame() {
    this.request('POST', '/api/game/rooms/' + this.data.roomCode + '/leave').finally(() => {
      this.stopPolling();
      wx.navigateBack();
    });
  },

  // ==================== Helpers ====================

  formatPlayers(players) {
    var result = [null, null, null, null];
    (players || []).forEach(function(p) {
      if (p && p.seat != null) result[p.seat] = p;
    });
    for (var i = 0; i < 4; i++) {
      result[i] = result[i] || { isEmpty: true };
    }
    return result;
  },

  request(method, path, data) {
    var shareKey = wx.getStorageSync('shareKey') || '';
    return new Promise(function(resolve, reject) {
      wx.request({
        url: 'https://earned.menghanyu.cn' + path,
        method: method,
        header: {
          'Content-Type': 'application/json',
          'X-Share-Key': shareKey
        },
        data: data,
        success: function(res) {
          if (res.statusCode === 200 && res.data && res.data.success) {
            resolve(res.data);
          } else {
            reject(res.data || { message: '请求失败' });
          }
        },
        fail: reject
      });
    });
  }
});

// Global helpers (outside Page, used in sort callback)
function cardSortValue(card) {
  var sO = { 'S': 0, 'C': 1, 'D': 2, 'H': 3 };
  var rO = { 'A': 12, 'K': 11, 'Q': 10, 'J': 9, '10': 8, '9': 7, '8': 6, '7': 5, '6': 4, '5': 3, '4': 2, '3': 1, '2': 0 };
  return sO[card.suit] * 13 + rO[card.rank];
}
