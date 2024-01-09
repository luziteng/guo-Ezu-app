const util = require('../../utils/util.js');
const api = require('../../config/api.js');
const user = require('../../services/user.js');

//获取应用实例
const app = getApp()

Page({
    data: {
        floorGoods: [],
        openAttr: false,
        showChannel: 0,
        showBanner: 0,
        showBannerImg: 0,
        banner: ['http://guoezu.oss-cn-guangzhou.aliyuncs.com/goods/d74a4d1d-afc8-4e19-bb46-44910b1dbdce.jpeg','http://guoezu.oss-cn-guangzhou.aliyuncs.com/goods/f4e39e05-3d84-4042-8a54-5b55ba35aa5a.jpeg','http://guoezu.oss-cn-guangzhou.aliyuncs.com/goods/cb164aec-c0cc-458a-bc82-86d988f258fa.jpeg','http://guoezu.oss-cn-guangzhou.aliyuncs.com/goods/144c60f3-caf7-4df5-9d55-ae66970a735a.jpeg','http://guoezu.oss-cn-guangzhou.aliyuncs.com/goods/e14bbf31-226c-4a7e-9ba0-2623adc795fc.jpeg'],
        index_banner_img: 0,
        userInfo: {},
        imgurl: '',
        sysHeight: 0,
        loading: 0,
        autoplay: true,
        showContact: 1,
    },
    onLoad: function (options) {
        // this.getChannelShowInfo();
    },
    onPageScroll: function (e) {
        let scrollTop = e.scrollTop;
        let that = this;
        if (scrollTop >= 2000) {
            that.setData({
                showContact: 0
            })
        } else {
            that.setData({
                showContact: 1
            })
        }
    },
    onHide: function () {
        this.setData({
            autoplay: false
        })
    },
    goSearch: function () {
        wx.navigateTo({
            url: '/pages/search/search',
        })
    },
    goCategory: function (e) {
        let id = e.currentTarget.dataset.cateid;
        wx.setStorageSync('categoryId', id);
        wx.switchTab({
            url: '/pages/category/index',
        })
    },
    handleTap: function (event) {
        //阻止冒泡 
    },
    onShareAppMessage: function () {
        let info = wx.getStorageSync('userInfo');
        return {
            title: '果E族',
            desc: '开源微信小程序商城',
            path: '/pages/index/index?id=' + info.id
        }
    },
    toDetailsTap: function () {
        wx.navigateTo({
            url: '/pages/goods-details/index',
        });
    },
    getIndexData: function () {
        let that = this;
        util.request(api.IndexUrl,{
            categoryId:null,  productName:null,productTitle:null,pageSize:100,pageNo:1,productStatus:0,
        },'post').then(function (res) {
            if (res.code === 200) {
                console.log('res',res)
                that.setData({
                    floorGoods: res.data.list,
                    // banner: res.data.banner,
                    // channel: res.data.channel,
                    // notice: res.data.notice,
                    loading: 1,
                });

            }
        });
    },
    // 获取购物车个数
    getCartCount: function() {
        let that = this;
        util.request(api.CartGoodsCount,{},'post').then(function(res) {
            if (res.code === 200) {

                let cartGoodsCount = '';
                if (res.data.cartCount == 0) {
                    wx.removeTabBarBadge({
                        index: 2,
                    })
                } else {
                    cartGoodsCount = res.data.length + '';
                    wx.setTabBarBadge({
                        index: 2,
                        text: cartGoodsCount
                    })
                }
            }
        });
    },
    onShow: function () {
        this.getIndexData();
        this.getCartCount()
        var that = this;
        let userInfo = wx.getStorageSync('userInfo');
        if (userInfo != '') {
            that.setData({
                userInfo: userInfo,
            });
        };
        let info = wx.getSystemInfoSync();
        let sysHeight = info.windowHeight - 100;
        this.setData({
            sysHeight: sysHeight,
            autoplay: true
        });
        wx.removeStorageSync('categoryId');
    },
    getChannelShowInfo: function (e) {
        let that = this;
        util.request(api.ShowSettings).then(function (res) {
            if (res.errno === 0) {
                let show_channel = res.data.channel;
                let show_banner = res.data.banner;
                let show_notice = res.data.notice;
                let index_banner_img = res.data.index_banner_img;
                that.setData({
                    show_channel: show_channel,
                    show_banner: show_banner,
                    show_notice: show_notice,
                    index_banner_img: index_banner_img
                });
            }
        });
    },
    onPullDownRefresh: function () {
        wx.showNavigationBarLoading()
        this.getIndexData();
        // this.getChannelShowInfo();
        wx.hideNavigationBarLoading() //完成停止加载
        wx.stopPullDownRefresh() //停止下拉刷新
    },
})