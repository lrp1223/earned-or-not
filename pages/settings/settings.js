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
    
    // 星座日期划分
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return '水瓶座';
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return '双鱼座';
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return '白羊座';
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return '金牛座';
    if ((month === 5 && day >= 21) || (month === 6 && day <= 21)) return '双子座';
    if ((month === 6 && day >= 22) || (month === 7 && day <= 22)) return '巨蟹座';
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return '狮子座';
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return '处女座';
    if ((month === 9 && day >= 23) || (month === 10 && day <= 23)) return '天秤座';
    if ((month === 10 && day >= 24) || (month === 11 && day <= 22)) return '天蝎座';
    if ((month === 11 && day >= 23) || (month === 12 && day <= 21)) return '射手座';
    return '摩羯座'; // 12月22日 - 1月19日
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