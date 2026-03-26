// pages/gameGongzhu/gameGongzhu.js
// 拱猪游戏 - 2v2组队版

const SUITS = ['♠', '♥', '♣', '♦'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// 特殊牌分值
const SCORE_CARDS = {
  '♠Q': -100,  // 猪
  '♦J': 100,   // 羊
  '♣10': 0,    // 变压器
  '♥A': -50, '♥K': -40, '♥Q': -30, '♥J': -20,
  '♥10': -10, '♥9': -10, '♥8': -10, '♥7': -10,
  '♥6': -10, '♥5': -10, '♥4': -10, '♥3': -10, '♥2': -10,
};

Page({
  data: {
    gameState: 'ready',
    players: ['你', '左家', '对家', '右家'],
    currentPlayer: 0,
    currentRound: 1,
    maxRounds: 13,
    tableCards: [],
    playerHand: [],
    aiHands: [[], [], []],
    rawScores: [0, 0, 0, 0],
    teamScores: [0, 0, 0, 0],
    teams: null,
    selectedCard: null,
    leadSuit: null,
    gameResult: null,
    collectedCards: [[], [], [], []]
  },

  onLoad() {
    this.initGame();
    this.adjustLayout();
  },

  // 根据屏幕尺寸调整布局
  adjustLayout() {
    const sysInfo = wx.getSystemInfoSync();
    const isLandscape = sysInfo.windowWidth > sysInfo.windowHeight;
    const scale = isLandscape ? sysInfo.windowHeight / 750 : 1;
    
    this.setData({
      layoutScale: scale,
      isLandscape: isLandscape
    });
  },

  initGame() {
    this.setData({
      gameState: 'ready',
      currentPlayer: 0,
      currentRound: 1,
      tableCards: [],
      playerHand: [],
      aiHands: [[], [], []],
      rawScores: [0, 0, 0, 0],
      teamScores: [0, 0, 0, 0],
      teams: null,
      selectedCard: null,
      leadSuit: null,
      gameResult: null,
      collectedCards: [[], [], [], []]
    });
  },

  startGame() {
    const deck = this.createDeck();
    const hands = this.dealCards(deck);
    
    this.setData({
      gameState: 'playing',
      playerHand: hands[0].sort((a, b) => this.cardSortValue(a) - this.cardSortValue(b)),
      aiHands: [hands[1], hands[2], hands[3]],
      currentPlayer: this.findFirstPlayer(hands),
      tableCards: [],
      rawScores: [0, 0, 0, 0],
      teamScores: [0, 0, 0, 0],
      teams: null,
      collectedCards: [[], [], [], []]
    });

    if (this.data.currentPlayer !== 0) {
      setTimeout(() => this.aiPlay(), 1000);
    }
  },

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
    for (let i = 0; i < 52; i++) {
      hands[i % 4].push(deck[i]);
    }
    return hands;
  },

  findFirstPlayer(hands) {
    for (let i = 0; i < 4; i++) {
      if (hands[i].some(c => c.suit === '♠' && c.rank === 'J')) {
        return i;
      }
    }
    return 0;
  },

  cardSortValue(card) {
    const suitOrder = { '♣': 0, '♦': 1, '♠': 2, '♥': 3 };
    const rankOrder = { '2': 0, '3': 1, '4': 2, '5': 3, '6': 4, '7': 5, '8': 6, '9': 7, '10': 8, 'J': 9, 'Q': 10, 'K': 11, 'A': 12 };
    return suitOrder[card.suit] * 13 + rankOrder[card.rank];
  },

  selectCard(e) {
    if (this.data.currentPlayer !== 0 || this.data.gameState !== 'playing') return;
    const index = e.currentTarget.dataset.index;
    const card = this.data.playerHand[index];
    if (!this.isValidPlay(card, this.data.playerHand)) {
      wx.showToast({ title: '请跟花色', icon: 'none' });
      return;
    }
    this.setData({ selectedCard: index });
  },

  isValidPlay(card, hand) {
    const { tableCards, leadSuit, currentRound } = this.data;

    if (currentRound === 1 && tableCards.length === 0) {
      // 第一轮首家必须出♠J
      return card.suit === '♠' && card.rank === 'J';
    }

    if (tableCards.length === 0) {
      if (currentRound === 1) {
        // 第一轮不能出分牌
        if (card.id === '♠Q' || card.id === '♦J' || card.id === '♣10') return false;
      }
      return true;
    }

    if (leadSuit && card.suit !== leadSuit) {
      const hasSuit = hand.some(c => c.suit === leadSuit);
      if (hasSuit) return false;
    }

    return true;
  },

  confirmPlay() {
    if (this.data.selectedCard === null) return;
    const card = this.data.playerHand[this.data.selectedCard];
    this.playCard(0, card);
  },

  playCard(playerIndex, card) {
    const tableCards = [...this.data.tableCards, { player: playerIndex, card }];
    
    let playerHand = this.data.playerHand;
    let aiHands = this.data.aiHands;
    
    if (playerIndex === 0) {
      playerHand = playerHand.filter((c, i) => i !== this.data.selectedCard);
    } else {
      aiHands[playerIndex - 1] = aiHands[playerIndex - 1].filter(c => c.id !== card.id);
    }
    
    const leadSuit = tableCards.length === 1 ? card.suit : this.data.leadSuit;
    
    this.setData({
      tableCards,
      playerHand,
      aiHands,
      leadSuit,
      selectedCard: null
    });
    
    if (tableCards.length === 4) {
      setTimeout(() => this.endRound(), 1500);
    } else {
      const nextPlayer = (playerIndex + 1) % 4;
      this.setData({ currentPlayer: nextPlayer });
      if (nextPlayer !== 0) {
        setTimeout(() => this.aiPlay(), 1000);
      }
    }
  },

  aiPlay() {
    const playerIndex = this.data.currentPlayer;
    const hand = this.data.aiHands[playerIndex - 1];
    const validCards = hand.filter(c => this.isValidPlay(c, hand));
    const card = validCards[Math.floor(Math.random() * validCards.length)];
    this.playCard(playerIndex, card);
  },

  endRound() {
    const { tableCards, leadSuit, collectedCards, rawScores } = this.data;
    
    // 找出赢家
    let winner = tableCards[0].player;
    let maxRank = this.cardRankValue(tableCards[0].card.rank);
    
    for (let i = 1; i < 4; i++) {
      const tc = tableCards[i];
      if (tc.card.suit === leadSuit) {
        const rank = this.cardRankValue(tc.card.rank);
        if (rank > maxRank) {
          maxRank = rank;
          winner = tc.player;
        }
      }
    }
    
    // 赢家收走所有牌
    const newCollected = [...collectedCards];
    for (const tc of tableCards) {
      newCollected[winner].push(tc.card);
    }
    
    // 计算本轮原始分
    const roundRawScore = this.calculateRoundScore(tableCards);
    const newRawScores = [...rawScores];
    newRawScores[winner] += roundRawScore;
    
    // 判断队伍并计算队伍分
    const teams = this.determineTeams(newCollected);
    const teamScores = this.calculateTeamScores(newRawScores, teams);
    
    const isOver = this.data.currentRound >= this.data.maxRounds;
    
    this.setData({
      tableCards: [],
      currentPlayer: winner,
      leadSuit: null,
      collectedCards: newCollected,
      rawScores: newRawScores,
      teamScores,
      teams,
      currentRound: this.data.currentRound + 1,
      gameState: isOver ? 'over' : 'playing',
      gameResult: isOver ? this.calculateFinalResult(teamScores) : null
    });
    
    if (!isOver && winner !== 0) {
      setTimeout(() => this.aiPlay(), 1000);
    }
  },

  cardRankValue(rank) {
    const values = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
    return values[rank];
  },

  // 判断队伍：猪和羊在谁手里
  determineTeams(collectedCards) {
    let pigOwner = null;
    let sheepOwner = null;
    
    for (let i = 0; i < 4; i++) {
      for (const card of collectedCards[i]) {
        if (card.id === '♠Q') pigOwner = i;
        if (card.id === '♦J') sheepOwner = i;
      }
    }
    
    // 如果还没收到猪或羊，返回null
    if (pigOwner === null || sheepOwner === null) return null;
    
    const teams = {};
    if (pigOwner === sheepOwner) {
      // 猪羊同一人，跟对家一队
      teams[pigOwner] = (pigOwner + 2) % 4;
      teams[(pigOwner + 2) % 4] = pigOwner;
      const other1 = (pigOwner + 1) % 4;
      const other2 = (pigOwner + 3) % 4;
      teams[other1] = other2;
      teams[other2] = other1;
    } else {
      // 猪羊不同人，这两人一队
      teams[pigOwner] = sheepOwner;
      teams[sheepOwner] = pigOwner;
      const other1 = [0,1,2,3].find(i => i !== pigOwner && i !== sheepOwner);
      const other2 = [0,1,2,3].find(i => i !== pigOwner && i !== sheepOwner && i !== other1);
      teams[other1] = other2;
      teams[other2] = other1;
    }
    
    return teams;
  },

  // 计算队伍分数
  calculateTeamScores(rawScores, teams) {
    if (!teams) return [...rawScores];
    
    const teamScores = [0, 0, 0, 0];
    const processed = new Set();
    
    for (let i = 0; i < 4; i++) {
      if (processed.has(i)) continue;
      const teammate = teams[i];
      const teamTotal = rawScores[i] + rawScores[teammate];
      const avgScore = Math.round(teamTotal / 2);
      teamScores[i] = avgScore;
      teamScores[teammate] = avgScore;
      processed.add(i);
      processed.add(teammate);
    }
    
    return teamScores;
  },

  // 计算本轮原始分
  calculateRoundScore(tableCards) {
    let score = 0;
    let hasTransformer = false;
    let hasPig = false;
    let hasSheep = false;
    let heartCards = [];
    
    for (const tc of tableCards) {
      const cardId = tc.card.id;
      if (cardId === '♣10') hasTransformer = true;
      if (cardId === '♠Q') hasPig = true;
      if (cardId === '♦J') hasSheep = true;
      if (tc.card.suit === '♥') heartCards.push(cardId);
    }
    
    // 大满贯检查
    const grandSlam = hasPig && hasSheep && heartCards.length === 13;
    
    for (const tc of tableCards) {
      const cardId = tc.card.id;
      if (cardId === '♣10') continue;
      
      if (grandSlam) {
        // 大满贯：猪变+100，羊+100，红桃+200
        if (cardId === '♠Q') score += 100;
        else if (cardId === '♦J') score += 100;
        else if (SCORE_CARDS[cardId]) score += Math.abs(SCORE_CARDS[cardId]);
      } else {
        if (SCORE_CARDS[cardId] !== undefined) {
          score += SCORE_CARDS[cardId];
        }
      }
    }
    
    // 满红（非大满贯情况）
    if (!grandSlam && heartCards.length === 13) {
      let heartScore = 0;
      for (const h of heartCards) {
        if (SCORE_CARDS[h]) heartScore += SCORE_CARDS[h];
      }
      score = score - heartScore + 200;
    }
    
    // 变压器
    if (hasTransformer) {
      if (score === 0) score = 50;
      else score *= 2;
    }
    
    return score;
  },

  calculateFinalResult(teamScores) {
    const playerScore = teamScores[0];
    const sorted = [...teamScores].sort((a, b) => b - a);
    const rank = sorted.indexOf(playerScore) + 1;
    
    return { playerScore, rank };
  },

  restart() {
    this.initGame();
    this.startGame();
  }
});
