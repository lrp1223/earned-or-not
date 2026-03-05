Page({
  data: { type: '', typeText: '', cost: '', winAmount: '', mahjongType: 'win', previewNet: 0 },
  onLoad(options) {
    const type = options.type || 'lottery';
    const map = { lottery: '彩票', scratch: '刮刮乐', mahjong: '麻将' };
    this.setData({ type, typeText: map[type] });
  },
  onCostInput(e) { this.setData({ cost: e.detail.value }); this.calc(); },
  onWinInput(e) { this.setData({ winAmount: e.detail.value }); this.calc(); },
  setMahjongType(e) { this.setData({ mahjongType: e.currentTarget.dataset.type }); this.calc(); },
  calc() {
    const { type, cost, winAmount, mahjongType } = this.data;
    let net = 0;
    if (type === 'mahjong') net = (parseFloat(cost) || 0) * (mahjongType === 'win' ? 1 : -1);
    else net = (parseFloat(winAmount) || 0) - (parseFloat(cost) || 0);
    this.setData({ previewNet: net });
  },
  submit() {
    const { type, cost, winAmount, mahjongType, previewNet } = this.data;
    if (!cost) { wx.showToast({ title: '请输入金额', icon: 'none' }); return; }
    wx.cloud.callFunction({ name: type, data: { action: 'add', cost, winAmount, mahjongType } })
      .then(res => { if (res.result.success) { wx.showToast({ title: '保存成功' }); setTimeout(() => wx.navigateBack(), 1000); } });
  }
});