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
        this.compressToTarget(tempFilePath, 0);
      }
    });
  },

  // 内容安全检测：图片，微信审核要求
  // 递归压缩到 10KB 以内
  compressToTarget(srcPath, attempt) {
    const maxBytes = 10 * 1024;
    const that = this;
    const quality = Math.max(10, 80 - attempt * 10);

    wx.getFileSystemManager().getFileInfo({
      filePath: srcPath,
      success: function(info) {
        if (info.size <= maxBytes || attempt >= 7) {
          that.checkImageThenUpload(srcPath);
          return;
        }
        wx.compressImage({
          src: srcPath,
          quality: quality,
          success: function(compressed) {
            that.compressToTarget(compressed.tempFilePath, attempt + 1);
          },
          fail: function() {
            that.checkImageThenUpload(srcPath);
          }
        });
      },
      fail: function() {
        that.checkImageThenUpload(srcPath);
      }
    });
  },

  checkImageThenUpload(filePath) {
    var that = this;
    wx.showLoading({ title: '安全检测中...' });
    wx.getFileSystemManager().readFile({
      filePath: filePath,
      success: function(readRes) {
        if (!wx.security || !wx.security.imgSecCheck) {
          wx.hideLoading();
          that.uploadAvatar(filePath);
          return;
        }
        wx.security.imgSecCheck({
          media: readRes.data,
          success: function() {
            wx.hideLoading();
            that.uploadAvatar(filePath);
          },
          fail: function(err) {
            wx.hideLoading();
            console.error('图片安全检测失败:', err);
            wx.showToast({ title: '图片含有违规内容，请重新选择', icon: 'none' });
          }
        });
      },
      fail: function() {
        wx.hideLoading();
        wx.showToast({ title: '读取图片失败', icon: 'none' });
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
    var that = this;
    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '请输入昵称',
      success: (res) => {
        if (res.confirm && res.content) {
          var nickname = res.content.trim();
          if (!nickname) {
            wx.showToast({ title: '昵称不能为空', icon: 'none' });
            return;
          }
          // 内容安全检测：文本
          if (wx.security && wx.security.msgSecCheck) {
            wx.showLoading({ title: '安全检测中...' });
            wx.security.msgSecCheck({
              content: nickname,
              success: function() {
                wx.hideLoading();
                that.doUpdateNickname(nickname);
              },
              fail: function(err) {
                wx.hideLoading();
                console.error('文本安全检测失败:', err);
                wx.showToast({ title: '昵称含有违规内容，请重新输入', icon: 'none' });
              }
            });
          } else {
            that.doUpdateNickname(nickname);
          }
        }
      }
    });
  },

  doUpdateNickname(nickname) {
    var that = this;
    api.updateProfile({ nickname: nickname }).then(() => {
      that.loadUserProfile();
      wx.showToast({ title: '昵称修改成功' });
    }).catch(err => {
      console.error('昵称更新失败:', err);
      wx.showToast({ title: '修改失败', icon: 'none' });
    });
  }
});
