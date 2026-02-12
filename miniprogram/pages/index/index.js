import { createSpace, getSpaces, joinSpace } from '../../api/index'
import { toast } from '../../utils/extendApi'

Page({
  data: {
    spaces: [],
    showJoin: false,
    joinCode: '',
    loading: false
  },
  onShow() {
    this.fetchSpaces()
  },
  async fetchSpaces() {
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      const data = await getSpaces({ page: 1, pageSize: 30, order: 'desc' })
      this.setData({
        spaces: data?.list || []
      })
    } catch (error) {
      this.setData({ spaces: [] })
    } finally {
      this.setData({ loading: false })
    }
  },
  goSpace(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/space/space?id=${id}` })
  },
  createSpace() {
    wx.showModal({
      title: '创建空间',
      editable: true,
      placeholderText: '输入空间名称',
      success: async ({ confirm, content }) => {
        if (!confirm) return
        const name = (content || '').trim() || `新空间${Date.now().toString().slice(-4)}`
        try {
          const data = await createSpace({ name })
          if (data?.id) {
            wx.navigateTo({ url: `/pages/space/space?id=${data.id}` })
            this.fetchSpaces()
            return
          }
          toast({ title: '创建失败', icon: 'none' })
        } catch (error) {
          toast({ title: '创建失败', icon: 'none' })
        }
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
  async confirmJoin() {
    const shareCode = (this.data.joinCode || '').trim().toUpperCase()
    if (!shareCode) return
    try {
      const data = await joinSpace({ shareCode })
      this.setData({ showJoin: false, joinCode: '' })
      if (data?.spaceId) {
        wx.navigateTo({ url: `/pages/space/space?id=${data.spaceId}` })
        this.fetchSpaces()
      } else {
        toast({ title: '加入失败', icon: 'none' })
      }
    } catch (error) {
      toast({ title: '分享码无效或已过期', icon: 'none' })
    }
  }
})
