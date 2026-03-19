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
    submitting: false,
    // 彩票类型
    lotteryTypes: ['大乐透', '双色球', '快乐8', '七星彩', '排列5', '其他'],
    lotteryTypeIndex: 0,
    lotteryType: '大乐透'
  },

  onLoad(options) {
    const type = options.type || 'lottery';
    const mode = options.mode || 'add';
    const map = { lottery: '彩', scratch: '刮', mahjong: '麻' };
    const remarkPlaceholder = {
      lottery: '例如：追加投注、复式...',
      scratch: '例如：好运十倍、点球大战...',
      mahjong: '例如：跟大饼打麻将赢了100'
    };

    // 根据日期智能选择彩票类型
    const defaultLotteryType = this.getDefaultLotteryType();
    const lotteryTypeIndex = this.data.lotteryTypes.indexOf(defaultLotteryType);

    this.setData({
      type,
      typeText: map[type],
      remarkPlaceholder: remarkPlaceholder[type],
      mode,
      recordId: options.id || '',
      lotteryTypeIndex: lotteryTypeIndex >= 0 ? lotteryTypeIndex : 0,
      lotteryType: defaultLotteryType
    });

    // 新增模式，查询上一期中奖金额
    if (mode === 'add' && type === 'lottery') {
      this.loadLastWinAmount(defaultLotteryType);
    }

    // 编辑模式，加载原有数据
    if (mode === 'edit' && options.id) {
      this.loadRecord(options.id, type);
    }
  },

  // 根据日期获取默认彩票类型
  getDefaultLotteryType() {
    const day = new Date().getDay(); // 0=周日, 1=周一, ..., 6=周六
    // 周一(1)、三(3)、五(5) -> 双色球
    // 其他 -> 大乐透
    if (day === 1 || day === 3 || day === 5) {
      return '双色球';
    }
    return '大乐透';
  },

  // 加载上一期同类型的中奖金额
  loadLastWinAmount(lotteryType) {
    wx.cloud.callFunction({
      name: 'lottery',
      data: { action: 'getLastWinAmount', lotteryType }
    }).then(res => {
      if (res.result.success && res.result.winAmount > 0) {
        this.setData({
          winAmount: res.result.winAmount.toString()
        });
        this.calc();
      }
    });
  },

  // 切换彩票类型
  onLotteryTypeChange(e) {
    const index = parseInt(e.detail.value);
    const lotteryType = this.data.lotteryTypes[index];
    this.setData({
      lotteryTypeIndex: index,
      lotteryType
    });
    // 查询该类型上一期中奖金额
    if (this.data.mode === 'add') {
      this.loadLastWinAmount(lotteryType);
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
        
        const updateData = {
          cost,
          winAmount,
          remark: data.remark || ''
        };
        
        // 彩票类型
        if (type === 'lottery' && data.lotteryType) {
          const index = this.data.lotteryTypes.indexOf(data.lotteryType);
          if (index >= 0) {
            updateData.lotteryTypeIndex = index;
            updateData.lotteryType = data.lotteryType;
          }
        }
        
        if (type === 'mahjong') {
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
      // 中奖金额不填默认为0
      net = (parseFloat(winAmount) || 0) - (parseFloat(cost) || 0);
    }
    this.setData({
      previewNet: net,
      previewNetStr: (net >= 0 ? '+' : '') + net.toFixed(2)
    });
  },

  submit() {
    const { type, cost, winAmount, remark, mahjongType, mode, recordId, submitting, lotteryType } = this.data;
    if (submitting) return; // 防止重复提交
    if (!cost) {
      wx.showToast({ title: '请输入金额', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    wx.showLoading({ title: '保存中...' });

    const action = mode === 'edit' ? 'update' : 'add';
    const data = { action, cost, winAmount: winAmount || '0', remark, mahjongType };
    
    // 彩票类型
    if (type === 'lottery') {
      data.lotteryType = lotteryType;
    }
    
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
