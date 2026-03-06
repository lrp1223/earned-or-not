// pages/profile/profile.js
Page({
  data: {
    userProfile: {},
    userId: '',
    totalNet: 0,
    totalNetStr: '0.00',
    recordCount: 0
  },

  onShow() {
    this.loadUserProfile();
    this.loadStats();
  },

  loadUserProfile() {
    wx.cloud.callFunction({
      name: 'user',
      data: { action: 'getProfile' }
    }).then(res => {
      if (res.result && res.result.success) {
        this.setData({
          userProfile: res.result.data,
          userId: res.result.data._openid?.slice(-8) || '未知'
        });
      }
    });
  },

  loadStats() {
    wx.cloud.callFunction({
      name: 'stats',
      data: { action: 'getPersonalStats' }
    }).then(res => {
      if (res.result && res.result.success) {
        const totalNet = parseFloat(res.result.data.totalNet) || 0;
        this.setData({
          totalNet: totalNet,
          totalNetStr: (totalNet >= 0 ? '+' : '') + totalNet.toFixed(2)
        });
      }
    });
    
    // 获取记录数
    wx.cloud.callFunction({
      name: 'stats',
      data: { action: 'getRecentRecords', limit: 100 }
    }).then(res => {
      if (res.result && res.result.success) {
        this.setData({ recordCount: res.result.data.length });
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
        this.uploadAvatar(tempFilePath);
      }
    });
  },

  uploadAvatar(filePath) {
    wx.cloud.uploadFile({
      cloudPath: `avatars/${Date.now()}.jpg`,
      filePath: filePath
    }).then(res => {
      const avatarUrl = res.fileID;
      return wx.cloud.callFunction({
        name: 'user',
        data: { action: 'setProfile', avatarUrl }
      });
    }).then(() => {
      this.loadUserProfile();
      wx.showToast({ title: '头像更新成功' });
    });
  },

  editNickname() {
    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '请输入昵称',
      success: (res) => {
        if (res.confirm && res.content) {
          wx.cloud.callFunction({
            name: 'user',
            data: { action: 'setProfile', nickname: res.content }
          }).then(() => {
            this.loadUserProfile();
            wx.showToast({ title: '昵称修改成功' });
          });
        }
      }
    });
  }
});
