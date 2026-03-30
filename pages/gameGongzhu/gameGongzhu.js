const SUITS = ['♣', '♦', '♠', '♥'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SCORE_CARDS = {
  '♠Q': -100, '♦J': 100,
  '♥A': -50, '♥K': -40, '♥Q': -30, '♥J': -20,
  '♥10': -10, '♥9': -10, '♥8': -10, '♥7': -10, '♥6': -10, '♥5': -10
  // 红桃 2、3、4 没有分数
};

Page({
  data: {
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
    totalScores: [0, 0, 0, 0], // 累计总分
    gameCount: 0 // 已玩局数
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

  startGame() {
    const deck = this.createDeck();
    const hands = this.dealCards(deck);
    const teams = this.determineTeamsInitial(hands);
    const firstPlayer = this.findFirstPlayer(hands);
    
    this.setData({
      gameState: 'playing',
      currentRound: 1,
      playerHand: hands[0].sort((a, b) => this.cardSortValue(a) - this.cardSortValue(b)),
      aiHands: [hands[1], hands[2], hands[3]],
      currentPlayer: firstPlayer,
      teams: teams,
      tableCards: [], rawScores: [0, 0, 0, 0], displayScores: [0, 0, 0, 0],
      collectedScoreCards: [[], [], [], []],
      pigPlayer: -1, sheepPlayer: -1,
      gameCount: this.data.gameCount + 1
    });

    if (firstPlayer !== 0) setTimeout(() => this.aiPlay(), 1000);
  },

  nextGame() {
    this.startGame();
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
    const { tableCards, displayScores } = this.data;
    const validCards = hand.filter(c => this.isValidPlay(c, hand));
    let card = null;

    if (tableCards.length === 0) {
      const hasSheep = hand.some(c => c.id === '♦J');
      const diamonds = hand.filter(c => c.suit === '♦');
      if (hasSheep && diamonds.length > 3) {
        card = hand.find(c => c.id === '♦A') || hand.find(c => c.id === '♦K') || hand.find(c => c.id === '♦J');
      }
      if (!card) {
        const safeCards = validCards.filter(c => !SCORE_CARDS[c.id] && c.id !== '♣10');
        if (safeCards.length > 0) {
          card = safeCards.sort((a,b) => this.cardRankValue(a.rank) - this.cardRankValue(b.rank))[0];
        }
      }
    } else {
      const hasPig = tableCards.some(tc => tc.card.id === '♠Q');
      const hasSheepOnTable = tableCards.some(tc => tc.card.id === '♦J');
      let wantToWin = false;
      if (hasSheepOnTable) wantToWin = true;
      if (displayScores[playerIndex] > 0 && tableCards.some(tc => tc.card.id === '♣10')) wantToWin = true;
      
      if (wantToWin) {
        card = validCards.sort((a,b) => this.cardRankValue(b.rank) - this.cardRankValue(a.rank))[0];
      } else if (hasPig || tableCards.some(tc => SCORE_CARDS[tc.card.id])) {
        const trouble = validCards.find(c => c.id === '♠Q' || c.id === '♣10');
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
    
    const roundScoreCards = tableCards.filter(tc => SCORE_CARDS[tc.card.id] || tc.card.id === '♣10').map(tc => tc.card);
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
      finalThisGameScores = this.calculateFinalAverage(newRawScores);
      for (let i = 0; i < 4; i++) newTotalScores[i] += finalThisGameScores[i];
    }
    
    // 生成排序后的玩家列表（从高分到低分）
    let sortedPlayers = [0, 1, 2, 3].map(idx => ({
      idx,
      name: idx === 0 ? '😀 你' : (idx === 1 ? '上家' : (idx === 2 ? '对家' : '下家')),
      thisGameScore: finalThisGameScores[idx],
      totalScore: newTotalScores[idx],
      isTeammate: teams[0] === idx && idx !== 0  // 0 是玩家自己，其他与 0 同队的是队友
    }));
    sortedPlayers.sort((a, b) => b.thisGameScore - a.thisGameScore);

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
        sortedPlayers: sortedPlayers
      } : null
    });
    
    if (!isOver && winner !== 0) setTimeout(() => this.aiPlay(), 800);
  },

  calculateFinalAverage(rawScores) {
    const teams = this.data.teams;
    const final = [0,0,0,0];
    const processed = new Set();
    
    // 定义什么是"有分数牌"（红桃 5-A、黑桃 Q、方片 J）
    const hasScoreCards = (collected) => {
      return collected.some(c => {
        if (c.id === '♠Q' || c.id === '♦J') return true;
        if (c.suit === '♥' && ['5','6','7','8','9','10','J','Q','K','A'].includes(c.rank)) return true;
        return false;
      });
    };
    
    // 直接从 collectedScoreCards 计算原始分数，不依赖 rawScores
    const rawFromCollected = this.data.collectedScoreCards.map(collected => {
      let score = 0;
      for (const card of collected) {
        if (SCORE_CARDS[card.id]) {
          score += SCORE_CARDS[card.id];
        }
      }
      return score;
    });
    
    const optimizedScores = rawFromCollected.map((score, idx) => {
      const myCollected = this.data.collectedScoreCards[idx];
      const hearts = myCollected.filter(c => c.suit === '♥');
      let finalS = score;
      if (hearts.length === 13) finalS = score + 400; // 全红收牌
      // 变压器逻辑：只有真正有分数牌时才生效
      if (myCollected.some(c => c.id === '♣10')) {
        if (hasScoreCards(myCollected)) {
          finalS *= 2; // 有分数牌，double
        }
        // 如果只有红桃 2/3/4，分数保持 0，不 +50
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

  restart() { this.initGame(); }
});
