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
    inputRoomId: '',
    showJoinInput: false,
    isHost: false,
    myIndex: 0,
    playerCount: 0,
    players: [
      { isEmpty: true },
      { isEmpty: true },
      { isEmpty: true },
      { isEmpty: true }
    ],
    
    // 游戏数据
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
    
    // 结算
    sortedRank: [],
    
    // 云数据库监听
    roomWatcher: null,
    countdownTimer: null
  },

  onLoad() {
    this.userInfo = wx.getStorageSync('userInfo') || { nickName: '玩家', avatarUrl: '' };
  },

  onUnload() {
    this.stopWatching();
    this.clearCountdown();
  },

  // ========== 房间管理 ==========
  
  generateRoomId() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  async createRoom() {
    const roomId = this.generateRoomId();
    const userInfo = this.userInfo;
    const hostId = app.globalData.openid || 'host_' + Date.now();
    
    try {
      wx.showLoading({ title: '创建中...' });
      
      // 使用云函数创建房间
      const res = await wx.cloud.callFunction({
        name: 'gongzhu',
        data: {
          action: 'createRoom',
          data: {
            roomId,
            hostId,
            nickname: userInfo.nickName,
            avatar: userInfo.avatarUrl || '/images/avatar.png'
          }
        }
      });
      
      wx.hideLoading();
      
      if (res.result.success) {
        this.setData({
          roomId,
          isHost: true,
          myIndex: 0,
          pageState: 'lobby',
          playerCount: 1,
          players: this.formatPlayers([{
            id: hostId,
            nickname: userInfo.nickName,
            avatar: userInfo.avatarUrl || '/images/avatar.png',
            isHost: true,
            isAI: false
          }])
        });
        
        this.startWatching(roomId);
      } else {
        wx.showToast({ title: res.result.error || '创建失败', icon: 'none' });
      }
      
    } catch (err) {
      wx.hideLoading();
      console.error('创建房间失败:', err);
      wx.showToast({ title: '创建失败', icon: 'none' });
    }
  },

  showJoinModal() {
    this.setData({ showJoinInput: true, inputRoomId: '' });
  },

  hideJoinModal() {
    this.setData({ showJoinInput: false });
  },

  onRoomIdInput(e) {
    this.setData({ inputRoomId: e.detail.value });
  },

  async joinRoom() {
    const roomId = this.data.inputRoomId;
    if (roomId.length !== 6) {
      wx.showToast({ title: '请输入6位房间号', icon: 'none' });
      return;
    }
    
    const userInfo = this.userInfo;
    const playerId = app.globalData.openid || 'player_' + Date.now();
    
    try {
      wx.showLoading({ title: '加入中...' });
      
      // 使用云函数加入房间
      const res = await wx.cloud.callFunction({
        name: 'gongzhu',
        data: {
          action: 'joinRoom',
          data: {
            roomId,
            playerId,
            nickname: userInfo.nickName,
            avatar: userInfo.avatarUrl || '/images/avatar.png'
          }
        }
      });
      
      wx.hideLoading();
      
      if (res.result.success) {
        // 获取房间信息
        const roomRes = await wx.cloud.callFunction({
          name: 'gongzhu',
          data: {
            action: 'getRoom',
            data: { roomId }
          }
        });
        
        const room = roomRes.result.data;
        
        this.setData({
          roomId,
          isHost: false,
          myIndex: res.result.playerIndex,
          pageState: 'lobby',
          playerCount: room.players.length,
          players: this.formatPlayers(room.players)
        });
        
        this.startWatching(roomId);
        this.hideJoinModal();
      } else {
        wx.showToast({ title: res.result.error || '加入失败', icon: 'none' });
      }
      
    } catch (err) {
      wx.hideLoading();
      console.error('加入房间失败:', err);
      wx.showToast({ title: '加入失败', icon: 'none' });
    }
  },

  formatPlayers(players) {
    const result = [];
    for (let i = 0; i < 4; i++) {
      if (players[i]) {
        result.push({ ...players[i], isEmpty: false });
      } else {
        result.push({ isEmpty: true });
      }
    }
    return result;
  },

  // ========== 云数据库监听 ==========
  
  startWatching(roomId) {
    this.roomWatcher = db.collection('gongzhu_rooms').doc(roomId).watch({
      onChange: (snapshot) => {
        const room = snapshot.docs[0];
        if (!room) return;
        
        // 更新玩家列表
        this.setData({
          playerCount: room.players.length,
          players: this.formatPlayers(room.players)
        });
        
        // 如果在等待页面且游戏开始，初始化游戏
        if (room.status === 'playing' && this.data.pageState === 'lobby') {
          this.initGameFromRoom(room);
        }
        
        // 如果在游戏页面，同步游戏状态
        if (room.status === 'playing' && this.data.pageState === 'playing' && room.gameData) {
          this.syncGameState(room.gameData);
        }
      },
      onError: (err) => {
        console.error('监听错误:', err);
      }
    });
  },

  stopWatching() {
    if (this.roomWatcher) {
      this.roomWatcher.close();
      this.roomWatcher = null;
    }
  },
  
  // 同步游戏状态
  syncGameState(gameData) {
    // 只在不是自己回合时同步（避免重复更新）
    if (gameData.currentPlayer === this.data.myIndex) return;
    
    const myHand = gameData.hands[this.data.myIndex];
    
    this.setData({
      currentRound: gameData.currentRound,
      currentPlayer: gameData.currentPlayer,
      playerHand: myHand.sort((a, b) => this.cardSortValue(a) - this.cardSortValue(b)),
      allHands: gameData.hands,
      tableCards: gameData.tableCards || [],
      rawScores: gameData.rawScores || [0, 0, 0, 0],
      displayScores: gameData.rawScores || [0, 0, 0, 0],
      collectedScoreCards: gameData.collectedScoreCards || [[], [], [], []],
      leadSuit: gameData.leadSuit || null
    });
    
    // 检查 AI 出牌
    setTimeout(() => this.checkAIPlay(), 500);
  },

  // ========== 大厅操作 ==========
  
  async addAI() {
    if (this.data.playerCount >= 4) return;
    
    const aiId = 'ai_' + Date.now();
    const nickname = '机器人' + (this.data.playerCount);
    
    // 乐观更新：先更新本地界面
    const newPlayerCount = this.data.playerCount + 1;
    const newPlayers = [...this.data.players];
    const emptyIndex = newPlayers.findIndex(p => p.isEmpty);
    if (emptyIndex !== -1) {
      newPlayers[emptyIndex] = {
        id: aiId,
        nickname: nickname,
        avatar: '/images/avatar2.png',
        isHost: false,
        isAI: true,
        isEmpty: false
      };
    }
    
    this.setData({
      playerCount: newPlayerCount,
      players: newPlayers
    });
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'gongzhu',
        data: {
          action: 'addAI',
          data: {
            roomId: this.data.roomId,
            aiId,
            nickname,
            avatar: '/images/avatar2.png'
          }
        }
      });
      
      if (!res.result.success) {
        wx.showToast({ title: res.result.error || '添加失败', icon: 'none' });
      }
    } catch (err) {
      console.error('添加AI失败:', err);
      wx.showToast({ title: '添加失败', icon: 'none' });
    }
  },

  async leaveRoom() {
    this.stopWatching();
    this.setData({ pageState: 'home', roomId: '' });
  },

  async startGame() {
    if (this.data.playerCount < 2) return;
    
    try {
      wx.showLoading({ title: '开始游戏...' });
      
      // 初始化游戏数据
      const deck = this.createDeck();
      const hands = this.dealCards(deck);
      const teams = this.determineTeamsInitial(hands);
      const firstPlayer = this.findFirstPlayer(hands);
      
      const gameData = {
        currentRound: 1,
        currentPlayer: firstPlayer,
        hands: hands,
        tableCards: [],
        leadSuit: null,
        rawScores: [0, 0, 0, 0],
        collectedScoreCards: [[], [], [], []],
        teams: teams
      };
      
      // 使用云函数更新游戏状态
      const res = await wx.cloud.callFunction({
        name: 'gongzhu',
        data: {
          action: 'startGame',
          data: {
            roomId: this.data.roomId,
            gameData
          }
        }
      });
      
      wx.hideLoading();
      
      if (res.result.success) {
        // 等待一下确保数据库更新完成
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 本地初始化
        const myHand = hands[this.data.myIndex];
        this.setData({
          pageState: 'playing',
          currentRound: 1,
          currentPlayer: firstPlayer,
          playerHand: myHand.sort((a, b) => this.cardSortValue(a) - this.cardSortValue(b)),
          allHands: hands,
          tableCards: [],
          rawScores: [0, 0, 0, 0],
          displayScores: [0, 0, 0, 0],
          collectedScoreCards: [[], [], [], []],
          selectedCard: null,
          leadSuit: null
        });
        
        // 如果是当前玩家回合，开始倒计时
        if (firstPlayer === this.data.myIndex) {
          this.startCountdown();
        }
        
        // AI 自动出牌
        setTimeout(() => this.checkAIPlay(), 1000);
      } else {
        wx.showToast({ title: res.result.error || '开始失败', icon: 'none' });
      }
      
    } catch (err) {
      wx.hideLoading();
      console.error('开始游戏失败:', err);
      wx.showToast({ title: '开始失败', icon: 'none' });
    }
  },

  initGameFromRoom(room) {
    const gameData = room.gameData;
    const myHand = gameData.hands[this.data.myIndex];
    
    this.setData({
      pageState: 'playing',
      currentRound: gameData.currentRound,
      currentPlayer: gameData.currentPlayer,
      playerHand: myHand.sort((a, b) => this.cardSortValue(a) - this.cardSortValue(b)),
      allHands: gameData.hands,
      tableCards: gameData.tableCards || [],
      rawScores: gameData.rawScores || [0, 0, 0, 0],
      displayScores: gameData.rawScores || [0, 0, 0, 0],
      collectedScoreCards: gameData.collectedScoreCards || [[], [], [], []],
      selectedCard: null,
      leadSuit: gameData.leadSuit || null
    });
    
    // 如果是当前玩家回合，开始倒计时
    if (gameData.currentPlayer === this.data.myIndex) {
      this.startCountdown();
    }
    
    // AI 自动出牌
    setTimeout(() => this.checkAIPlay(), 500);
  },

  // ========== 游戏逻辑 ==========
  
  createDeck() {
    const deck = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ suit, rank, id: `${suit}${rank}` });
      }
    }
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  },

  dealCards(deck) {
    const hands = [[], [], [], []];
    for (let i = 0; i < 52; i++) hands[i % 4].push(deck[i]);
    return hands;
  },

  findFirstPlayer(hands) {
    for (let i = 0; i < 4; i++) {
      if (hands[i].some(c => c.id === 'SJ')) return i;
    }
    return 0;
  },

  determineTeamsInitial(hands) {
    let pigOwner = -1, sheepOwner = -1;
    for (let i = 0; i < 4; i++) {
      if (hands[i].some(c => c.id === 'SQ')) pigOwner = i;
      if (hands[i].some(c => c.id === 'DJ')) sheepOwner = i;
    }
    const teams = {};
    if (pigOwner === sheepOwner) {
      teams[pigOwner] = (pigOwner + 2) % 4;
      teams[(pigOwner + 2) % 4] = pigOwner;
      const o1 = (pigOwner + 1) % 4, o2 = (pigOwner + 3) % 4;
      teams[o1] = o2; teams[o2] = o1;
    } else {
      teams[pigOwner] = sheepOwner;
      teams[sheepOwner] = pigOwner;
      const others = [0,1,2,3].filter(i => i !== pigOwner && i !== sheepOwner);
      teams[others[0]] = others[1];
      teams[others[1]] = others[0];
    }
    return teams;
  },

  cardSortValue(card) {
    const suitOrder = { 'S': 0, 'C': 1, 'D': 2, 'H': 3 };
    const rankOrder = { 'A': 12, 'K': 11, 'Q': 10, 'J': 9, '10': 8, '9': 7, '8': 6, '7': 5, '6': 4, '5': 3, '4': 2, '3': 1, '2': 0 };
    return suitOrder[card.suit] * 13 + rankOrder[card.rank];
  },

  cardRankValue(rank) {
    const values = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
    return values[rank];
  },

  // ========== 出牌逻辑 ==========

  isValidPlay(card) {
    const { tableCards, leadSuit, currentRound, playerHand } = this.data;
    if (currentRound === 1 && tableCards.length === 0) return card.id === 'SJ';
    if (tableCards.length === 0) return true;
    if (card.suit === leadSuit) return true;
    return !playerHand.some(c => c.suit === leadSuit);
  },

  selectCard(e) {
    if (this.data.currentPlayer !== this.data.myIndex) return;
    const index = e.currentTarget.dataset.index;
    const card = this.data.playerHand[index];
    if (!this.isValidPlay(card)) {
      wx.showToast({ title: '请跟花色', icon: 'none' });
      return;
    }
    this.setData({ selectedCard: index });
  },

  async confirmPlay() {
    if (this.data.selectedCard === null) return;
    if (this.data.currentPlayer !== this.data.myIndex) return;
    
    const card = this.data.playerHand[this.data.selectedCard];
    await this.playCard(this.data.myIndex, card);
  },

  async playCard(playerIndex, card) {
    this.clearCountdown();
    
    try {
      // 获取当前游戏数据
      const roomRes = await wx.cloud.callFunction({
        name: 'gongzhu',
        data: {
          action: 'getRoom',
          data: { roomId: this.data.roomId }
        }
      });
      
      const room = roomRes.result.data;
      
      // 安全检查：确保 gameData 存在
      if (!room.gameData) {
        console.error('gameData 不存在，游戏状态异常');
        wx.showToast({ title: '游戏状态异常，请重新开始', icon: 'none' });
        this.setData({ pageState: 'lobby' });
        return;
      }
      
      const gameData = room.gameData;
      
      // 更新手牌
      const newHands = [...gameData.hands];
      if (playerIndex === this.data.myIndex) {
        newHands[playerIndex] = newHands[playerIndex].filter((c, i) => i !== this.data.selectedCard);
      } else {
        newHands[playerIndex] = newHands[playerIndex].filter(c => c.id !== card.id);
      }
      
      // 更新桌面
      const newTableCards = [...gameData.tableCards, { player: playerIndex, card }];
      const newLeadSuit = newTableCards.length === 1 ? card.suit : gameData.leadSuit;
      
      // 更新玩家本地手牌显示
      const newPlayerHand = playerIndex === this.data.myIndex 
        ? this.data.playerHand.filter((c, i) => i !== this.data.selectedCard)
        : this.data.playerHand;
      
      // 更新本地状态
      this.setData({
        tableCards: newTableCards,
        playerHand: newPlayerHand,
        leadSuit: newLeadSuit,
        selectedCard: null,
        allHands: newHands
      });
      
      // 检查是否一轮结束
      if (newTableCards.length === 4) {
        await this.endRound(newHands, newTableCards, newLeadSuit, gameData);
      } else {
        // 下一个玩家
        const nextPlayer = (playerIndex + 1) % 4;
        
        // 更新游戏数据到云端
        const newGameData = {
          ...gameData,
          hands: newHands,
          tableCards: newTableCards,
          leadSuit: newLeadSuit,
          currentPlayer: nextPlayer
        };
        
        await wx.cloud.callFunction({
          name: 'gongzhu',
          data: {
            action: 'playCard',
            data: {
              roomId: this.data.roomId,
              gameData: newGameData
            }
          }
        });
        
        this.setData({ currentPlayer: nextPlayer });
        
        // 如果下一个是当前玩家，开始倒计时
        if (nextPlayer === this.data.myIndex) {
          this.startCountdown();
        }
        
        // AI 自动出牌
        setTimeout(() => this.checkAIPlay(), 500);
      }
      
    } catch (err) {
      console.error('出牌失败:', err);
      wx.showToast({ title: '出牌失败', icon: 'none' });
    }
  },

  async checkAIPlay() {
    const { currentPlayer, players } = this.data;
    if (players[currentPlayer]?.isAI) {
      setTimeout(() => this.aiPlay(), 800);
    }
  },

  aiPlay() {
    const playerIndex = this.data.currentPlayer;
    const hand = this.data.allHands[playerIndex];
    const { tableCards, currentRound } = this.data;
    
    let card = null;
    
    // 第一轮首家必须出黑桃J
    if (currentRound === 1 && tableCards.length === 0) {
      card = hand.find(c => c.id === 'SJ');
      if (card) {
        this.playCard(playerIndex, card);
        return;
      }
    }
    
    const validCards = hand.filter(c => this.isValidPlayAI(c, hand));
    
    // 简单AI策略：随机出一张合法牌
    if (!card && validCards.length > 0) {
      card = validCards[Math.floor(Math.random() * validCards.length)];
    }
    
    if (card) {
      this.playCard(playerIndex, card);
    }
  },

  isValidPlayAI(card, hand) {
    const { tableCards, leadSuit, currentRound } = this.data;
    if (currentRound === 1 && tableCards.length === 0) return card.id === 'SJ';
    if (tableCards.length === 0) return true;
    if (card.suit === leadSuit) return true;
    return !hand.some(c => c.suit === leadSuit);
  },

  startCountdown() {
    this.clearCountdown();
    this.setData({ countdown: 30 });
    
    this.countdownTimer = setInterval(() => {
      const newCountdown = this.data.countdown - 1;
      this.setData({ countdown: newCountdown });
      
      if (newCountdown <= 0) {
        this.clearCountdown();
        this.autoPlay();
      }
    }, 1000);
  },

  clearCountdown() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    this.setData({ countdown: 0 });
  },

  autoPlay() {
    // 超时自动出牌
    const hand = this.data.playerHand;
    const validCards = hand.filter(c => this.isValidPlay(c));
    if (validCards.length > 0) {
      const card = validCards[Math.floor(Math.random() * validCards.length)];
      const index = hand.findIndex(c => c.id === card.id);
      this.setData({ selectedCard: index });
      this.confirmPlay();
    }
  },

  getPlayerPosition(playerIndex) {
    const myIndex = this.data.myIndex;
    const relative = (playerIndex - myIndex + 4) % 4;
    return ['pos-bottom', 'pos-right', 'pos-top', 'pos-left'][relative];
  },

  // ========== 结算逻辑 ==========
  
  async endRound(hands, tableCards, leadSuit, gameData) {
    // 判断赢家
    let winner = tableCards[0].player;
    let maxRank = this.cardRankValue(tableCards[0].card.rank);
    for (let i = 1; i < 4; i++) {
      if (tableCards[i].card.suit === leadSuit) {
        const val = this.cardRankValue(tableCards[i].card.rank);
        if (val > maxRank) { maxRank = val; winner = tableCards[i].player; }
      }
    }
    
    // 收集得分牌
    const roundScoreCards = tableCards.filter(tc => 
      SCORE_CARDS[tc.card.id] || 
      tc.card.id === 'C10' || 
      tc.card.suit === 'H'
    ).map(tc => tc.card);
    
    const newCollected = [...gameData.collectedScoreCards];
    newCollected[winner] = [...newCollected[winner], ...roundScoreCards];
    
    // 计算本轮分数
    let roundRaw = 0;
    tableCards.forEach(tc => {
      if (SCORE_CARDS[tc.card.id]) roundRaw += SCORE_CARDS[tc.card.id];
    });
    
    const newRawScores = [...gameData.rawScores];
    newRawScores[winner] += roundRaw;
    
    const isOver = this.data.currentRound >= 13;
    
    if (isOver) {
      // 游戏结束，计算最终分数
      const { optimizedScores, finalScores } = this.calculateFinalAverage(newRawScores, newCollected, gameData.teams);
      
      // 构建排行榜
      const sorted = [0, 1, 2, 3]
        .map(idx => ({ idx, optimized: optimizedScores[idx], thisGame: finalScores[idx], total: finalScores[idx] }))
        .sort((a, b) => b.total - a.total);
      
      // 计算排名
      const sortedRank = [];
      for (let index = 0; index < sorted.length; index++) {
        const item = sorted[index];
        let rank = index + 1;
        if (index > 0 && item.total === sorted[index - 1].total) {
          rank = sortedRank[index - 1].rank;
        }
        sortedRank.push({ ...item, rank });
      }
      
      // 更新游戏数据
      const newGameData = {
        ...gameData,
        hands,
        tableCards: [],
        collectedScoreCards: newCollected,
        rawScores: newRawScores,
        status: 'finished'
      };
      
      await wx.cloud.callFunction({
        name: 'gongzhu',
        data: {
          action: 'playCard',
          data: { roomId: this.data.roomId, gameData: newGameData }
        }
      });
      
      // 显示结算
      this.setData({
        pageState: 'result',
        sortedRank,
        tableCards: []
      });
      
    } else {
      // 下一轮
      const newGameData = {
        ...gameData,
        currentRound: this.data.currentRound + 1,
        currentPlayer: winner,
        hands,
        tableCards: [],
        leadSuit: null,
        collectedScoreCards: newCollected,
        rawScores: newRawScores
      };
      
      await wx.cloud.callFunction({
        name: 'gongzhu',
        data: {
          action: 'playCard',
          data: { roomId: this.data.roomId, gameData: newGameData }
        }
      });
      
      this.setData({
        currentRound: this.data.currentRound + 1,
        currentPlayer: winner,
        tableCards: [],
        collectedScoreCards: newCollected,
        rawScores: newRawScores,
        displayScores: newRawScores
      });
      
      if (winner === this.data.myIndex) {
        this.startCountdown();
      }
      
      setTimeout(() => this.checkAIPlay(), 500);
    }
  },

  calculateFinalAverage(rawScores, collected, teams) {
    const final = [0, 0, 0, 0];
    const processed = new Set();
    
    const optimizedScores = rawScores.map((score, idx) => {
      const myCollected = collected[idx];
      const hearts = myCollected.filter(c => c.suit === 'H');
      let finalS = score;
      
      // 全红逻辑
      if (hearts.length === 13) finalS += 400;
      
      // 变压器逻辑
      const hasOtherScoreCards = myCollected.some(c => 
        c.id === 'SQ' || c.id === 'DJ' || c.suit === 'H'
      );
      
      if (myCollected.some(c => c.id === 'C10')) {
        if (!hasOtherScoreCards) {
          finalS = 50;
        } else {
          finalS *= 2;
        }
      }
      
      return finalS;
    });

    // 计算团队平均分
    for (let i = 0; i < 4; i++) {
      if (processed.has(i)) continue;
      const mate = teams[i];
      const avg = Math.round((optimizedScores[i] + optimizedScores[mate]) / 2);
      final[i] = final[mate] = avg;
      processed.add(i);
      processed.add(mate);
    }
    
    return { optimizedScores, finalScores: final };
  },

  playAgain() {
    this.setData({ pageState: 'lobby' });
  },

  exitGame() {
    this.stopWatching();
    this.setData({ pageState: 'home', roomId: '' });
  }
});