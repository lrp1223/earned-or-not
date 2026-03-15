// pages/settings/settings.js
const app = getApp();

Page({
  data: {
    winColor: '#52c41a',
    loseColor: '#ff4d4f',
    colorOptions: [
      { name: '经典绿', value: '#52c41a' },
      { name: '经典红', value: '#ff4d4f' },
      { name: '天空蓝', value: '#1890ff' },
      { name: '樱花粉', value: '#ff6b9d' },
      { name: '活力橙', value: '#fa8c16' },
      { name: '优雅紫', value: '#722ed1' },
      { name: '湖水青', value: '#13c2c2' },
      { name: '土豪金', value: '#faad14' }
    ]
  },

  onShow() {
    this.loadSettings();
  },

  loadSettings() {
    const settings = wx.getStorageSync('userSettings') || {};
    this.setData({
      winColor: settings.winColor || '#52c41a',
      loseColor: settings.loseColor || '#ff4d4f'
    });
    this.updatePreviewColors();
  },

  selectWinColor(e) {
    const color = e.currentTarget.dataset.color;
    this.setData({ winColor: color });
    this.saveSettings();
    this.updatePreviewColors();
  },

  selectLoseColor(e) {
    const color = e.currentTarget.dataset.color;
    this.setData({ loseColor: color });
    this.saveSettings();
    this.updatePreviewColors();
  },

  saveSettings() {
    const settings = {
      winColor: this.data.winColor,
      loseColor: this.data.loseColor
    };
    wx.setStorageSync('userSettings', settings);
    // 同步到全局
    app.globalData.settings = settings;
  },

  updatePreviewColors() {
    // 动态更新预览颜色
    const winStyle = `color: ${this.data.winColor}`;
    const loseStyle = `color: ${this.data.loseColor}`;
    this.setData({
      winStyle: winStyle,
      loseStyle: loseStyle
    });
  }
});