import { getMyAvatarUploadToken, updateMyProfile } from '../../api/index'
import { clearToken } from '../../utils/auth'
import { toast } from '../../utils/extendApi'
import { getStorage, setStorage } from '../../utils/storage'

const inferMimeType = (filePath = '') => {
  const lower = String(filePath || '').toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.gif')) return 'image/gif'
  return 'image/jpeg'
}

const fileNameFromPath = (filePath = '') => {
  const parts = String(filePath || '').split('/')
  return parts[parts.length - 1] || `avatar_${Date.now()}.jpg`
}

Page({
  data: {
    saving: false,
    hasPendingAvatar: false,
    lastAvatarFileId: '',
    loggingOut: false,
    currentUser: {
      id: '',
      name: '用户',
      avatar: '',
      initial: '用'
    },
    form: {
      name: '',
      avatar: ''
    }
  },
  onShow() {
    this.loadCurrentUser()
  },
  loadCurrentUser() {
    const user = getStorage('user') || {}
    const id = String(user?.id || '').trim()
    const name = String(user?.name || user?.nickname || '用户').trim() || '用户'
    const avatar = String(user?.avatar || '').trim()
    this.setData({
      currentUser: {
        id,
        name,
        avatar,
        initial: name.slice(0, 1).toUpperCase()
      },
      form: {
        name,
        avatar
      }
    })
  },
  onNameInput(e) {
    this.setData({
      'form.name': e?.detail?.value || ''
    })
  },
  onChooseAvatar(e) {
    const avatarPath = String(e?.detail?.avatarUrl || '').trim()
    if (!avatarPath) return
    this.setData({
      'form.avatar': avatarPath,
      hasPendingAvatar: true
    })
  },
  getFileSize(filePath) {
    return new Promise((resolve) => {
      wx.getFileInfo({
        filePath,
        success: (res) => resolve(Number(res?.size || 0)),
        fail: () => resolve(0)
      })
    })
  },
  readFileBinary(filePath) {
    return new Promise((resolve, reject) => {
      wx.getFileSystemManager().readFile({
        filePath,
        success: ({ data }) => resolve(data),
        fail: reject
      })
    })
  },
  uploadBySignedUrl(filePath, uploadInfo = {}) {
    return this.readFileBinary(filePath).then((binary) => {
      return new Promise((resolve, reject) => {
        wx.request({
          url: uploadInfo.uploadUrl,
          method: uploadInfo.method || 'PUT',
          header: uploadInfo.headers || {},
          data: binary,
          success: ({ statusCode }) => {
            if (statusCode >= 200 && statusCode < 300) {
              resolve(true)
            } else {
              reject(new Error(`upload status: ${statusCode}`))
            }
          },
          fail: reject
        })
      })
    })
  },
  async uploadPendingAvatarIfNeeded() {
    if (!this.data.hasPendingAvatar) {
      return {}
    }
    const avatarPath = String(this.data.form?.avatar || '').trim()
    if (!avatarPath) {
      return {}
    }
    const name = fileNameFromPath(avatarPath)
    const mimeType = inferMimeType(avatarPath)
    const size = await this.getFileSize(avatarPath)
    if (size <= 0) {
      throw new Error('头像文件无效，请重新选择')
    }
    const tokenData = await getMyAvatarUploadToken({
      name,
      type: mimeType,
      size
    })
    const uploadInfo = tokenData?.upload || tokenData || {}
    if (!uploadInfo?.uploadUrl || !uploadInfo?.fileId) {
      throw new Error('头像上传凭证无效')
    }
    await this.uploadBySignedUrl(avatarPath, uploadInfo)
    this.setData({ lastAvatarFileId: uploadInfo.fileId })
    return {
      avatarFileId: uploadInfo.fileId,
      avatar: uploadInfo.finalUrl || ''
    }
  },
  async onSaveProfile() {
    if (this.data.saving) return
    const oldUser = getStorage('user') || {}
    const currentName = String(this.data.currentUser?.name || '').trim()
    const nextName = String(this.data.form?.name || '').trim()
    const hasNameChange = !!nextName && nextName !== currentName
    const hasAvatarChange = !!this.data.hasPendingAvatar

    if (!hasNameChange && !hasAvatarChange) {
      toast({ title: '资料无变化', icon: 'none' })
      return
    }

    this.setData({ saving: true })
    wx.showLoading({ title: '保存中' })
    try {
      const payload = {}
      if (hasNameChange) {
        payload.name = nextName
      }
      const avatarPayload = await this.uploadPendingAvatarIfNeeded()
      if (avatarPayload.avatarFileId) {
        payload.avatarFileId = avatarPayload.avatarFileId
      }
      if (hasAvatarChange && !payload.avatarFileId) {
        throw new Error('头像上传失败，请重试')
      }

      const data = await updateMyProfile(payload)
      const responseUser = data?.user || data || {}
      const nextAvatarFileId =
        responseUser?.avatarFileId ||
        payload?.avatarFileId ||
        oldUser?.avatarFileId ||
        ''
      const merged = {
        ...oldUser,
        ...responseUser,
        id: responseUser?.id || oldUser?.id || '',
        name: responseUser?.name || nextName || oldUser?.name || oldUser?.nickname || '用户',
        nickname: responseUser?.name || nextName || oldUser?.nickname || '用户',
        avatar: responseUser?.avatar || avatarPayload?.avatar || oldUser?.avatar || '',
        avatarFileId: nextAvatarFileId
      }
      setStorage('user', merged)
      this.setData({
        hasPendingAvatar: false,
        lastAvatarFileId: nextAvatarFileId
      })
      this.loadCurrentUser()
      toast({ title: '资料已更新', icon: 'success' })
    } catch (error) {
      toast({ title: error?.message || '更新失败，请重试', icon: 'none' })
    } finally {
      wx.hideLoading()
      this.setData({ saving: false })
    }
  },
  onLogout() {
    if (this.data.loggingOut) return
    wx.showModal({
      title: '退出登录',
      content: '确认退出当前账号吗？',
      success: ({ confirm }) => {
        if (!confirm) return
        this.setData({ loggingOut: true })
        try {
          clearToken()
          wx.reLaunch({ url: '/pages/login/login' })
        } finally {
          this.setData({ loggingOut: false })
        }
      }
    })
  }
})
