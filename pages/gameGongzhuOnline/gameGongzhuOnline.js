// pages/gameGongzhuOnline/gameGongzhuOnline.js
const app = getApp();
const db = wx.cloud.database();

const SUITS = ['C', 'D', 'S', 'H'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUIT_MAP = { 'S': '♠', 'H': '♥', 'C': '♣', 'D': '♦' };
const SCORE_CARDS = {
  'SQ': -100, 'DJ': 100,
  'HA': -50, 'HK': -40, 'HQ': -30, 'HJ': -20,
  'H10': -10, 'H9': -10, 'H8': -10, 'H7': -10, 'H6': -10, 'H5': -10
};

Page({
  data: {
    pageState: 'home', // home | lobby | playing | result
    roomId: '',
    isHost: false,
    myIndex: 0,
    playerCount: 0,
    players: [{ isEmpty: true }, { isEmpty: true }, { isEmpty: true }, { isEmpty: true }],
    
    currentRound: 1,
    currentPlayer: 0,
    countdown: 0,
    tableCards: [],
    playerHand: [],
    allHands: [[], [], [], []],
    rawScores: [0, 0, 0, 0],
    displayScores: [0, 0, 0, 0],
    collectedScoreCards: [[], [], [], []],
    selectedCard: null,
    leadSuit: null,
    suitMap: SUIT_MAP,
    roomWatcher: null,
    countdownTimer: null
  },

  onLoad() {
    this.userInfo = wx.getStorageSync('userInfo') || { nickName: '玩家', avatarUrl: '' };
  },

  onUnload() { this.stopWatching(); this.clearCountdown(); },

  generateRoomId() { return Math.floor(100000 + Math.random() * 900000).toString(); },

  async createRoom() {
    const roomId = this.generateRoomId();
    const hostId = app.globalData.openid || 'host_' + Date.now();
    try {
      wx.showLoading({ title: '创建中...' });
      const res = await wx.cloud.callFunction({
        name: 'gongzhu',
        data: {
          action: 'createRoom',
          data: { roomId, hostId, nickname: this.userInfo.nickName, avatar: this.userInfo.avatarUrl || '/images/avatar.png' }
        }
      });
      wx.hideLoading();
      if (res.result.success) {
        this.setData({ roomId, isHost: true, myIndex: 0, pageState: 'lobby', playerCount: 1, players: this.formatPlayers([{ id: hostId, nickname: this.userInfo.nickName, avatar: this.userInfo.avatarUrl || '/images/avatar.png', isHost: true, isAI: false }]) });
        this.startWatching(roomId);
      }
    } catch (err) { wx.hideLoading(); }
  },

  async joinRoom() {
    if (this.data.inputRoomId.length !== 6) return;
    const roomId = this.data.inputRoomId;
    const playerId = app.globalData.openid || 'player_' + Date.now();
    try {
      wx.showLoading({ title: '加入中...' });
      const res = await wx.cloud.callFunction({
        name: 'gongzhu',
        data: { action: 'joinRoom', data: { roomId, playerId, nickname: this.userInfo.nickName, avatar: this.userInfo.avatarUrl || '/images/avatar.png' } }
      });
      wx.hideLoading();
      if (res.result.success) {
        this.setData({ roomId, isHost: false, myIndex: res.result.playerIndex, pageState: 'lobby' });
        this.startWatching(roomId);
      }
    } catch (err) { wx.hideLoading(); }
  },

  async addAI() {
    if (this.data.playerCount >= 4) return;
    const aiId = 'ai_' + Date.now();
    const nickname = '机器人' + (this.data.playerCount);
    try {
      await wx.cloud.callFunction({
        name: 'gongzhu',
        data: { action: 'addAI', data: { roomId: this.data.roomId, aiId, nickname, avatar: '/images/avatar2.png' } }
      });
    } catch (err) {}
  },

  async startGame() {
    if (this.data.playerCount < 4) return;
    try {
      wx.showLoading({ title: '开始游戏...' });
      const deck = this.createDeck();
      const hands = [[], [], [], []];
      for (let i = 0; i < 52; i++) hands[i % 4].push(deck[i]);
      const teams = this.determineTeamsInitial(hands);
      let firstPlayer = 0;
      for (let i = 0; i < 4; i++) { if (hands[i].some(c => c.id === 'SJ')) firstPlayer = i; }

      const gameData = {
        currentRound: 1,
        currentPlayer: firstPlayer,
        hands: hands,
        tableCards: [],
        leadSuit: null,
        rawScores: [0, 0, 0, 0],
        collectedScoreCards: [[], [], [], []],
        teams: teams,
        status: 'playing'
      };

      await wx.cloud.callFunction({
        name: 'gongzhu',
        data: { action: 'startGame', data: { roomId: this.data.roomId, gameData } }
      });
      wx.hideLoading();
    } catch (err) { wx.hideLoading(); }
  },

  createDeck() {
    const deck = [];
    for (const suit of SUITS) { for (const rank of RANKS) { deck.push({ suit, rank, id: `${suit}${rank}` }); } }
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  },

  determineTeamsInitial(hands) {
    let pO = -1, sO = -1;
    for (let i = 0; i < 4; i++) {
      if (hands[i].some(c => c.id === 'SQ')) pO = i;
      if (hands[i].some(c => c.id === 'DJ')) sO = i;
    }
    const teams = {};
    if (pO === sO) {
      teams[pO] = (pO + 2) % 4; teams[(pO + 2) % 4] = pO;
      const o1 = (pO + 1) % 4, o2 = (pO + 3) % 4; teams[o1] = o2; teams[o2] = o1;
    } else {
      teams[pO] = sO; teams[sO] = pO;
      const others = [0,1,2,3].filter(i => i !== pO && i !== sO);
      teams[others[0]] = others[1]; teams[others[1]] = others[0];
    }
    return teams;
  },

  formatPlayers(players) {
    const result = [];
    for (let i = 0; i < 4; i++) {
      if (players[i]) result.push({ ...players[i], isEmpty: false });
      else result.push({ isEmpty: true });
    }
    return result;
  },

  startWatching(roomId) {
    this.roomWatcher = db.collection('gongzhu_rooms').doc(roomId).watch({
      onChange: (snapshot) => {
        const room = snapshot.docs[0];
        if (!room) return;
        if (room.status === 'playing' || room.status === 'finished') {
          if (room.gameData) this.syncGameState(room.gameData, room.status);
        } else {
          this.setData({ playerCount: room.players.length, players: this.formatPlayers(room.players), pageState: 'lobby' });
        }
      },
      onError: (err) => console.error(err)
    });
  },

  stopWatching() { if (this.roomWatcher) this.roomWatcher.close(); },

  syncGameState(gameData, status) {
    if (status === 'finished') {
      const sortedRank = this.calculateRank(gameData.rawScores);
      this.setData({ 
        pageState: 'result', 
        allHands: gameData.hands,
        sortedRank: sortedRank
      });
      return;
    }

    const myHand = gameData.hands[this.data.myIndex];
    this.setData({
      pageState: 'playing',
      currentRound: gameData.currentRound,
      currentPlayer: gameData.currentPlayer,
      playerHand: myHand ? myHand.sort((a, b) => this.cardSortValue(a) - this.cardSortValue(b)) : [],
      allHands: gameData.hands,
      tableCards: gameData.tableCards || [],
      rawScores: gameData.rawScores || [0, 0, 0, 0],
      displayScores: gameData.rawScores || [0, 0, 0, 0],
      collectedScoreCards: gameData.collectedScoreCards || [[], [], [], []],
      leadSuit: gameData.leadSuit || null
    });
    
    if (gameData.currentPlayer === this.data.myIndex) this.startCountdown();
    else this.checkAIPlay();
  },

  async playCard(playerIndex, card) {
    this.clearCountdown();
    const newTableCards = [...this.data.tableCards, { player: playerIndex, card }];
    const newHands = this.data.allHands.map((h, i) => i === playerIndex ? h.filter(c => c.id !== card.id) : h);
    const newLeadSuit = newTableCards.length === 1 ? card.suit : this.data.leadSuit;

    if (newTableCards.length === 4) {
      await this.endRound(newHands, newTableCards, newLeadSuit);
    } else {
      await wx.cloud.callFunction({
        name: 'gongzhu',
        data: {
          action: 'playCard',
          data: {
            roomId: this.data.roomId,
            gameData: { ...this.data, tableCards: newTableCards, currentPlayer: (playerIndex + 1) % 4, hands: newHands, leadSuit: newLeadSuit }
          }
        }
      });
    }
  },

  async endRound(hands, tableCards, leadSuit) {
    let winner = tableCards[0].player;
    let maxRank = this.cardRankValue(tableCards[0].card.rank);
    for (let i = 1; i < 4; i++) {
      if (tableCards[i].card.suit === leadSuit) {
        const val = this.cardRankValue(tableCards[i].card.rank);
        if (val > maxRank) { maxRank = val; winner = tableCards[i].player; }
      }
    }
    
    const roundScoreCards = tableCards.filter(tc => SCORE_CARDS[tc.card.id] || tc.card.id === 'C10' || tc.card.suit === 'H').map(tc => tc.card);
    const newCollected = [...this.data.collectedScoreCards];
    newCollected[winner] = [...newCollected[winner], ...roundScoreCards];
    
    let roundRaw = 0;
    tableCards.forEach(tc => { if (SCORE_CARDS[tc.card.id]) roundRaw += SCORE_CARDS[tc.card.id]; });
    const newRawScores = [...this.data.rawScores];
    newRawScores[winner] += roundRaw;

    const isOver = this.data.currentRound >= 13;
    const gameData = {
      ...this.data,
      hands,
      tableCards: [],
      currentPlayer: winner,
      currentRound: isOver ? this.data.currentRound : this.data.currentRound + 1,
      collectedScoreCards: newCollected,
      rawScores: newRawScores,
      leadSuit: null,
      status: isOver ? 'finished' : 'playing'
    };

    setTimeout(async () => {
      await wx.cloud.callFunction({
        name: 'gongzhu',
        data: { action: 'playCard', data: { roomId: this.data.roomId, gameData } }
      });
    }, 1500);
  },

  cardSortValue(card) {
    const sO = { 'S': 0, 'C': 1, 'D': 2, 'H': 3 };
    const rO = { 'A': 12, 'K': 11, 'Q': 10, 'J': 9, '10': 8, '9': 7, '8': 6, '7': 5, '6': 4, '5': 3, '4': 2, '3': 1, '2': 0 };
    return sO[card.suit] * 13 + rO[card.rank];
  },

  cardRankValue(rank) {
    const v = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
    return v[rank];
  },

  getPlayerPosition(playerIndex) {
    const relative = (playerIndex - this.data.myIndex + 4) % 4;
    return ['pos-bottom', 'pos-right', 'pos-top', 'pos-left'][relative];
  },

  checkAIPlay() {
    const p = this.data.players[this.data.currentPlayer];
    if (p && p.isAI) setTimeout(() => this.aiPlay(), 1000);
  },

  aiPlay() {
    const idx = this.data.currentPlayer;
    const hand = this.data.allHands[idx];
    if (!hand || hand.length === 0) return;
    const valid = hand.filter(c => this.isValidPlayAI(c, hand));
    const card = valid[Math.floor(Math.random() * valid.length)];
    if (card) this.playCard(idx, card);
  },

  isValidPlayAI(card, hand) {
    const { tableCards, leadSuit } = this.data;
    if (tableCards.length === 0) return true;
    if (card.suit === leadSuit) return true;
    return !hand.some(c => c.suit === leadSuit);
  },

  isValidPlay(card) {
    const { tableCards, leadSuit, playerHand } = this.data;
    if (tableCards.length === 0) return true;
    if (card.suit === leadSuit) return true;
    return !playerHand.some(c => c.suit === leadSuit);
  },

  // 计算排名
  calculateRank(rawScores) {
    const scores = rawScores.map((score, idx) => ({
      idx: idx,
      thisGame: score,
      total: score,
      rank: 0
    }));
    scores.sort((a, b) => b.thisGame - a.thisGame);
    scores.forEach((item, i) => { item.rank = i + 1; });
    return scores;
  },

  startCountdown() {
    this.clearCountdown();
    this.setData({ countdown: 30 });
    this.countdownTimer = setInterval(() => {
      const n = this.data.countdown - 1;
      this.setData({ countdown: n });
      if (n <= 0) { this.clearCountdown(); this.autoPlay(); }
    }, 1000);
  },

  clearCountdown() { if (this.countdownTimer) clearInterval(this.countdownTimer); this.setData({ countdown: 0 }); },

  autoPlay() {
    const hand = this.data.playerHand;
    const valid = hand.filter(c => this.isValidPlay(c));
    if (valid.length > 0) {
      const card = valid[Math.floor(Math.random() * valid.length)];
      const idx = hand.findIndex(c => c.id === card.id);
      this.setData({ selectedCard: idx });
      this.confirmPlay();
    }
  },

  showJoinModal() { this.setData({ showJoinInput: true, inputRoomId: '' }); },
  hideJoinModal() { this.setData({ showJoinInput: false }); },
  onRoomIdInput(e) { this.setData({ inputRoomId: e.detail.value }); },
  selectCard(e) { this.setData({ selectedCard: e.currentTarget.dataset.index }); },
  confirmPlay() { if (this.data.selectedCard !== null) this.playCard(this.data.myIndex, this.data.playerHand[this.data.selectedCard]); },
  
  // 离开房间
  leaveRoom() {
    wx.cloud.callFunction({
      name: 'gongzhu',
      data: { action: 'leaveRoom', data: { roomId: this.data.roomId, playerId: app.globalData.openid } }
    });
    this.stopWatching();
    wx.navigateBack();
  },
  
  // 再来一局
  async playAgain() {
    wx.showLoading({ title: '准备中...' });
    const deck = this.createDeck();
    const hands = [[], [], [], []];
    for (let i = 0; i < 52; i++) hands[i % 4].push(deck[i]);
    const teams = this.determineTeamsInitial(hands);
    let firstPlayer = 0;
    for (let i = 0; i < 4; i++) { if (hands[i].some(c => c.id === 'SJ')) firstPlayer = i; }

    const gameData = {
      currentRound: 1,
      currentPlayer: firstPlayer,
      hands: hands,
      tableCards: [],
      leadSuit: null,
      rawScores: [0, 0, 0, 0],
      collectedScoreCards: [[], [], [], []],
      teams: teams,
      status: 'playing'
    };

    await wx.cloud.callFunction({
      name: 'gongzhu',
      data: { action: 'startGame', data: { roomId: this.data.roomId, gameData } }
    });
    wx.hideLoading();
  },
  
  // 退出游戏
  exitGame() {
    this.leaveRoom();
  }
});
