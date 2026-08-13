// pages/gameGongzhuEntry/gameGongzhuEntry.js
Page({
  data: {},

  goSingle() {
    wx.navigateTo({ url: '/pages/gameGongzhu/gameGongzhu' });
  },

  goOnline() {
    wx.navigateTo({ url: '/pages/gameGongzhuOnline/gameGongzhuOnline' });
  }
});
