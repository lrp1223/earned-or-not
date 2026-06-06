// pages/profile/profile.js
const api = require('../../utils/api');

Page({
  data: {
    nickname: '',
    avatarUrl: '',
    totalNet: 0,
    totalNetStr: '0.00',
    lotteryNet: 0,
    lotteryNetStr: '0.00',
    scratchNet: 0,
    scratchNetStr: '0.00',
    mahjongNet: 0,
    mahjongNetStr: '0.00',
    recordCount: 0
  },

  onShow() {
    const app = getApp();
    if (!app.globalData.userId) {
      app.globalData.loginReady.then(() => this.doShow());
      return;
    }
    this.doShow();
  },

  doShow() {
    this.loadSettings();
    this.loadUserProfile();
    this.loadStats();
  },

  loadSettings() {
    const settings = wx.getStorageSync('userSettings') || {};
    this.setData({
      winColor: settings.winColor || '#52c41a',
      loseColor: settings.loseColor || '#ff4d4f'
    });
  },

  loadUserProfile() {
    api.getProfile().then(res => {
      if (res.data) {
        this.setData({
          nickname: res.data.nickname || '',
          avatarUrl: res.data.avatarUrl || ''
        });
      }
    });
  },

  loadStats() {
    api.getProfile().then(res => {
      if (res.data) {
        const totalNet = parseFloat(res.data.totalNet) || 0;
        const lotteryNet = parseFloat(res.data.lotteryNet) || 0;
        const scratchNet = parseFloat(res.data.scratchNet) || 0;
        const mahjongNet = parseFloat(res.data.mahjongNet) || 0;

        this.setData({
          totalNet: totalNet,
          totalNetStr: (totalNet >= 0 ? '+' : '') + totalNet.toFixed(2),
          lotteryNet: lotteryNet,
          lotteryNetStr: (lotteryNet >= 0 ? '+' : '') + lotteryNet.toFixed(2),
          scratchNet: scratchNet,
          scratchNetStr: (scratchNet >= 0 ? '+' : '') + scratchNet.toFixed(2),
          mahjongNet: mahjongNet,
          mahjongNetStr: (mahjongNet >= 0 ? '+' : '') + mahjongNet.toFixed(2)
        });
      }
    });

    api.getRecentRecords(1000).then(res => {
      this.setData({ recordCount: (res.data || []).length });
    });
  },

  chooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.uploadAvatar(tempFilePath);
      }
    });
  },

  uploadAvatar(filePath) {
    wx.showToast({ title: '头像上传功能待对接文件服务', icon: 'none' });
  },

  goSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' });
  },

  editNickname() {
    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '请输入昵称',
      success: (res) => {
        if (res.confirm && res.content) {
          api.updateProfile({ nickname: res.content }).then(() => {
            this.loadUserProfile();
            wx.showToast({ title: '昵称修改成功' });
          });
        }
      }
    });
  }
});
