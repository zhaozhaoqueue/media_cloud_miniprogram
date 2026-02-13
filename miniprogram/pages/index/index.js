import { createSpace, deleteSpace, getSpaces, joinSpace } from '../../api/index'
import { toast } from '../../utils/extendApi'

const mapSpacePermission = (space = {}) => {
  const role = String(space?.myRole || space?.role || '').trim().toLowerCase()
  const explicitCanDelete = space?.canDelete
  const canDelete = typeof explicitCanDelete === 'boolean' ? explicitCanDelete : (role ? role === 'owner' : true)
  return {
    ...space,
    role,
    canDelete
  }
}

Page({
  data: {
    spaces: [],
    showJoin: false,
    joinCode: '',
    loading: false,
    deletingSpaceId: ''
  },
  onShow() {
    this.fetchSpaces()
  },
  async fetchSpaces() {
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      const data = await getSpaces({ page: 1, pageSize: 30, order: 'desc' })
      const spaces = (data?.list || []).map(mapSpacePermission)
      this.setData({
        spaces
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
  },
  onDeleteSpace(e) {
    const spaceId = String(e.currentTarget.dataset.id || '').trim()
    const canDelete = e.currentTarget.dataset.canDelete !== false
    if (!spaceId || this.data.deletingSpaceId) return
    if (!canDelete) {
      toast({ title: '仅空间所有者可删除', icon: 'none' })
      return
    }
    wx.showModal({
      title: '删除空间',
      content: '确认删除该空间吗？空间下的全部图片会被一并删除。',
      success: async ({ confirm }) => {
        if (!confirm) return
        this.setData({ deletingSpaceId: spaceId })
        try {
          await deleteSpace(spaceId)
          toast({ title: '空间已删除', icon: 'success' })
          this.fetchSpaces()
        } catch (error) {
          toast({ title: '删除失败，请重试', icon: 'none' })
        } finally {
          this.setData({ deletingSpaceId: '' })
        }
      }
    })
  }
})
