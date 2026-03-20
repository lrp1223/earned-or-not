// pages/settings/settings.js
const app = getApp();

Page({
  data: {
    winColor: '#52c41a',
    loseColor: '#ff4d4f',
    birthday: '',
    constellation: '',
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
    this.setToday();
  },

  setToday() {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${(today.getMonth()+1).toString().padStart(2,'0')}-${today.getDate().toString().padStart(2,'0')}`;
    this.setData({ today: dateStr });
  },

  loadSettings() {
    const settings = wx.getStorageSync('userSettings') || {};
    this.setData({
      winColor: settings.winColor || '#52c41a',
      loseColor: settings.loseColor || '#ff4d4f',
      birthday: settings.birthday || '',
      constellation: settings.constellation || ''
    });
    this.updatePreviewColors();
  },

  onBirthdayChange(e) {
    const birthday = e.detail.value;
    const constellation = this.getConstellation(birthday);
    this.setData({ birthday, constellation });
    this.saveSettings();
  },

  getConstellation(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const constellations = [
      { name: '摩羯座', start: [1, 1], end: [1, 19] },
      { name: '水瓶座', start: [1, 20], end: [2, 18] },
      { name: '双鱼座', start: [2, 19], end: [3, 20] },
      { name: '白羊座', start: [3, 21], end: [4, 19] },
      { name: '金牛座', start: [4, 20], end: [5, 20] },
      { name: '双子座', start: [5, 21], end: [6, 21] },
      { name: '巨蟹座', start: [6, 22], end: [7, 22] },
      { name: '狮子座', start: [7, 23], end: [8, 22] },
      { name: '处女座', start: [8, 23], end: [9, 22] },
      { name: '天秤座', start: [9, 23], end: [10, 23] },
      { name: '天蝎座', start: [10, 24], end: [11, 22] },
      { name: '射手座', start: [11, 23], end: [12, 21] },
      { name: '摩羯座', start: [12, 22], end: [12, 31] }
    ];
    
    for (let c of constellations) {
      const [startMonth, startDay] = c.start;
      const [endMonth, endDay] = c.end;
      if ((month === startMonth && day >= startDay) || (month === endMonth && day <= endDay)) {
        return c.name;
      }
    }
    return '';
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
      loseColor: this.data.loseColor,
      birthday: this.data.birthday,
      constellation: this.data.constellation
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