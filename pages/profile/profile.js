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
    getApp().globalData.loginReady.then(() => this.doShow());
  },

  doShow() {
    this.loadSettings();
    if (!api.hasIdentity()) {
      return;
    }
    this.loadUserProfile();
    api.getRecentRecords(1000).then(res => {
      this.setData({ recordCount: (res.data || []).length });
    });
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
        const cached = wx.getStorageSync('avatarCache') || '';
        const avatar = res.data.avatarBase64 || cached || res.data.avatarUrl || '';
        if (res.data.avatarBase64) {
          wx.setStorageSync('avatarCache', res.data.avatarBase64);
        }
        this.setData({
          nickname: res.data.nickname || '',
          avatarUrl: avatar
        });

        // 合并 stats 数据，避免重复调 getProfile
        const totalNet = parseFloat(res.data.totalNet) || 0;
        const lotteryNet = parseFloat(res.data.lotteryNet) || 0;
        const scratchNet = parseFloat(res.data.scratchNet) || 0;
        const mahjongNet = parseFloat(res.data.mahjongNet) || 0;
        this.setData({
          totalNet, totalNetStr: (totalNet >= 0 ? '+' : '') + totalNet.toFixed(2),
          lotteryNet, lotteryNetStr: (lotteryNet >= 0 ? '+' : '') + lotteryNet.toFixed(2),
          scratchNet, scratchNetStr: (scratchNet >= 0 ? '+' : '') + scratchNet.toFixed(2),
          mahjongNet, mahjongNetStr: (mahjongNet >= 0 ? '+' : '') + mahjongNet.toFixed(2)
        });
      }
    });
  },


  chooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        wx.compressImage({
          src: tempFilePath,
          quality: 80,
          success: (compressed) => {
            this.uploadAvatar(compressed.tempFilePath);
          },
          fail: () => {
            this.uploadAvatar(tempFilePath);
          }
        });
      }
    });
  },

  uploadAvatar(filePath) {
    const that = this;
    wx.getFileSystemManager().readFile({
      filePath: filePath,
      encoding: 'base64',
      success: (res) => {
        const base64 = 'data:image/jpeg;base64,' + res.data;
        api.uploadAvatar(base64).then(() => {
          wx.setStorageSync('avatarCache', base64);
          that.setData({ avatarUrl: base64 });
          wx.showToast({ title: '头像更新成功', icon: 'success' });
        }).catch(err => {
          console.error('头像上传失败:', err);
          wx.showToast({ title: '上传失败', icon: 'none' });
        });
      },
      fail: (err) => {
        console.error('读取文件失败:', err);
        wx.showToast({ title: '读取图片失败', icon: 'none' });
      }
    });
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
