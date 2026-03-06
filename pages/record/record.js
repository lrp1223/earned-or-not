Page({
  data: {
    type: '',
    typeText: '',
    cost: '',
    winAmount: '',
    remark: '',
    mahjongType: 'win',
    previewNet: 0,
    previewNetStr: '+0.00',
    mode: 'add',
    recordId: '',
    submitting: false
  },

  onLoad(options) {
    const type = options.type || 'lottery';
    const mode = options.mode || 'add';
    const map = { lottery: '彩票', scratch: '刮刮乐', mahjong: '麻将' };
    
    this.setData({
      type,
      typeText: map[type],
      mode,
      recordId: options.id || ''
    });

    // 编辑模式，加载原有数据
    if (mode === 'edit' && options.id) {
      this.loadRecord(options.id, type);
    }
  },

  loadRecord(id, type) {
    const db = wx.cloud.database();
    db.collection(type).doc(id).get().then(res => {
      const data = res.data;
      if (data) {
        const cost = Math.abs(data.cost || 0).toString();
        // 中奖金额为0时显示空
        const winAmount = data.winAmount === 0 ? '' : (data.winAmount || '').toString();
        
        this.setData({
          cost,
          winAmount,
          mahjongType: data.amount >= 0 ? 'win' : 'lose'
        });
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
      // 中奖金额不填默认为0
      net = (parseFloat(winAmount) || 0) - (parseFloat(cost) || 0);
    }
    this.setData({
      previewNet: net,
      previewNetStr: (net >= 0 ? '+' : '') + net.toFixed(2)
    });
  },

  submit() {
    const { type, cost, winAmount, remark, mahjongType, mode, recordId, submitting } = this.data;
    if (submitting) return; // 防止重复提交
    if (!cost) {
      wx.showToast({ title: '请输入金额', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    wx.showLoading({ title: '保存中...' });

    const action = mode === 'edit' ? 'update' : 'add';
    const data = { action, cost, winAmount: winAmount || '0', remark, mahjongType };
    if (mode === 'edit') data.id = recordId;

    wx.cloud.callFunction({ name: type, data })
      .then(res => {
        wx.hideLoading();
        this.setData({ submitting: false });
        if (res.result.success) {
          wx.showToast({ title: mode === 'edit' ? '修改成功' : '保存成功' });
          setTimeout(() => wx.navigateBack(), 1000);
        } else {
          wx.showToast({ title: res.result.message || '保存失败', icon: 'none' });
        }
      })
      .catch(() => {
        wx.hideLoading();
        this.setData({ submitting: false });
        wx.showToast({ title: '保存失败', icon: 'none' });
      });
  }
});
