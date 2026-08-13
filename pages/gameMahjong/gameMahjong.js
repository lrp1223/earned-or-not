// pages/gameMahjong/gameMahjong.js
// 麻将推推消 - 推动牌到同行/列，相同数字相邻自动消除

const ROWS = 10;
const COLS = 10;
const TOTAL = ROWS * COLS;
// 10种牌面，用麻将emoji
const TILE_CHARS = ['🀇','🀈','🀉','🀊','🀋','🀌','🀍','🀎','🀏','🀐'];

// 方向向量: 0=上,1=右,2=下,3=左
const DR = [-1, 0, 1, 0];
const DC = [0, 1, 0, -1];

function deepCopyGrid(grid) {
  var copy = [];
  for (var r = 0; r < ROWS; r++) {
    copy.push(grid[r].slice());
  }
  return copy;
}

Page({
  data: {
    grid: [],          // 二维数组，0=空, 1-10=牌
    gridChars: [],     // 二维数组，''=空, emoji=牌面
    selected: null,    // {row, col}
    remaining: 0,
    total: 0,
    level: 1,
    moves: 0,
    score: 0,
    shufflesLeft: 3,
    animating: false
  },

  onLoad() {
    this.startLevel(1);
  },

  backToFun() {
    wx.navigateBack({
      fail() { wx.switchTab({ url: '/pages/fun/fun' }); }
    });
  },

  startLevel(level) {
    var result = this._generateGrid();
    this.setData({
      grid: result.grid,
      gridChars: result.gridChars,
      selected: null,
      remaining: result.remaining,
      total: result.remaining,
      level: level,
      moves: 0,
      shufflesLeft: 3,
      animating: false
    });
  },

  _generateGrid() {
    // 生成数字网格 (0=空, 1-10=牌)
    var grid = [];
    for (var r = 0; r < ROWS; r++) {
      grid.push(new Array(COLS).fill(0));
    }
    // 10种数字，每种8个 = 80个牌，留20个空格
    var pool = [];
    for (var n = 1; n <= 10; n++) {
      for (var i = 0; i < 8; i++) pool.push(n);
    }
    // 洗牌
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    // 随机位置
    var positions = [];
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) positions.push([r, c]);
    }
    for (var i = positions.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = positions[i]; positions[i] = positions[j]; positions[j] = tmp;
    }
    for (var i = 0; i < pool.length; i++) {
      grid[positions[i][0]][positions[i][1]] = pool[i];
    }
    return this._buildGridData(grid);
  },

  _buildGridData(grid) {
    var gridChars = [];
    var remaining = 0;
    for (var r = 0; r < ROWS; r++) {
      var rowChars = [];
      for (var c = 0; c < COLS; c++) {
        var v = grid[r][c];
        if (v > 0) {
          rowChars.push(TILE_CHARS[v - 1]);
          remaining++;
        } else {
          rowChars.push('');
        }
      }
      gridChars.push(rowChars);
    }
    return { grid: grid, gridChars: gridChars, remaining: remaining };
  },

  _updateChars(grid) {
    var gridChars = [];
    var remaining = 0;
    for (var r = 0; r < ROWS; r++) {
      var rowChars = [];
      for (var c = 0; c < COLS; c++) {
        var v = grid[r][c];
        if (v > 0) {
          rowChars.push(TILE_CHARS[v - 1]);
          remaining++;
        } else {
          rowChars.push('');
        }
      }
      gridChars.push(rowChars);
    }
    return { gridChars: gridChars, remaining: remaining };
  },

  onTileTap(e) {
    if (this.data.animating) return;
    var row = e.currentTarget.dataset.row;
    var col = e.currentTarget.dataset.col;
    if (this.data.grid[row][col] === 0) {
      this.setData({ selected: null });
      return;
    }
    var sel = this.data.selected;
    if (sel && sel.row === row && sel.col === col) {
      this.setData({ selected: null });
      return;
    }
    this.setData({ selected: { row: row, col: col } });
  },

  onDirectionTap(e) {
    if (this.data.animating) return;
    var dir = parseInt(e.currentTarget.dataset.dir);
    var sel = this.data.selected;
    if (sel === null) return;

    var grid = deepCopyGrid(this.data.grid);
    var sr = sel.row, sc = sel.col;
    var dr = DR[dir], dc = DC[dir];

    // 找从选中牌沿方向的连续牌组
    var group = [{ r: sr, c: sc }];
    var cr = sr + dr, cc = sc + dc;
    while (cr >= 0 && cr < ROWS && cc >= 0 && cc < COLS && grid[cr][cc] !== 0) {
      group.push({ r: cr, c: cc });
      cr += dr;
      cc += dc;
    }

    // 前方必须在网格内且为空才能推动
    var endR = cr, endC = cc;
    if (endR < 0 || endR >= ROWS || endC < 0 || endC >= COLS) {
      this.setData({ selected: null });
      return;
    }

    // 从尾到头依次移动
    for (var i = group.length - 1; i >= 0; i--) {
      var newR = (i === group.length - 1) ? endR : group[i].r + dr;
      var newC = (i === group.length - 1) ? endC : group[i].c + dc;
      grid[newR][newC] = grid[group[i].r][group[i].c];
      grid[group[i].r][group[i].c] = 0;
    }

    // 消除相邻同数字
    this.setData({ animating: true });
    var eliminated = this._eliminate(grid);
    var score = this.data.score + eliminated * 10;
    var charsData = this._updateChars(grid);

    var self = this;
    setTimeout(function () {
      self.setData({
        grid: grid,
        gridChars: charsData.gridChars,
        selected: null,
        remaining: charsData.remaining,
        moves: self.data.moves + 1,
        score: score,
        animating: false
      });
      if (charsData.remaining === 0) {
        wx.showToast({ title: '通关！', icon: 'success' });
        setTimeout(function () { self.startLevel(self.data.level + 1); }, 1500);
      }
    }, 350);
  },

  _eliminate(grid) {
    var toRemove = {};
    var count = 0;
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        if (grid[r][c] === 0) continue;
        var val = grid[r][c];
        if (c + 1 < COLS && grid[r][c + 1] === val) {
          toRemove[r * COLS + c] = true;
          toRemove[r * COLS + c + 1] = true;
        }
        if (r + 1 < ROWS && grid[r + 1][c] === val) {
          toRemove[r * COLS + c] = true;
          toRemove[(r + 1) * COLS + c] = true;
        }
      }
    }
    for (var k in toRemove) {
      var r = Math.floor(k / COLS);
      var c = k % COLS;
      grid[r][c] = 0;
      count++;
    }
    return count;
  },

  onShuffle() {
    if (this.data.shufflesLeft <= 0) {
      wx.showToast({ title: '重排次数用完', icon: 'none' });
      return;
    }
    var grid = deepCopyGrid(this.data.grid);
    var tiles = [];
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        if (grid[r][c] !== 0) tiles.push(grid[r][c]);
      }
    }
    for (var i = tiles.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = tiles[i]; tiles[i] = tiles[j]; tiles[j] = tmp;
    }
    var idx = 0;
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        if (grid[r][c] !== 0) grid[r][c] = tiles[idx++];
      }
    }
    var charsData = this._updateChars(grid);
    this.setData({
      grid: grid,
      gridChars: charsData.gridChars,
      selected: null,
      shufflesLeft: this.data.shufflesLeft - 1
    });
  }
});
