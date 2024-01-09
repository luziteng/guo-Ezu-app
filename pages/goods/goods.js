var app = getApp();
var WxParse = require('../../lib/wxParse/wxParse.js');
var util = require('../../utils/util.js');
var timer = require('../../utils/wxTimer.js');
var api = require('../../config/api.js');
const user = require('../../services/user.js');
Page({
    data: {
        id: 0,
        goods: {},
        gallery: [],
        galleryImages:[],
        specificationList: [],
        productList: [],
        cartGoodsCount: 0,
        checkedSpecPrice: 0,
        number: 1,
        checkedSpecText: '',
        tmpSpecText: '请选择规格和数量',
        openAttr: false,
        soldout: false,
        disabled: '',
        alone_text: '单独购买',
        userId: 0,
        priceChecked: false,
        goodsNumber: 0,
        loading: 0,
        current: 0,
        showShareDialog:0,// 上拉框
        userInfo:{},
        autoplay:true,
        specNumber:'',
        checkedValue:{}
    },
    hideDialog: function (e) {
        let that = this;
        that.setData({
            showShareDialog: false,
        });
    },
    shareTo:function(){
        let userInfo = wx.getStorageSync('userInfo');
        if (userInfo == '') {
            util.loginNow();
            return false;
        } else {
            this.setData({
                showShareDialog: !this.data.showShareDialog,
            });
        }
    },
    createShareImage: function () {
        let id = this.data.id;
        wx.navigateTo({
            url: '/pages/share/index?goodsid=' + id
        })
    },
    previewImage: function (e) {
        let current = e.currentTarget.dataset.src;
        let that = this;
        wx.previewImage({
            current: current, // 当前显示图片的http链接  
            urls: that.data.galleryImages // 需要预览的图片http链接列表  
        })
    },
    bindchange: function(e) {
        let current = e.detail.current;
        this.setData({
            current: current
        })
    },
    inputNumber(event) {
        let number = event.detail.value;
        this.setData({
            number: number
        });
    },
    goIndex: function() {
        wx.switchTab({
            url: '/pages/index/index',
        })
    },
    onShareAppMessage: function(res) {
        let id = this.data.id;
        let name = this.data.goods.name;
        let image = this.data.goods.list_pic_url;
        let userId = this.data.userId;
        return {
            title: name,
            path: '/pages/goods/goods?id=' + id + '&&userId=' + userId,
            imageUrl: image
        }
    },
    onUnload: function() {},
    handleTap: function(event) { //阻止冒泡 
    },
    // 获取商品详情
    getGoodsInfo: function() {
        let that = this;
        util.request(api.GoodsDetail, {
            id: that.data.id
        },'post').then(function(res) {
            console.log('商品详情',res)
            if (res.code === 200) {
                let _specificationList = res.data.specs;
                // 如果仅仅存在一种货品，那么商品页面初始化时默认checked
                if (_specificationList.length == 1) {
                    _specificationList[0].checked = true
                    that.setData({
                        checkedSpecText: '已选择：' + _specificationList[0].specName,
                        tmpSpecText: '已选择：' + _specificationList[0].specName,
                        specNumber:_specificationList[0].specStock
                    });
                } else {
                    that.setData({
                        checkedSpecText: '请选择规格和数量'
                    });
                }
                // let galleryImages = [];
                // for (const item of res.data.gallery) {
                //     galleryImages.push(item.img_url);
                // }
                let goods_number = 0
                for (const item of res.data.specs) {
                            goods_number+= item.specStock
                    // galleryImages.push(item.img_url);
                }
                that.setData({
                    goods: res.data,
                    goodsNumber: goods_number,
                    gallery: res.data.productPicture,
                    specificationList: _specificationList,
                    productList: res.data.specs,
                    checkedSpecPrice: _specificationList[0].specPrice,
                    // galleryImages: galleryImages,
                    loading:1
                });
                setTimeout(() => {
                    WxParse.wxParse('goodsDetail', 'html', res.data.productDetail, that);
                }, 1000);
                wx.setStorageSync('goodsImage', res.data.productPicture[0]);
            }
            else{
                util.showErrorToast(res.msg)
            }
        });
    },
    // 点击选择规格
    clickSkuValue: function(event) {
        // goods_specification中的id 要和product中的goods_specification_ids要一样
        let that = this;
        console.log('选择的value',event)
        let specNameId = event.currentTarget.dataset.nameId;
        let specValueId = event.currentTarget.dataset.valueId;
        let index = event.currentTarget.dataset.index;
        //判断是否可以点击
        let _specificationList = this.data.specificationList;
        // if (_specificationList.productId == specNameId) {
            for (let j = 0; j < _specificationList.length; j++) {
                if (_specificationList[j].id == specValueId) {
                    //如果已经选中，则反选
                    _specificationList[j].checked = !_specificationList[j].checked 
                    this.setData({
                        checkedSpecPrice:_specificationList[j].specPrice,
                        specNumber:_specificationList[j].specStock
                    })
                    if(_specificationList[j].specStock<=0){
                        wx.showToast({
                            image: '/images/icon/icon_error.png',
                            title: '库存不足',
                        });
                    }
                } else {
                    _specificationList[j].checked = false;
                }
            }
        // }
        this.setData({
            'specificationList': _specificationList
        });
        //重新计算spec改变后的信息
        this.changeSpecInfo();

        //重新计算哪些值不可以点击
    },
    //获取选中的规格信息
    getCheckedSpecValue: function() {
        let checkedValues = [];
        let _specificationList = this.data.specificationList;
        console.log('_specificationList',_specificationList)
        let _checkedObj = {
            nameId: '',
            valueId: 0,
            valueText: ''
        };
        _specificationList.map((item)=>{
            if (item.checked) {
                _checkedObj.nameId = item.productId
                _checkedObj.valueId = item.id;
                _checkedObj.valueText = item.specName;
            }
        })
        checkedValues.push(_checkedObj);
        console.log('checkedValues',checkedValues)
        return checkedValues;
    },
    //根据已选的值，计算其它值的状态
    setSpecValueStatus: function() {

    },
    //判断规格是否选择完整
    isCheckedAllSpec: function() {
        return !this.getCheckedSpecValue().some(function(v) {
            if (v.valueId == 0) {
                return true;
            }
        });
    },
    // getCheckedSpecKey: function() {
    //     let checkedValue = this.getCheckedSpecValue().map(function(v) {
    //         return v.valueId;
    //     });
    //     return checkedValue.join('_');
    // },
    changeSpecInfo: function() {
        let checkedNameValue = this.getCheckedSpecValue();
        this.setData({
            disabled: '',
            number: 1,
            checkedValue:checkedNameValue
        });
        //设置选择的信息
        let checkedValue = checkedNameValue.filter(function(v) {
            if (v.valueId != 0) {
                return true;
            } else {
                return false;
            }
        }).map(function(v) {
            return v.valueText;
        });
        if (checkedValue.length > 0) {
            this.setData({
                tmpSpecText: '已选择：' + checkedValue.join('　'),
                priceChecked: true

            });
        } else {
            this.setData({
                tmpSpecText: '请选择规格和数量',
                priceChecked: false
            });
        }
        console.log('this.isCheckedAllSpec()',this.isCheckedAllSpec())
        if (this.isCheckedAllSpec()) {
            console.log('this.data.tmpSpecText',this.data.tmpSpecText)
            this.setData({
                checkedSpecText: this.data.tmpSpecText
            });

            // 点击规格的按钮后
            // 验证库存
            // let checkedProductArray = this.getCheckedProductItem(this.getCheckedSpecKey());
            // console.log('checkedProductArray',checkedProductArray)
            // if (!checkedProductArray || checkedProductArray.length <= 0) {
            //     this.setData({
            //         soldout: true
            //     });
            //     // console.error('规格所对应货品不存在');
            //     wx.showToast({
            //         image: '/images/icon/icon_error.png',
            //         title: '规格所对应货品不存在',
            //     });
            //     return;
            // }
            // let checkedProduct = checkedProductArray[0];
            // console.log('checkedProductArray',checkedProductArray)
            // if (checkedProduct.goods_number < this.data.number) {
            //     //找不到对应的product信息，提示没有库存
            //     this.setData({
            //         checkedSpecPrice: checkedProduct.specPrice,
            //         goodsNumber: checkedProduct.specStock,
            //         soldout: true
            //     });
            //     wx.showToast({
            //         image: '/images/icon/icon_error.png',
            //         title: '库存不足',
            //     });
            //     return false;
            // }
            // if (checkedProduct.goods_number > 0) {
            //     this.setData({
            //         checkedSpecPrice: checkedProduct.specPrice,
            //         goodsNumber: checkedProduct.specStock,
            //         soldout: false
            //     });

            //     var checkedSpecPrice = checkedProduct.specPrice;

            // } else {
            //     this.setData({
            //         checkedSpecPrice: this.data.goods.specPrice,
            //         soldout: true
            //     });
            // }
        } else {
            this.setData({
                checkedSpecText: '请选择规格和数量',
                checkedSpecPrice: this.data.specificationList.specPrice,
                soldout: false
            });
        }
    },
    getCheckedProductItem: function(key) {
        console.log('keykey',key)
        return this.data.productList.filter(function(v) {
            if (v.productId == key) {
                return true;
            } else {
                return false;
            }
        });
    },
    onLoad: function(options) {
        let id = 0;
        var scene = decodeURIComponent(options.scene);
        if (scene != 'undefined') {
            id = scene;
        } else {
            id = options.id;
        }
        this.setData({
            id: id, // 这个是商品id
            valueId: id,
        });
    },
    onShow: function() {
        let userInfo = wx.getStorageSync('userInfo');
        let info = wx.getSystemInfoSync();// 获取屏幕
        let sysHeight = info.windowHeight - 100;
        let userId = userInfo.id;
        if (userId > 0) {
            this.setData({
                userId: userId,
                userInfo: userInfo,
            });
        }
        this.setData({
            priceChecked: false,
            sysHeight: sysHeight
        })
        this.getGoodsInfo();
        this.getCartCount();
    },
    onHide:function(){
        this.setData({
            autoplay:false
        })
    },
    // 获取购物车个数
    getCartCount: function() {
        let that = this;
        util.request(api.CartGoodsCount,{},'post').then(function(res) {
            if (res.code === 200) {
                that.setData({
                    cartGoodsCount: res.data.length
                });
            }
        });
    },
    onPullDownRefresh: function() {
        wx.showNavigationBarLoading()
        this.getGoodsInfo();
        wx.hideNavigationBarLoading() //完成停止加载
        wx.stopPullDownRefresh() //停止下拉刷新
    },
    openCartPage: function() {
        wx.switchTab({
            url: '/pages/cart/cart',
        });
    },
    goIndexPage: function() {
        wx.switchTab({
            url: '/pages/index/index',
        });
    },
    switchAttrPop: function() {
        if (this.data.openAttr == false) {
            this.setData({
                openAttr: !this.data.openAttr
            });
        }
    },
    closeAttr: function() {
        this.setData({
            openAttr: false,
            alone_text: '单独购买'
        });
    },
    goMarketing: function(e) {
        let that = this;
        that.setData({
            showDialog: !this.data.showDialog
        });
    },
    addToCart: function() {
        // 判断是否登录，如果没有登录，则登录
        util.loginNow();
        var that = this;
        let userInfo = wx.getStorageSync('userInfo');
        let productLength = this.data.productList.length;
        console.log('productLengthproductLength',productLength,this.data.specificationList,userInfo)
        if (userInfo == '') {
            return false;
        }
        if (this.data.openAttr == false && productLength != 1) {
            //打开规格选择窗口
            this.setData({
                openAttr: !that.data.openAttr
            });
            this.setData({
                alone_text: '加入购物车'
            })
        } else {
            console.log('checkedValue',this.data.checkedValue)
            //提示选择完整规格
            if (!this.isCheckedAllSpec()) {
                wx.showToast({
                    image: '/images/icon/icon_error.png',
                    title: '请选择规格',
                });
                return false;
            }
            if(this.data.specNumber<this.data.number){
                //找不到对应的product信息，提示没有库存
                wx.showToast({
                    image: '/images/icon/icon_error.png',
                    title: '库存不足',
                });
                return false;
            }
            //根据选中的规格，判断是否有对应的sku信息
            // console.log(2232322)
            // let checkedProductArray = this.getCheckedProductItem(this.getCheckedSpecKey());
            // console.log('checkedProductArraycheckedProductArray',checkedProductArray)
            // if (!checkedProductArray || checkedProductArray.length <= 0) {
            //     //找不到对应的product信息，提示没有库存
            //     wx.showToast({
            //         image: '/images/icon/icon_error.png',
            //         title: '库存不足',
            //     });
            //     return false;
            // }
            // let checkedProduct = checkedProductArray[0];
            //验证库存
            // if (checkedProduct.goods_number < this.data.number) {
            //     //要买的数量比库存多
            //     wx.showToast({
            //         image: '/images/icon/icon_error.png',
            //         title: '库存不足',
            //     });
            //     return false;
            // }

            wx.showLoading({
              title: '',
              mask:true
            })
            const {number,checkedValue} = this.data
            util.request(api.CartAdd, {
                userId: userInfo.id,
                productId: checkedValue[0].nameId,
                specGroupId: '',
                specId: checkedValue[0].valueId,
                quantity:number,
                }, "POST")
                .then(function(res) {
                    let _res = res;
                    if (_res.code == 200) {
                        wx.showToast({
                            title: '添加成功',
                        });
                       that.getCartCount()
                    } else {
                        wx.showToast({
                            image: '/images/icon/icon_error.png',
                            title: _res.msg,
                        });
                    }
                    wx.hideLoading()
                });
        }
    },
    fastToCart: function() {
        // 判断是否登录，如果没有登录，则登录
        util.loginNow();
        let userInfo = wx.getStorageSync('userInfo');
        if (userInfo == '') {
            return false;
        }
        var that = this;
        console.log(11221312312,this.data.openAttr)
        if (this.data.openAttr === false) {
            //打开规格选择窗口
            this.setData({
                openAttr: !this.data.openAttr
            });
            that.setData({
                alone_text: '加入购物车'
            })
        } else {
            //提示选择完整规格
            if (!this.isCheckedAllSpec()) {
                wx.showToast({
                    image: '/images/icon/icon_error.png',
                    title: '请选择规格',
                });
                return false;
            }
            if(this.data.specNumber<this.data.number){
                //找不到对应的product信息，提示没有库存
                wx.showToast({
                    image: '/images/icon/icon_error.png',
                    title: '库存不足',
                });
                return false;
            }
            //根据选中的规格，判断是否有对应的sku信息
            // let checkedProductArray = this.getCheckedProductItem(this.getCheckedSpecKey());
            // console.log('checkedProductArraycheckedProductArray',checkedProductArray)
            // if (!checkedProductArray || checkedProductArray.length <= 0) {
            //     //找不到对应的product信息，提示没有库存
            //     wx.showToast({
            //         image: '/images/icon/icon_error.png',
            //         title: '库存不足',
            //     });
            //     return false;
            // }
            // let checkedProduct = checkedProductArray[0];
            // //验证库存
            // if (checkedProduct.goods_number < this.data.number) {
            //     //要买的数量比库存多
            //     wx.showToast({
            //         image: '/images/icon/icon_error.png',
            //         title: '库存不足',
            //     });
            //     return false;
            // }
            //添加到购物车
            wx.showLoading({
                title: '',
                mask:true
              })
              const {number,checkedSpecPrice} = this.data
            util.request(api.CarGoodsInit, [{
                quantity: number, 
                isOos: 0, 
                singlePrice: checkedSpecPrice, 
                singleActualPrice: checkedSpecPrice 
                }], "POST")
                .then(function(res) {
                    let _res = res;
                    wx.hideLoading()
                    if (_res.code == 200) {
                        let id = that.data.id;
                        wx.navigateTo({
                            url: `/pages/order-check/index?addtype=1&totalActualPrice=${_res.data.totalActualPrice}&totalPrice=${_res.data.totalPrice}&number=${number}`
                        });
                    } else {
                        wx.showToast({
                            image: '/images/icon/icon_error.png',
                            title: _res.msg,
                        });
                    }
                });
        }
    },
    cutNumber: function() {
        this.setData({
            number: (this.data.number - 1 > 1) ? this.data.number - 1 : 1
        });
        this.setData({
            disabled: ''
        });
    },
    addNumber: function() {
        this.setData({
            number: Number(this.data.number) + 1
        });
        let checkedProductArray = this.getCheckedProductItem(this.getCheckedSpecKey());
        let checkedProduct = checkedProductArray;
        var check_number = this.data.number + 1;
        if (checkedProduct.goods_number < check_number) {
            this.setData({
                disabled: true
            });
        }
    }
})