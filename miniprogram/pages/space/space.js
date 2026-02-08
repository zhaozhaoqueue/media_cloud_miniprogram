import { createShareCode, getPhotos, getSpace, updateSpace } from '../../api/index'
import { toast } from '../../utils/extendApi'

const PAGE_SIZE = 10

Page({
  data: {
    spaceId: '',
    spaceName: '共享空间',
    photoCount: 0,
    memberCount: 0,
    photos: [],
    shareCode: '',
    shareExpireText: '',
    loading: false,
    renaming: false,
    photosPage: 1,
    photosTotal: 0,
    hasMorePhotos: false,
    loadingMorePhotos: false,
    showEmptyState: false,
    showNoMoreState: false
  },
  onLoad(query) {
    const { id } = query || {}
    this.setData({
      spaceId: id || ''
    })
  },
  onShow() {
    if (this.data.spaceId) {
      this.fetchSpaceData()
    }
  },
  onReachBottom() {
    this.loadMorePhotos()
  },
  async fetchSpaceData() {
    const { spaceId, loading } = this.data
    if (!spaceId || loading) return
    this.setData({ loading: true })
    try {
      const [space, photosRes] = await Promise.all([
        getSpace(spaceId),
        getPhotos(spaceId, { page: 1, pageSize: PAGE_SIZE, order: 'desc' })
      ])
      const photos = this.normalizePhotos(photosRes?.list || [])
      const total = Number(photosRes?.total ?? space?.photoCount ?? photos.length) || 0
      const hasMorePhotos = total > 0 ? photos.length < total : photos.length >= PAGE_SIZE
      const showEmptyState = photos.length === 0
      const showNoMoreState = photos.length > 0 && !hasMorePhotos
      this.setData({
        spaceName: space?.name || '共享空间',
        memberCount: space?.memberCount || 0,
        photoCount: space?.photoCount ?? total ?? photos.length,
        photos,
        photosPage: 1,
        photosTotal: total,
        hasMorePhotos,
        showEmptyState,
        showNoMoreState
      })
    } catch (error) {
      toast({ title: '空间数据加载失败', icon: 'none' })
      this.setData({
        photos: [],
        photoCount: 0,
        photosPage: 1,
        photosTotal: 0,
        hasMorePhotos: false,
        showEmptyState: true,
        showNoMoreState: false
      })
    } finally {
      this.setData({ loading: false })
    }
  },
  normalizePhotos(list = []) {
    return list.map((item) => ({
      ...item,
      displayUrl: item?.thumbUrl || item?.url || ''
    }))
  },
  async loadMorePhotos() {
    const { spaceId, loading, loadingMorePhotos, hasMorePhotos, photosPage, photos } = this.data
    if (!spaceId || loading || loadingMorePhotos || !hasMorePhotos) return

    const nextPage = photosPage + 1
    this.setData({ loadingMorePhotos: true, showNoMoreState: false })
    try {
      const res = await getPhotos(spaceId, { page: nextPage, pageSize: PAGE_SIZE, order: 'desc' })
      const list = this.normalizePhotos(res?.list || [])
      const total = Number(res?.total ?? this.data.photosTotal ?? 0)

      const exists = new Set(photos.map((item) => item.id))
      const appended = list.filter((item) => !exists.has(item.id))
      const merged = photos.concat(appended)
      const hasMore = total > 0 ? merged.length < total : list.length >= PAGE_SIZE

      this.setData({
        photos: merged,
        photosPage: nextPage,
        photosTotal: total || merged.length,
        hasMorePhotos: hasMore,
        showEmptyState: false,
        showNoMoreState: !hasMore && merged.length > 0
      })
    } catch (error) {
      toast({ title: '加载更多失败', icon: 'none' })
    } finally {
      this.setData({
        loadingMorePhotos: false,
        showNoMoreState: !this.data.hasMorePhotos && this.data.photos.length > 0
      })
    }
  },
  goUpload() {
    wx.navigateTo({ url: `/pages/upload/upload?spaceId=${this.data.spaceId}` })
  },
  async shareSpace() {
    const { spaceId } = this.data
    if (!spaceId) return
    try {
      const data = await createShareCode(spaceId, { expiresIn: 86400 })
      const expireText = this.formatDateTime(data?.expireAt)
      this.setData({
        shareCode: data?.shareCode || '',
        shareExpireText: expireText
      })
      wx.showToast({
        title: '分享码已生成',
        icon: 'success'
      })
    } catch (error) {
      toast({ title: '生成分享码失败', icon: 'none' })
    }
  },
  formatDateTime(input) {
    if (!input) return ''
    const date = new Date(input)
    if (Number.isNaN(date.getTime())) return ''
    const pad = (v) => String(v).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
      date.getHours()
    )}:${pad(date.getMinutes())}`
  },
  copyShareCode() {
    if (!this.data.shareCode) return
    wx.setClipboardData({
      data: this.data.shareCode
    })
  },
  editSpaceName() {
    const { spaceId, spaceName, renaming } = this.data
    if (!spaceId || renaming) return

    wx.showModal({
      title: '修改空间名称',
      editable: true,
      placeholderText: spaceName || '输入新名称',
      content: spaceName ? `当前名称：${spaceName}` : '',
      success: async ({ confirm, content }) => {
        if (!confirm) return
        const nextName = (content || '').trim()
        if (!nextName) {
          toast({ title: '名称不能为空', icon: 'none' })
          return
        }
        if (nextName === spaceName) return

        this.setData({ renaming: true })
        try {
          const data = await updateSpace(spaceId, { name: nextName })
          const updatedName = data?.name || nextName
          this.setData({
            spaceName: updatedName
          })
          toast({ title: '空间名称已更新', icon: 'success' })
        } catch (error) {
          toast({ title: '修改失败，请重试', icon: 'none' })
        } finally {
          this.setData({ renaming: false })
        }
      }
    })
  },
  openImage(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/image/image?id=${id}` })
  }
})
