// pages/gameGongzhu/gameGongzhu.js
// 拱猪游戏
// 拱猪游戏 - 单机版（玩家 vs 3 AI）

// 牌型定义
const SUITS = ['♠', '♥', '♣', '♦'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// 特殊牌分值
const SCORE_CARDS = {
  '♠Q': -100,  // 猪
  '♦J': 100,   // 羊
  '♣10': 50,   // 变压器（基础分）
  '♥A': -50,
  '♥K': -40,
  '♥Q': -30,
  '♥J': -20,
  '♥10': -10,
  '♥9': -10,
  '♥8': -10,
  '♥7': -10,
  '♥6': -10,
  '♥5': -10,
  '♥4': -10,
  '♥3': -10,
  '♥2': -10,
};

Page({
  data: {
    gameState: 'ready', // ready, dealing, playing, scoring, over
    players: [],
    currentPlayer: 0,
    currentRound: 1,
    maxRounds: 13,
    tableCards: [], // 当前轮出的牌
    playerHand: [],
    scores: [0, 0, 0, 0],
    roundScores: [0, 0, 0, 0],
    selectedCard: null,
    leadSuit: null,
    gameResult: null
  },

  onLoad() {
    this.initGame();
  },

  // 初始化游戏
  initGame() {
    this.setData({
      gameState: 'ready',
      players: ['你', 'AI-1', 'AI-2', 'AI-3'],
      currentPlayer: 0,
      currentRound: 1,
      tableCards: [],
      playerHand: [],
      scores: [0, 0, 0, 0],
      roundScores: [0, 0, 0, 0],
      selectedCard: null,
      leadSuit: null,
      gameResult: null
    });
  },

  // 开始游戏
  startGame() {
    const deck = this.createDeck();
    const hands = this.dealCards(deck);
    
    this.setData({
      gameState: 'playing',
      playerHand: hands[0].sort((a, b) => this.cardSortValue(a) - this.cardSortValue(b)),
      aiHands: [hands[1], hands[2], hands[3]],
      currentPlayer: this.findFirstPlayer(hands),
      tableCards: [],
      roundScores: [0, 0, 0, 0]
    });

    // 如果AI先出，自动执行
    if (this.data.currentPlayer !== 0) {
      setTimeout(() => this.aiPlay(), 1000);
    }
  },

  // 创建牌组
  createDeck() {
    const deck = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ suit, rank, id: `${suit}${rank}` });
      }
    }
    // 洗牌
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  },

  // 发牌
  dealCards(deck) {
    const hands = [[], [], [], []];
    for (let i = 0; i < 52; i++) {
      hands[i % 4].push(deck[i]);
    }
    return hands;
  },

  // 找先出牌的玩家（有♣2的先出）
  findFirstPlayer(hands) {
    for (let i = 0; i < 4; i++) {
      if (hands[i].some(c => c.suit === '♣' && c.rank === '2')) {
        return i;
      }
    }
    return 0;
  },

  // 牌的排序值
  cardSortValue(card) {
    const suitOrder = { '♣': 0, '♦': 1, '♠': 2, '♥': 3 };
    const rankOrder = { '2': 0, '3': 1, '4': 2, '5': 3, '6': 4, '7': 5, '8': 6, '9': 7, '10': 8, 'J': 9, 'Q': 10, 'K': 11, 'A': 12 };
    return suitOrder[card.suit] * 13 + rankOrder[card.rank];
  },

  // 玩家选择牌
  selectCard(e) {
    if (this.data.currentPlayer !== 0 || this.data.gameState !== 'playing') return;
    
    const index = e.currentTarget.dataset.index;
    const card = this.data.playerHand[index];
    
    // 检查是否符合出牌规则
    if (!this.isValidPlay(card, this.data.playerHand)) {
      wx.showToast({ title: '请跟花色', icon: 'none' });
      return;
    }
    
    this.setData({ selectedCard: index });
  },

  // 检查出牌是否合法
  isValidPlay(card, hand) {
    const { tableCards, leadSuit } = this.data;
    
    // 第一轮必须出♣2
    if (this.data.currentRound === 1 && tableCards.length === 0) {
      return card.suit === '♣' && card.rank === '2';
    }
    
    // 首家出牌
    if (tableCards.length === 0) {
      // 第一轮不能出猪、羊、变压器
      if (this.data.currentRound === 1) {
        if (card.id === '♠Q' || card.id === '♥A' || card.id === '♦J') {
          return false;
        }
      }
      return true;
    }
    
    // 跟牌
    if (leadSuit && card.suit !== leadSuit) {
      // 检查手牌是否有该花色
      const hasSuit = hand.some(c => c.suit === leadSuit);
      if (hasSuit) return false;
    }
    
    return true;
  },

  // 玩家确认出牌
  confirmPlay() {
    if (this.data.selectedCard === null) return;
    
    const card = this.data.playerHand[this.data.selectedCard];
    this.playCard(0, card);
  },

  // 出牌
  playCard(playerIndex, card) {
    const tableCards = [...this.data.tableCards, { player: playerIndex, card }];
    
    // 更新手牌
    let playerHand = this.data.playerHand;
    let aiHands = this.data.aiHands;
    
    if (playerIndex === 0) {
      playerHand = playerHand.filter((c, i) => i !== this.data.selectedCard);
    } else {
      aiHands[playerIndex - 1] = aiHands[playerIndex - 1].filter(c => c.id !== card.id);
    }
    
    // 设置首家花色
    const leadSuit = tableCards.length === 1 ? card.suit : this.data.leadSuit;
    
    this.setData({
      tableCards,
      playerHand,
      aiHands,
      leadSuit,
      selectedCard: null
    });
    
    // 检查本轮是否结束
    if (tableCards.length === 4) {
      setTimeout(() => this.endRound(), 1500);
    } else {
      // 下一个玩家
      const nextPlayer = (playerIndex + 1) % 4;
      this.setData({ currentPlayer: nextPlayer });
      
      if (nextPlayer !== 0) {
        setTimeout(() => this.aiPlay(), 1000);
      }
    }
  },

  // AI出牌
  aiPlay() {
    const playerIndex = this.data.currentPlayer;
    const hand = this.data.aiHands[playerIndex - 1];
    
    // 找出所有合法出牌
    const validCards = hand.filter(c => this.isValidPlay(c, hand));
    
    // AI策略：简单随机
    const card = validCards[Math.floor(Math.random() * validCards.length)];
    
    this.playCard(playerIndex, card);
  },

  // 结束本轮
  endRound() {
    const { tableCards, leadSuit } = this.data;
    
    // 找出最大牌（必须是首家花色）
    let winner = tableCards[0].player;
    let maxRank = this.cardRankValue(tableCards[0].card.rank);
    
    for (let i = 1; i < 4; i++) {
      const tc = tableCards[i];
      // 只有跟了首家花色的牌才能比较大小
      if (tc.card.suit === leadSuit) {
        const rank = this.cardRankValue(tc.card.rank);
        if (rank > maxRank) {
          maxRank = rank;
          winner = tc.player;
        }
      }
    }
    
    // 计算本轮得分
    const roundScore = this.calculateRoundScore(tableCards);
    const roundScores = [...this.data.roundScores];
    roundScores[winner] += roundScore;
    
    // 更新总分
    const scores = [...this.data.scores];
    scores[winner] += roundScore;
    
    // 检查游戏是否结束
    const isOver = this.data.currentRound >= this.data.maxRounds;
    
    this.setData({
      tableCards: [],
      currentPlayer: winner,
      leadSuit: null,
      roundScores,
      scores,
      currentRound: this.data.currentRound + 1,
      gameState: isOver ? 'over' : 'playing',
      gameResult: isOver ? this.calculateFinalResult(scores) : null
    });
    
    if (!isOver && winner !== 0) {
      setTimeout(() => this.aiPlay(), 1000);
    }
  },

  // 牌面值
  cardRankValue(rank) {
    const values = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
    return values[rank];
  },

  // 计算本轮得分
  calculateRoundScore(tableCards) {
    let score = 0;
    let hasTransformer = false;
    let hasPig = false;
    let hasSheep = false;
    let hasHeart = false;
    
    // 先检查有哪些特殊牌
    for (const tc of tableCards) {
      const cardId = tc.card.id;
      if (cardId === '♣10') hasTransformer = true;
      if (cardId === '♠Q') hasPig = true;
      if (cardId === '♦J') hasSheep = true;
      if (tc.card.suit === '♥') hasHeart = true;
    }
    
    // 计算基础分
    for (const tc of tableCards) {
      const cardId = tc.card.id;
      if (SCORE_CARDS[cardId]) {
        // 变压器单独处理
        if (cardId === '♣10') continue;
        score += SCORE_CARDS[cardId];
      }
    }
    
    // 变压器规则
    if (hasTransformer) {
      if (!hasPig && !hasSheep && !hasHeart) {
        // 没有猪、羊、红桃，变压器+50
        score += 50;
      } else {
        // 有猪/羊/红桃（哪怕红桃2是0分），所有分数×2
        score *= 2;
      }
    }
    
    return score;
  },

  // 计算最终结果
  calculateFinalResult(scores) {
    const playerScore = scores[0];
    const aiScores = scores.slice(1);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    
    let result = '';
    if (playerScore === maxScore) {
      result = '🎉 你赢了！';
    } else if (playerScore === minScore) {
      result = '😅 你输了...';
    } else {
      result = '🤝 平局';
    }
    
    return {
      result,
      playerScore,
      rank: scores.filter(s => s > playerScore).length + 1
    };
  },

  // 重新开始
  restart() {
    this.initGame();
    this.startGame();
  }
});
