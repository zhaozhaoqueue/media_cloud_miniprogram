Page({
  data: {
    spaceName: '共享空间',
    photoCount: 0,
    memberCount: 0,
    photos: [],
    shareCode: '',
    shareExpireText: ''
  },
  onLoad(query) {
    const { id } = query
    const spaces = {
      family: { name: '家庭相册', members: 4 },
      team: { name: '团队资料', members: 7 },
      travel: { name: '旅行分享', members: 9 }
    }
    const info = spaces[id] || { name: '共享空间', members: 3 }
    const photos = [
      { id: 'p1', name: '封面照', url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800' },
      { id: 'p2', name: '日常', url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800' },
      { id: 'p3', name: '旅行', url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800' },
      { id: 'p4', name: '活动', url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800' },
      { id: 'p5', name: '聚会', url: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=800' },
      { id: 'p6', name: '小记', url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800' }
    ]

    this.setData({
      spaceName: info.name,
      memberCount: info.members,
      photos,
      photoCount: photos.length
    })
  },
  goUpload() {
    wx.navigateTo({ url: '/pages/upload/upload' })
  },
  shareSpace() {
    const now = new Date()
    const expire = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const code = Math.random().toString(36).slice(2, 8).toUpperCase()
    const pad = (v) => String(v).padStart(2, '0')
    const expireText = `${expire.getFullYear()}-${pad(expire.getMonth() + 1)}-${pad(
      expire.getDate()
    )} ${pad(expire.getHours())}:${pad(expire.getMinutes())}`

    this.setData({
      shareCode: code,
      shareExpireText: expireText
    })

    wx.showToast({
      title: '分享码已生成',
      icon: 'success'
    })
  },
  copyShareCode() {
    if (!this.data.shareCode) return
    wx.setClipboardData({
      data: this.data.shareCode
    })
  },
  openImage(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/image/image?id=${id}` })
  }
})
