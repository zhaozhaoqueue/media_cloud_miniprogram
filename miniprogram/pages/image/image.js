Page({
  data: {
    image: {
      id: 'p1',
      name: '封面照',
      owner: 'Luka',
      date: '2026-02-04',
      url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1000'
    }
  },
  onLoad(query) {
    const { id } = query
    const images = {
      p1: {
        id: 'p1',
        name: '封面照',
        owner: 'Luka',
        date: '2026-02-04',
        url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1000'
      },
      p2: {
        id: 'p2',
        name: '日常',
        owner: 'Mina',
        date: '2026-02-01',
        url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1000'
      },
      p3: {
        id: 'p3',
        name: '旅行',
        owner: 'Navi',
        date: '2026-01-28',
        url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1000'
      }
    }
    if (images[id]) {
      this.setData({ image: images[id] })
    }
  },
  downloadImage() {
    wx.showModal({
      title: '下载图片',
      content: '后端下载接口未接入，可先使用预览中的保存。',
      showCancel: false
    })
  },
  previewImage() {
    wx.previewImage({
      urls: [this.data.image.url]
    })
  }
})
