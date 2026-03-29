const SUITS = ['♣', '♦', '♠', '♥'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SCORE_CARDS = {
  '♠Q': -100, '♦J': 100,
  '♥A': -50, '♥K': -40, '♥Q': -30, '♥J': -20,
  '♥10': -10, '♥9': -10, '♥8': -10, '♥7': -10, '♥6': -10, '♥5': -10, '♥4': -10, '♥3': -10, '♥2': -10
};

Page({
  data: {
    gameState: 'ready',
    currentPlayer: 0,
    currentRound: 1,
    tableCards: [],
    playerHand: [],
    aiHands: [[], [], []],
    rawScores: [0, 0, 0, 0], // 每个人亲手拿到的原始分
    displayScores: [0, 0, 0, 0], // 界面显示的即时分（不平均）
    teams: null,
    selectedCard: null,
    leadSuit: null,
    gameResult: null,
    collectedScoreCards: [[], [], [], []],
    pigPlayer: -1, // 记录谁打出了猪
    sheepPlayer: -1 // 记录谁打出了羊
  },

  onLoad() { this.initGame(); },

  initGame() {
    this.setData({
      gameState: 'ready', currentPlayer: 0, currentRound: 1,
      tableCards: [], playerHand: [], aiHands: [[], [], []],
      rawScores: [0, 0, 0, 0], displayScores: [0, 0, 0, 0],
      teams: null, selectedCard: null, leadSuit: null, gameResult: null,
      collectedScoreCards: [[], [], [], []],
      pigPlayer: -1, sheepPlayer: -1
    });
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
      teams: teams, // 后台存储，界面不体现
      tableCards: [], rawScores: [0, 0, 0, 0], displayScores: [0, 0, 0, 0],
      collectedScoreCards: [[], [], [], []]
    });

    if (this.data.currentPlayer !== 0) setTimeout(() => this.aiPlay(), 1000);
  },

  determineTeamsInitial(hands) {
    let pigOwner = -1, sheepOwner = -1;
    for (let i = 0; i < 4; i++) {
      if (hands[i].some(c => c.id === '♠Q')) pigOwner = i;
      if (hands[i].some(c => c.id === '♦J')) sheepOwner = i;
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

  createDeck() {
    const deck = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) deck.push({ suit, rank, id: `${suit}${rank}` });
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
      if (hands[i].some(c => c.suit === '♠' && c.rank === 'J')) return i;
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
    if (currentRound === 1 && tableCards.length === 0) return card.id === '♠J';
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
    
    // 追踪猪和羊被打出的记录
    let pigPlayer = this.data.pigPlayer;
    let sheepPlayer = this.data.sheepPlayer;
    if (card.id === '♠Q') pigPlayer = playerIndex;
    if (card.id === '♦J') sheepPlayer = playerIndex;

    this.setData({ tableCards, playerHand, aiHands, leadSuit, selectedCard: null, pigPlayer, sheepPlayer });
    
    if (tableCards.length === 4) {
      setTimeout(() => this.endRound(), 1500);
    } else {
      const nextPlayer = playerIndex === 0 ? 3 : playerIndex === 3 ? 2 : playerIndex === 2 ? 1 : 0;
      this.setData({ currentPlayer: nextPlayer });
      if (nextPlayer !== 0) setTimeout(() => this.aiPlay(), 800);
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
    const { tableCards, leadSuit, rawScores, collectedScoreCards, currentRound } = this.data;
    let winner = tableCards[0].player;
    let maxRank = this.cardRankValue(tableCards[0].card.rank);
    for (let i = 1; i < 4; i++) {
      if (tableCards[i].card.suit === leadSuit) {
        const val = this.cardRankValue(tableCards[i].card.rank);
        if (val > maxRank) { maxRank = val; winner = tableCards[i].player; }
      }
    }
    
    // 找出本轮中的得分牌
    const roundScoreCards = tableCards.filter(tc => SCORE_CARDS[tc.card.id] || tc.card.id === '♣10').map(tc => tc.card);
    const newCollected = [...collectedScoreCards];
    newCollected[winner] = [...newCollected[winner], ...roundScoreCards];
    
    // 计算本轮原始得分
    let roundRaw = 0;
    let has10 = false;
    tableCards.forEach(tc => {
      if (tc.card.id === '♣10') has10 = true;
      if (SCORE_CARDS[tc.card.id]) roundRaw += SCORE_CARDS[tc.card.id];
    });

    const newRawScores = [...rawScores];
    newRawScores[winner] += roundRaw;
    // 变压器倍率暂时简单处理：这一轮谁拿了10，谁的本轮得分就受影响
    // 注意：真实规则变压器是最后结算，这里为了即时反馈做简化显示
    
    const isOver = currentRound >= 13;
    let finalTeamScores = [0,0,0,0];
    if (isOver) {
      finalTeamScores = this.calculateFinalAverage(newRawScores);
    }

    this.setData({
      tableCards: [], currentPlayer: winner, leadSuit: null,
      collectedScoreCards: newCollected,
      rawScores: newRawScores,
      displayScores: newRawScores, // 即时显示原始分
      currentRound: currentRound + 1,
      gameState: isOver ? 'over' : 'playing',
      gameResult: isOver ? { playerScore: finalTeamScores[0], rank: this.calcRank(finalTeamScores) } : null
    });
    
    if (!isOver && winner !== 0) setTimeout(() => this.aiPlay(), 800);
  },

  calculateFinalAverage(rawScores) {
    const teams = this.data.teams;
    const final = [0,0,0,0];
    const processed = new Set();
    for (let i = 0; i < 4; i++) {
      if (processed.has(i)) continue;
      const mate = teams[i];
      const avg = Math.round((rawScores[i] + rawScores[mate]) / 2);
      final[i] = final[mate] = avg;
      processed.add(i); processed.add(mate);
    }
    return final;
  },

  cardRankValue(rank) {
    const values = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
    return values[rank];
  },

  calcRank(scores) {
    const my = scores[0];
    const sorted = [...scores].sort((a,b) => b-a);
    return sorted.indexOf(my) + 1;
  },

  restart() { this.initGame(); }
});
