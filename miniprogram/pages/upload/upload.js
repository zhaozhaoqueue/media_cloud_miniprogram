Page({
  data: {
    selected: []
  },
  chooseImages() {
    wx.chooseImage({
      count: 9,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ selected: res.tempFilePaths })
      }
    })
  },
  startUpload() {
    wx.showModal({
      title: '上传图片',
      content: '后端上传接口未接入，当前仅展示选择与预览。',
      showCancel: false
    })
  }
})
