var util = require('utils/util.js');
var api = require('config/api.js');
App({
  data: {
    deviceInfo: {}
  },
  onLaunch: function () {
    this.data.deviceInfo = wx.getSystemInfoSync();
    console.log(this.data.deviceInfo);
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
    // 登录
    wx.login({
      success: (res) => {
        //   console.log('codecdoecode',res.code)
        util.request(api.AuthLoginByWeixin, {
          code: res.code
        }, 'POST').then(function (res) {
          if (res.code === 200) {
            let userInfo = res.data;
            console.log('res.data',res.data)
            wx.setStorageSync('token', res.data.tokenValue);
            wx.setStorageSync('userInfo', userInfo);
          }
        });
      },
    });
    let that = this;
    wx.getSystemInfo({ //  获取页面的有关信息
      success: function (res) {
        wx.setStorageSync('systemInfo', res)
        var ww = res.windowWidth;
        var hh = res.windowHeight;
        that.globalData.ww = ww;
        that.globalData.hh = hh;
      }
    });
  },
  globalData: {
    userInfo: {
      nickname: '点我登录',
      username: '点击登录',
      avatar: 'http://lucky-icon.meiweiyuxian.com/hio/default_avatar_big.png'
    },
    token: '',
  }
})