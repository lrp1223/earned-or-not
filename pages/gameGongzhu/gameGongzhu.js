const SUITS = ['♣', '♦', '♠', '♥'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SCORE_CARDS = {
  '♠Q': -100, // 猪
  '♦J': 100,  // 羊
  '♥A': -50, '♥K': -40, '♥Q': -30, '♥J': -20,
  '♥10': -10, '♥9': -10, '♥8': -10, '♥7': -10, '♥6': -10, '♥5': -10, '♥4': -10, '♥3': -10, '♥2': -10
};

Page({
  data: {
    gameState: 'ready', // ready, playing, over
    currentPlayer: 0, // 0: 你, 1: 上家, 2: 对家, 3: 下家
    currentRound: 1,
    tableCards: [], // {player, card}
    playerHand: [],
    aiHands: [[], [], []],
    rawScores: [0, 0, 0, 0], // 每个人的独立得分
    teamScores: [0, 0, 0, 0], // 队伍平摊后的显示分
    teams: null, // {0: 2, 2: 0, 1: 3, 3: 1} 这种格式
    selectedCard: null,
    leadSuit: null,
    gameResult: null,
    collectedCards: [[], [], [], []]
  },

  onLoad() {
    this.initGame();
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
    
    // 起手定队逻辑：猪(♠Q)和羊(♦J)在哪个人手里，这决定了这一局谁跟谁是一伙的
    const teams = this.determineTeamsInitial(hands);
    
    this.setData({
      gameState: 'playing',
      playerHand: hands[0].sort((a, b) => this.cardSortValue(a) - this.cardSortValue(b)),
      aiHands: [hands[1], hands[2], hands[3]],
      currentPlayer: this.findFirstPlayer(hands),
      tableCards: [],
      rawScores: [0, 0, 0, 0],
      teamScores: [0, 0, 0, 0],
      teams: teams,
      collectedCards: [[], [], [], []]
    });

    if (this.data.currentPlayer !== 0) {
      setTimeout(() => this.aiPlay(), 1000);
    }
  },

  determineTeamsInitial(hands) {
    let pigOwner = -1;
    let sheepOwner = -1;
    for (let i = 0; i < 4; i++) {
      if (hands[i].some(c => c.suit === '♠' && c.rank === 'Q')) pigOwner = i;
      if (hands[i].some(c => c.suit === '♦' && c.rank === 'J')) sheepOwner = i;
    }
    
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
      const others = [0, 1, 2, 3].filter(i => i !== pigOwner && i !== sheepOwner);
      teams[others[0]] = others[1];
      teams[others[1]] = others[0];
    }
    return teams;
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
    // ♠J先出
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
    if (currentRound === 1 && tableCards.length === 0) return card.suit === '♠' && card.rank === 'J';
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
    this.setData({ tableCards, playerHand, aiHands, leadSuit, selectedCard: null });
    
    if (tableCards.length === 4) {
      setTimeout(() => this.endRound(), 1500);
    } else {
      // 顺时针顺序：你(0) -> 下家(3) -> 对家(2) -> 上家(1)
      const nextPlayer = playerIndex === 0 ? 3 : playerIndex === 3 ? 2 : playerIndex === 2 ? 1 : 0;
      this.setData({ currentPlayer: nextPlayer });
      if (nextPlayer !== 0) setTimeout(() => this.aiPlay(), 1000);
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
    const { tableCards, leadSuit, collectedCards, rawScores, teams } = this.data;
    let winner = tableCards[0].player;
    let maxRank = this.cardRankValue(tableCards[0].card.rank);
    for (let i = 1; i < 4; i++) {
      if (tableCards[i].card.suit === leadSuit) {
        const val = this.cardRankValue(tableCards[i].card.rank);
        if (val > maxRank) { maxRank = val; winner = tableCards[i].player; }
      }
    }
    
    const newCollected = [...collectedCards];
    for (const tc of tableCards) newCollected[winner].push(tc.card);
    
    const roundRawScore = this.calculateRoundScore(tableCards);
    const newRawScores = [...rawScores];
    newRawScores[winner] += roundRawScore;
    
    const teamScores = this.calculateTeamScores(newRawScores, teams);
    const isOver = this.data.currentRound >= 13;
    
    this.setData({
      tableCards: [], currentPlayer: winner, leadSuit: null,
      collectedCards: newCollected, rawScores: newRawScores, teamScores,
      currentRound: this.data.currentRound + 1,
      gameState: isOver ? 'over' : 'playing',
      gameResult: isOver ? { playerScore: teamScores[0], rank: this.calcRank(teamScores) } : null
    });
    
    if (!isOver && winner !== 0) setTimeout(() => this.aiPlay(), 1000);
  },

  cardRankValue(rank) {
    const values = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
    return values[rank];
  },

  calculateTeamScores(rawScores, teams) {
    if (!teams) return [...rawScores];
    const teamScores = [0, 0, 0, 0];
    const processed = new Set();
    for (let i = 0; i < 4; i++) {
      if (processed.has(i)) continue;
      const mate = teams[i];
      const avg = Math.round((rawScores[i] + rawScores[mate]) / 2);
      teamScores[i] = teamScores[mate] = avg;
      processed.add(i); processed.add(mate);
    }
    return teamScores;
  },

  calculateRoundScore(tableCards) {
    let score = 0;
    let hasTransformer = false, hasPig = false, hasSheep = false, heartCount = 0;
    for (const tc of tableCards) {
      if (tc.card.id === '♣10') hasTransformer = true;
      if (tc.card.id === '♠Q') hasPig = true;
      if (tc.card.id === '♦J') hasSheep = true;
      if (tc.card.suit === '♥') heartCount++;
      if (SCORE_CARDS[tc.card.id]) score += SCORE_CARDS[tc.card.id];
    }
    // 简化处理特殊加分（满红和大满贯等逻辑可后续细化，目前按基础规则）
    if (hasTransformer) score = (score === 0) ? 50 : score * 2;
    return score;
  },

  calcRank(scores) {
    const my = scores[0];
    const sorted = [...scores].sort((a,b) => b-a);
    return sorted.indexOf(my) + 1;
  },

  restart() {
    this.initGame();
  }
});
