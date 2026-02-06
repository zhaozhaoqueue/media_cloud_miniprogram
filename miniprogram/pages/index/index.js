Page({
  data: {
    spaces: [
      { id: 'family', name: '家庭相册', count: 126, members: 4 },
      { id: 'team', name: '团队资料', count: 58, members: 7 },
      { id: 'travel', name: '旅行分享', count: 214, members: 9 }
    ],
    showJoin: false,
    joinCode: ''
  },
  goSpace(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/space/space?id=${id}` })
  },
  createSpace() {
    wx.showModal({
      title: '创建空间',
      content: '后端接口未接入，先进入示例空间浏览。',
      showCancel: false,
      success: () => {
        wx.navigateTo({ url: '/pages/space/space?id=family' })
      }
    })
  },
  joinSpace() {
    this.toggleJoin()
  },
  toggleJoin() {
    this.setData({
      showJoin: !this.data.showJoin,
      joinCode: ''
    })
  },
  onJoinInput(e) {
    this.setData({ joinCode: e.detail.value.toUpperCase() })
  },
  confirmJoin() {
    wx.showModal({
      title: '加入空间',
      content: '后端接口未接入，先进入示例空间浏览。',
      showCancel: false,
      success: () => {
        this.setData({ showJoin: false, joinCode: '' })
        wx.navigateTo({ url: '/pages/space/space?id=team' })
      }
    })
  }
})
