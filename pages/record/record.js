// pages/record/record.js
const api = require('../../utils/api');

Page({
  data: {
    type: '',
    typeText: '',
    cost: '',
    winAmount: '',
    remark: '',
    recordDate: '',
    today: '',
    mahjongType: 'win',
    previewNet: 0,
    previewNetStr: '+0.00',
    mode: 'add',
    recordId: '',
    submitting: false,
    lotteryTypes: ['18M', '10M', '8K', '7S', 'P5', '其他'],
    lotteryTypeIndex: 0,
    lotteryType: '18M'
  },

  onLoad(options) {
    this.loadColorSettings();

    const type = options.type || 'lottery';
    const mode = options.mode || 'add';
    const map = { lottery: '彩', scratch: '刮', mahjong: '麻' };
    const remarkPlaceholder = {
      lottery: '例如：追加投注、复式...',
      scratch: '例如：好运十倍、点球大战...',
      mahjong: '例如：跟大饼打麻将赢了100'
    };

    const defaultLotteryType = this.getDefaultLotteryType();
    const lotteryTypeIndex = this.data.lotteryTypes.indexOf(defaultLotteryType);

    this.setData({
      type,
      typeText: map[type],
      remarkPlaceholder: remarkPlaceholder[type],
      mode,
      recordId: options.id || '',
      lotteryTypeIndex: lotteryTypeIndex >= 0 ? lotteryTypeIndex : 0,
      lotteryType: defaultLotteryType,
      recordDate: this.formatDate(new Date()),
      today: this.formatDate(new Date())
    });

    // 不再自动填充上次中奖金额
    if (mode === 'edit' && options.id) {
      this.loadRecord(options.id);
    }
  },

  loadColorSettings() {
    const settings = wx.getStorageSync('userSettings') || {};
    const winColor = settings.winColor || '#52c41a';
    const loseColor = settings.loseColor || '#ff4d4f';
    const winBgColor = winColor + '15';
    const loseBgColor = loseColor + '15';
    this.setData({ winColor, loseColor, winBgColor, loseBgColor });
  },

  getDefaultLotteryType() {
    const day = new Date().getDay();
    if (day === 1 || day === 3 || day === 5) {
      return '10M';
    }
    return '18M';
  },

  formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  onDateChange(e) {
    this.setData({ recordDate: e.detail.value });
  },

  onLotteryTypeChange(e) {
    const index = parseInt(e.detail.value);
    const lotteryType = this.data.lotteryTypes[index];
    this.setData({
      lotteryTypeIndex: index,
      lotteryType
    });
    this.calc();
  },

  loadRecord(id) {
    api.getRecord(id).then(res => {
      const data = res.data;
      if (data) {
        const cost = data.cost ? Math.abs(data.cost).toString() : '';
        const winAmount = data.winAmount && data.winAmount > 0 ? data.winAmount.toString() : '';

        const updateData = {
          cost,
          winAmount,
          remark: data.remark || ''
        };

        if (data.createTime) {
          updateData.recordDate = this.formatDate(new Date(data.createTime));
        }

        if (data.recordType === 'LOTTERY' && data.lotteryType) {
          const index = this.data.lotteryTypes.indexOf(data.lotteryType);
          if (index >= 0) {
            updateData.lotteryTypeIndex = index;
            updateData.lotteryType = data.lotteryType;
          }
        }

        if (data.recordType === 'MAHJONG') {
          updateData.mahjongType = data.amount >= 0 ? 'win' : 'lose';
        }

        this.setData(updateData);
        this.calc();
      }
    });
  },

  onCostInput(e) {
    this.setData({ cost: e.detail.value });
    this.calc();
  },

  onWinInput(e) {
    this.setData({ winAmount: e.detail.value });
    this.calc();
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value });
  },

  setMahjongType(e) {
    this.setData({ mahjongType: e.currentTarget.dataset.type });
    this.calc();
  },

  calc() {
    const { type, cost, winAmount, mahjongType } = this.data;
    let net = 0;
    if (type === 'mahjong') {
      net = (parseFloat(cost) || 0) * (mahjongType === 'win' ? 1 : -1);
    } else {
      net = (parseFloat(winAmount) || 0) - (parseFloat(cost) || 0);
    }
    this.setData({
      previewNet: net,
      previewNetStr: (net >= 0 ? '+' : '') + net.toFixed(2)
    });
  },

  submit() {
    const { type, cost, winAmount, remark, recordDate, mahjongType, mode, recordId, submitting, lotteryType } = this.data;
    if (submitting) return;
    if (!cost) {
      wx.showToast({ title: '请输入金额', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    wx.showLoading({ title: '保存中...' });

    // 构建请求体
    const recordTypeMap = { lottery: 'LOTTERY', scratch: 'SCRATCH', mahjong: 'MAHJONG' };
    const body = {
      recordType: recordTypeMap[type],
      cost: parseFloat(cost) || 0,
      winAmount: parseFloat(winAmount) || 0,
      remark,
      recordDate
    };

    if (type === 'lottery') {
      body.lotteryType = lotteryType;
    }
    if (type === 'mahjong') {
      const amt = (parseFloat(cost) || 0) * (mahjongType === 'win' ? 1 : -1);
      body.amount = amt;
    }

    const promise = mode === 'edit'
      ? api.updateRecord(recordId, body)
      : api.addRecord(body);

    promise.then(() => {
      wx.hideLoading();
      this.setData({ submitting: false });
      wx.showToast({ title: mode === 'edit' ? '修改成功' : '保存成功' });
      setTimeout(() => wx.navigateBack(), 1000);
    }).catch(() => {
      wx.hideLoading();
      this.setData({ submitting: false });
      wx.showToast({ title: '保存失败', icon: 'none' });
    });
  }
});
