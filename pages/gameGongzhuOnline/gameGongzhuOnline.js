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
    sortedRank: [],
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

  async addAI() {
    if (this.data.playerCount >= 4) return;
    const aiId = 'ai_' + Date.now();
    const nickname = '机器人' + (this.data.playerCount);
    // 乐观更新
    const newPlayers = [...this.data.players];
    const emptyIdx = newPlayers.findIndex(p => p.isEmpty);
    if (emptyIdx !== -1) {
      newPlayers[emptyIdx] = { id: aiId, nickname, avatar: '/images/avatar2.png', isHost: false, isAI: true, isEmpty: false };
      this.setData({ playerCount: this.data.playerCount + 1, players: newPlayers });
    }
    try {
      await wx.cloud.callFunction({
        name: 'gongzhu',
        data: { action: 'addAI', data: { roomId: this.data.roomId, aiId, nickname, avatar: '/images/avatar2.png' } }
      });
    } catch (err) {}
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
        if (this.data.pageState === 'lobby') {
          this.setData({ playerCount: room.players.length, players: this.formatPlayers(room.players) });
          if (room.status === 'playing') this.initGameFromRoom(room);
        } else if (this.data.pageState === 'playing' && room.gameData) {
          this.syncGameState(room.gameData);
        }
      },
      onError: (err) => console.error(err)
    });
  },

  stopWatching() { if (this.roomWatcher) this.roomWatcher.close(); },

  syncGameState(gameData) {
    const remoteTable = gameData.tableCards || [];
    const localTable = this.data.tableCards;
    
    // 核心同步锁：只有远程牌变多，或一轮彻底结束时才同步
    let finalTable = localTable;
    if (remoteTable.length > localTable.length) {
      finalTable = remoteTable;
    } else if (remoteTable.length === 0 && localTable.length === 4) {
      // 延迟清空
      if (!this.cleaning) {
        this.cleaning = true;
        setTimeout(() => {
          this.setData({ tableCards: [] });
          this.cleaning = false;
        }, 1500);
      }
      return;
    }

    const myHand = gameData.hands[this.data.myIndex];
    this.setData({
      currentRound: gameData.currentRound,
      currentPlayer: gameData.currentPlayer,
      playerHand: myHand ? myHand.sort((a, b) => this.cardSortValue(a) - this.cardSortValue(b)) : [],
      allHands: gameData.hands,
      tableCards: finalTable,
      rawScores: gameData.rawScores || [0, 0, 0, 0],
      displayScores: gameData.rawScores || [0, 0, 0, 0],
      collectedScoreCards: gameData.collectedScoreCards || [[], [], [], []],
      leadSuit: gameData.leadSuit || null
    });
    
    this.checkAIPlay();
  },

  async playCard(playerIndex, card) {
    // 1. 本地前置更新
    const newTableCards = [...this.data.tableCards, { player: playerIndex, card }];
    const newLeadSuit = newTableCards.length === 1 ? card.suit : this.data.leadSuit;
    
    this.setData({
      tableCards: newTableCards,
      leadSuit: newLeadSuit,
      selectedCard: null,
      currentPlayer: -1 // 锁定点击
    });

    try {
      // 2. 推送到云端（带状态校验）
      const res = await wx.cloud.callFunction({
        name: 'gongzhu',
        data: {
          action: 'playCard',
          data: {
            roomId: this.data.roomId,
            gameData: {
              ...this.data, // 基于本地完整状态
              tableCards: newTableCards,
              currentPlayer: (playerIndex + 1) % 4,
              hands: this.data.allHands.map((h, i) => i === playerIndex ? h.filter(c => c.id !== card.id) : h)
            }
          }
        }
      });

      if (newTableCards.length === 4) {
        setTimeout(() => this.endRound(this.data.allHands, newTableCards, newLeadSuit), 500);
      }
    } catch (err) {}
  },

  cardSortValue(card) {
    const suitOrder = { 'S': 0, 'C': 1, 'D': 2, 'H': 3 };
    const rankOrder = { 'A': 12, 'K': 11, 'Q': 10, 'J': 9, '10': 8, '9': 7, '8': 6, '7': 5, '6': 4, '5': 3, '4': 2, '3': 1, '2': 0 };
    return suitOrder[card.suit] * 13 + rankOrder[card.rank];
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

  startGame() { this.setData({ pageState: 'playing' }); /* 简化测试 */ },
  selectCard(e) { this.setData({ selectedCard: e.currentTarget.dataset.index }); },
  confirmPlay() { if (this.data.selectedCard !== null) this.playCard(0, this.data.playerHand[this.data.selectedCard]); }
});
