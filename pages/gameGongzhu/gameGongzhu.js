const SUITS = ['C', 'D', 'S', 'H']; // 梅花, 方片, 黑桃, 红桃
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUIT_MAP = { 'S': '♠', 'H': '♥', 'C': '♣', 'D': '♦' };

// 内部逻辑全部改用英文 key
const SCORE_CARDS = {
  'SQ': -100, // 猪
  'DJ': 100,  // 羊
  'HA': -50, 'HK': -40, 'HQ': -30, 'HJ': -20,
  'H10': -10, 'H9': -10, 'H8': -10, 'H7': -10, 'H6': -10, 'H5': -10, 'H4': -10, 'H3': -10, 'H2': -10
};

Page({
  data: {
    suitMap: SUIT_MAP, // 传给 wxml 使用
    gameState: 'ready',
    currentPlayer: 0,
    currentRound: 1,
    tableCards: [],
    playerHand: [],
    aiHands: [[], [], []],
    rawScores: [0, 0, 0, 0],
    displayScores: [0, 0, 0, 0],
    teams: null,
    selectedCard: null,
    leadSuit: null,
    gameResult: null,
    collectedScoreCards: [[], [], [], []],
    pigPlayer: -1,
    sheepPlayer: -1,
    totalScores: [0, 0, 0, 0],
    gameCount: 0
  },

  onLoad() { this.initGame(); },

  initGame() {
    this.setData({
      gameState: 'ready', currentPlayer: 0, currentRound: 1,
      tableCards: [], playerHand: [], aiHands: [[], [], []],
      rawScores: [0, 0, 0, 0], displayScores: [0, 0, 0, 0],
      teams: null, selectedCard: null, leadSuit: null, gameResult: null,
      collectedScoreCards: [[], [], [], []],
      pigPlayer: -1, sheepPlayer: -1,
      totalScores: [0, 0, 0, 0], gameCount: 0
    });
  },

  createDeck() {
    const deck = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        // id 统一格式：SQ, DJ, C10
        deck.push({ suit, rank, id: `${suit}${rank}` });
      }
    }
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  },

  startGame() {
    const deck = this.createDeck();
    const hands = this.dealCards(deck);
    const teams = this.determineTeamsInitial(hands);
    
    this.setData({
      gameState: 'playing',
      playerHand: hands[0].sort((a, b) => this.cardSortValue(a) - this.cardSortValue(b)),
      aiHands: [hands[1], hands[2], hands[3]],
      currentPlayer: this.findFirstPlayer(hands),
      teams: teams,
      tableCards: [], rawScores: [0, 0, 0, 0], displayScores: [0, 0, 0, 0],
      collectedScoreCards: [[], [], [], []],
      pigPlayer: -1, sheepPlayer: -1,
      gameCount: this.data.gameCount + 1
    });

    if (this.data.currentPlayer !== 0) setTimeout(() => this.aiPlay(), 1000);
  },

  determineTeamsInitial(hands) {
    let pigOwner = -1, sheepOwner = -1;
    for (let i = 0; i < 4; i++) {
      if (hands[i].some(c => c.id === 'SQ')) pigOwner = i;
      if (hands[i].some(c => c.id === 'DJ')) sheepOwner = i;
    }
    const teams = {};
    if (pigOwner === sheepOwner) {
      teams[pigOwner] = (pigOwner + 2) % 4; teams[(pigOwner + 2) % 4] = pigOwner;
      const o1 = (pigOwner + 1) % 4, o2 = (pigOwner + 3) % 4;
      teams[o1] = o2; teams[o2] = o1;
    } else {
      teams[pigOwner] = sheepOwner; teams[sheepOwner] = pigOwner;
      const others = [0,1,2,3].filter(i => i !== pigOwner && i !== sheepOwner);
      teams[others[0]] = others[1]; teams[others[1]] = others[0];
    }
    return teams;
  },

  dealCards(deck) {
    const hands = [[], [], [], []];
    for (let i = 0; i < 52; i++) hands[i % 4].push(deck[i]);
    return hands;
  },

  findFirstPlayer(hands) {
    // 黑桃 J 先出
    for (let i = 0; i < 4; i++) {
      if (hands[i].some(c => c.id === 'SJ')) return i;
    }
    return 0;
  },

  cardSortValue(card) {
    const suitOrder = { 'S': 0, 'C': 1, 'D': 2, 'H': 3 };
    const rankOrder = { 'A': 12, 'K': 11, 'Q': 10, 'J': 9, '10': 8, '9': 7, '8': 6, '7': 5, '6': 4, '5': 3, '4': 2, '3': 1, '2': 0 };
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
    // 第 1 轮第 1 张强制黑桃 J
    if (currentRound === 1 && tableCards.length === 0) return card.id === 'SJ';
    if (tableCards.length === 0) return true;
    if (card.suit === leadSuit) return true;
    return !hand.some(c => c.suit === leadSuit);
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
    
    let pigPlayer = this.data.pigPlayer;
    let sheepPlayer = this.data.sheepPlayer;
    if (card.id === 'SQ') pigPlayer = playerIndex;
    if (card.id === 'DJ') sheepPlayer = playerIndex;

    this.setData({ tableCards, playerHand, aiHands, leadSuit, selectedCard: null, pigPlayer, sheepPlayer });
    
    if (tableCards.length === 4) {
      setTimeout(() => this.endRound(), 1500);
    } else {
      // 这里的 3, 2, 1 对应下家、对家、上家
      const nextPlayer = playerIndex === 0 ? 3 : playerIndex === 3 ? 2 : playerIndex === 2 ? 1 : 0;
      this.setData({ currentPlayer: nextPlayer });
      if (nextPlayer !== 0) setTimeout(() => this.aiPlay(), 800);
    }
  },

  aiPlay() {
    const playerIndex = this.data.currentPlayer;
    const hand = this.data.aiHands[playerIndex - 1];
    const { tableCards, displayScores } = this.data;
    const validCards = hand.filter(c => this.isValidPlay(c, hand));
    let card = null;

    if (tableCards.length === 0) {
      // 首家策略
      const hasSheep = hand.some(c => c.id === 'DJ');
      if (hasSheep && hand.filter(c => c.suit === 'D').length > 3) {
        card = hand.find(c => c.id === 'DA') || hand.find(c => c.id === 'DK') || hand.find(c => c.id === 'DJ');
      }
      if (!card) {
        const safeCards = validCards.filter(c => !SCORE_CARDS[c.id] && c.id !== 'C10');
        if (safeCards.length > 0) {
          card = safeCards.sort((a,b) => this.cardRankValue(a.rank) - this.cardRankValue(b.rank))[0];
        }
      }
    } else {
      // 跟牌策略
      const hasPig = tableCards.some(tc => tc.card.id === 'SQ');
      const hasSheepOnTable = tableCards.some(tc => tc.card.id === 'DJ');
      let wantToWin = false;
      if (hasSheepOnTable) wantToWin = true;
      if (displayScores[playerIndex] > 0 && tableCards.some(tc => tc.card.id === 'C10')) wantToWin = true;
      
      if (wantToWin) {
        card = validCards.sort((a,b) => this.cardRankValue(b.rank) - this.cardRankValue(a.rank))[0];
      } else if (hasPig || tableCards.some(tc => tc.card.suit === 'H')) {
        const trouble = validCards.find(c => c.id === 'SQ' || c.id === 'C10');
        card = trouble || validCards.sort((a,b) => this.cardRankValue(a.rank) - this.cardRankValue(b.rank))[0];
      }
    }
    if (!card) card = validCards[Math.floor(Math.random() * validCards.length)];
    this.playCard(playerIndex, card);
  },

  endRound() {
    const { tableCards, leadSuit, rawScores, collectedScoreCards, currentRound, totalScores } = this.data;
    let winner = tableCards[0].player;
    let maxRank = this.cardRankValue(tableCards[0].card.rank);
    for (let i = 1; i < 4; i++) {
      if (tableCards[i].card.suit === leadSuit) {
        const val = this.cardRankValue(tableCards[i].card.rank);
        if (val > maxRank) { maxRank = val; winner = tableCards[i].player; }
      }
    }
    
    // 找出得分牌 + C10 + 所有红桃
    const roundScoreCards = tableCards.filter(tc => SCORE_CARDS[tc.card.id] || tc.card.id === 'C10' || tc.card.suit === 'H').map(tc => tc.card);
    const newCollected = [...collectedScoreCards];
    newCollected[winner] = [...newCollected[winner], ...roundScoreCards];
    
    let roundRaw = 0;
    tableCards.forEach(tc => {
      if (SCORE_CARDS[tc.card.id]) roundRaw += SCORE_CARDS[tc.card.id];
    });

    const newRawScores = [...rawScores];
    newRawScores[winner] += roundRaw;
    
    const isOver = currentRound >= 13;
    let finalThisGameScores = [0,0,0,0];
    let newTotalScores = [...totalScores];

    if (isOver) {
      finalThisGameScores = this.calculateFinalAverage(newRawScores, newCollected);
      for (let i = 0; i < 4; i++) newTotalScores[i] += finalThisGameScores[i];
    }

    // 构建排序后的排行榜（按总分从高到低）
    const sortedRank = isOver ? 
      [0, 1, 2, 3]
        .map(idx => ({ idx, total: newTotalScores[idx], thisGame: finalThisGameScores[idx] }))
        .sort((a, b) => b.total - a.total)
      : [];

    this.setData({
      tableCards: [], currentPlayer: winner, leadSuit: null,
      collectedScoreCards: newCollected,
      rawScores: newRawScores,
      displayScores: newRawScores,
      currentRound: currentRound + 1,
      totalScores: newTotalScores,
      gameState: isOver ? 'over' : 'playing',
      gameResult: isOver ? { 
        thisGameScores: finalThisGameScores,
        sortedRank: sortedRank
      } : null
    });
    
    if (!isOver && winner !== 0) setTimeout(() => this.aiPlay(), 800);
  },

  calculateFinalAverage(rawScores, collected) {
    const teams = this.data.teams;
    const final = [0,0,0,0];
    const processed = new Set();
    const optimizedScores = rawScores.map((score, idx) => {
      const myCollected = collected[idx];
      const hearts = myCollected.filter(c => c.suit === 'H');
      let finalS = score;
      // 全红逻辑：收齐 13 张红桃，额外 +400 分
      if (hearts.length === 13) finalS += 400;
      // 变压器逻辑：C10 本身值 +50 分，且使所有分数翻倍
      if (myCollected.some(c => c.id === 'C10')) {
        finalS += 50;      // C10 基础分
        finalS *= 2;       // 翻倍
      }
      return finalS;
    });

    for (let i = 0; i < 4; i++) {
      if (processed.has(i)) continue;
      const mate = teams[i];
      const avg = Math.round((optimizedScores[i] + optimizedScores[mate]) / 2);
      final[i] = final[mate] = avg;
      processed.add(i); processed.add(mate);
    }
    return final;
  },

  cardRankValue(rank) {
    const values = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
    return values[rank];
  },

  nextGame() { this.startGame(); },
  restart() { this.initGame(); }
});
