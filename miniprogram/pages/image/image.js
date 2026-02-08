import { deletePhoto, getDownloadUrl, getPhoto, updatePhoto } from '../../api/index'
import { toast } from '../../utils/extendApi'

Page({
  data: {
    renaming: false,
    deleting: false,
    deleteButtonText: '删除图片',
    image: {
      id: '',
      name: '未命名图片',
      ownerName: '',
      createdAtText: '',
      url: ''
    }
  },
  async onLoad(query) {
    const { id } = query || {}
    if (!id) return
    try {
      const image = await getPhoto(id)
      this.setData({
        image: {
          id: image?.id || id,
          name: image?.name || '未命名图片',
          ownerName: image?.ownerName || '-',
          createdAtText: this.formatDateTime(image?.createdAt),
          url: image?.url || image?.thumbUrl || ''
        }
      })
    } catch (error) {
      toast({ title: '图片加载失败', icon: 'none' })
    }
  },
  formatDateTime(input) {
    if (!input) return '-'
    const date = new Date(input)
    if (Number.isNaN(date.getTime())) return '-'
    const pad = (v) => String(v).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  },
  async downloadImage() {
    const photoId = this.data.image?.id
    if (!photoId) return
    wx.showLoading({ title: '下载中' })
    try {
      const data = await getDownloadUrl(photoId)
      const downloadUrl = data?.downloadUrl
      if (!downloadUrl) {
        throw new Error('no downloadUrl')
      }
      wx.downloadFile({
        url: downloadUrl,
        success: ({ statusCode, tempFilePath }) => {
          if (statusCode !== 200 || !tempFilePath) {
            toast({ title: '下载失败', icon: 'none' })
            return
          }
          wx.saveImageToPhotosAlbum({
            filePath: tempFilePath,
            success: () => toast({ title: '已保存到相册', icon: 'success' }),
            fail: () => toast({ title: '保存失败，请检查相册权限', icon: 'none' })
          })
        },
        fail: () => toast({ title: '下载失败', icon: 'none' }),
        complete: () => wx.hideLoading()
      })
    } catch (error) {
      wx.hideLoading()
      toast({ title: '下载失败', icon: 'none' })
    }
  },
  previewImage() {
    if (!this.data.image.url) return
    wx.previewImage({
      urls: [this.data.image.url]
    })
  },
  editImageName() {
    const photoId = this.data.image?.id
    if (!photoId || this.data.renaming) return
    const currentName = this.data.image?.name || ''

    wx.showModal({
      title: '修改图片名称',
      editable: true,
      placeholderText: currentName || '请输入图片名称',
      content: currentName ? `当前名称：${currentName}` : '',
      success: async ({ confirm, content }) => {
        if (!confirm) return
        const nextName = (content || '').trim()
        if (!nextName) {
          toast({ title: '名称不能为空', icon: 'none' })
          return
        }
        if (nextName === currentName) return

        this.setData({ renaming: true })
        try {
          const data = await updatePhoto(photoId, { name: nextName })
          this.setData({
            'image.name': data?.name || nextName
          })
          toast({ title: '名称已更新', icon: 'success' })
        } catch (error) {
          toast({ title: '修改失败，请重试', icon: 'none' })
        } finally {
          this.setData({ renaming: false })
        }
      }
    })
  },
  deleteImage() {
    const photoId = this.data.image?.id
    if (!photoId || this.data.deleting) return
    wx.showModal({
      title: '删除图片',
      content: '删除后不可恢复，确定删除这张图片吗？',
      confirmColor: '#d93025',
      success: async ({ confirm }) => {
        if (!confirm) return
        this.setData({ deleting: true })
        this.setData({ deleteButtonText: '删除中...' })
        wx.showLoading({ title: '删除中' })
        try {
          await deletePhoto(photoId)
          wx.hideLoading()
          toast({ title: '删除成功', icon: 'success' })
          setTimeout(() => {
            wx.navigateBack()
          }, 200)
        } catch (error) {
          wx.hideLoading()
          toast({ title: '删除失败，请重试', icon: 'none' })
        } finally {
          this.setData({
            deleting: false,
            deleteButtonText: '删除图片'
          })
        }
      }
    })
  }
})
