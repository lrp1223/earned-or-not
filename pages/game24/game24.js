// pages/game24/game24.js
// 二十四点游戏
Page({
  data: {
    cards: [],
    expression: '',
    result: null,
    showHint: false,
    hint: ''
  },

  onLoad() {
    this.newGame();
  },

  newGame() {
    const cards = this.generateCards();
    const hint = this.findSolution(cards);
    this.setData({
      cards,
      expression: '',
      result: null,
      showHint: false,
      hint: hint || '暂无解法'
    });
  },

  generateCards() {
    const cards = [];
    for (let i = 0; i < 4; i++) {
      cards.push(Math.floor(Math.random() * 10) + 1);
    }
    if (!this.findSolution(cards)) {
      return this.generateCards();
    }
    return cards;
  },

  inputNum(e) {
    const val = e.currentTarget.dataset.val;
    this.setData({ expression: this.data.expression + val });
  },

  inputOp(e) {
    const op = e.currentTarget.dataset.op;
    this.setData({ expression: this.data.expression + op });
  },

  clear() {
    this.setData({ expression: '', result: null });
  },

  check() {
    const { expression, cards } = this.data;
    if (!expression) {
      wx.showToast({ title: '请输入算式', icon: 'none' });
      return;
    }

    const usedNums = (expression.match(/\d+/g) || []).map(Number).sort((a,b)=>a-b);
    const sortedCards = [...cards].sort((a,b)=>a-b);
    if (JSON.stringify(usedNums) !== JSON.stringify(sortedCards)) {
      wx.showToast({ title: '必须使用4个数字', icon: 'none' });
      return;
    }

    try {
      const result = this.calc(expression);
      this.setData({ result });

      if (Math.abs(result - 24) < 0.001) {
        wx.showModal({
          title: '🎉 答对了！',
          content: '24点达成！',
          showCancel: false,
          success: () => this.newGame()
        });
      } else {
        wx.showToast({ title: `结果是${result.toFixed(1)}`, icon: 'none' });
      }
    } catch (e) {
      wx.showToast({ title: '算式有误', icon: 'none' });
    }
  },

  calc(expr) {
    expr = expr.replace(/\s/g, '').replace(/\(-/g, '(0-');
    if (expr[0] === '-') expr = '0' + expr;
    const nums = [], ops = [];
    let i = 0;
    while (i < expr.length) {
      const c = expr[i];
      if (/\d/.test(c)) {
        let n = 0;
        while (i < expr.length && /\d/.test(expr[i])) {
          n = n * 10 + parseInt(expr[i++]);
        }
        nums.push(n);
        continue;
      }
      if (c === '(') ops.push(c);
      else if (c === ')') {
        while (ops.length && ops[ops.length-1] !== '(') this.compute(nums, ops);
        ops.pop();
      } else if ('+-*/'.includes(c)) {
        while (ops.length && this.prec(ops[ops.length-1]) >= this.prec(c)) {
          this.compute(nums, ops);
        }
        ops.push(c);
      }
      i++;
    }
    while (ops.length) this.compute(nums, ops);
    return nums[0];
  },

  prec(op) {
    return op === '+' || op === '-' ? 1 : op === '*' || op === '/' ? 2 : 0;
  },

  compute(nums, ops) {
    const b = nums.pop(), a = nums.pop(), op = ops.pop();
    nums.push(op === '+' ? a+b : op === '-' ? a-b : op === '*' ? a*b : a/b);
  },

  toggleHint() {
    this.setData({ showHint: !this.data.showHint });
  },

  findSolution(cards) {
    const ops = ['+', '-', '*', '/'];
    const perms = this.permute(cards);
    for (const p of perms) {
      for (const o1 of ops) for (const o2 of ops) for (const o3 of ops) {
        const patterns = [
          `(${p[0]}${o1}${p[1]})${o2}(${p[2]}${o3}${p[3]})`,
          `((${p[0]}${o1}${p[1]})${o2}${p[2]})${o3}${p[3]}`,
          `${p[0]}${o1}((${p[1]}${o2}${p[2]})${o3}${p[3]})`,
          `${p[0]}${o1}(${p[1]}${o2}(${p[2]}${o3}${p[3]}))`
        ];
        for (const expr of patterns) {
          try {
            if (Math.abs(this.calc(expr) - 24) < 0.001) return expr;
          } catch(e) {}
        }
      }
    }
    return null;
  },

  permute(arr) {
    if (arr.length <= 1) return [arr];
    const res = [];
    for (let i = 0; i < arr.length; i++) {
      const rest = [...arr.slice(0,i), ...arr.slice(i+1)];
      for (const p of this.permute(rest)) res.push([arr[i], ...p]);
    }
    return res;
  }
});
