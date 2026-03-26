// pages/fun/fun.js
Page({
  data: {},
  goGameScratch() {
    wx.navigateTo({ url: '/pages/gameScratch/gameScratch' });
  },
  goGameIdiom() {
    wx.navigateTo({ url: '/pages/gameIdiom/gameIdiom' });
  },
  goGameFeihua() {
    wx.navigateTo({ url: '/pages/gameFeihua/gameFeihua' });
  },
  goGame24() {
    wx.navigateTo({ url: '/pages/game24/game24' });
  }
});
