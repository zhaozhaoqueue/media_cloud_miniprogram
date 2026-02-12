import { updateMyProfile } from '../../api/index'
import { clearToken } from '../../utils/auth'
import { toast } from '../../utils/extendApi'
import { getStorage, setStorage } from '../../utils/storage'

Page({
  data: {
    updatingAvatar: false,
    updatingName: false,
    loggingOut: false,
    currentUser: {
      id: '',
      name: '用户',
      avatar: '',
      initial: '用'
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
      }
    })
  },
  getWechatProfile() {
    return new Promise((resolve, reject) => {
      if (!wx.getUserProfile) {
        reject(new Error('当前微信版本不支持'))
        return
      }
      wx.getUserProfile({
        desc: '用于更新头像和昵称',
        lang: 'zh_CN',
        success: (res) => {
          const info = res?.userInfo || {}
          resolve({
            name: info.nickName || '',
            avatar: info.avatarUrl || ''
          })
        },
        fail: (error) => reject(error)
      })
    })
  },
  async persistUserProfile(payload = {}, successTitle = '资料已更新') {
    const oldUser = getStorage('user') || {}
    const userId = String(this.data.currentUser?.id || oldUser?.id || '').trim()
    if (!userId) {
      toast({ title: '用户信息缺失，请重新登录', icon: 'none' })
      return false
    }
    const data = await updateMyProfile({
      userId,
      ...payload
    })
    const responseUser = data?.user || data || {}
    const nextName =
      responseUser?.name ||
      String(payload?.name || '').trim() ||
      oldUser?.name ||
      oldUser?.nickname ||
      '用户'
    const nextAvatar =
      responseUser?.avatar ||
      String(payload?.avatar || '').trim() ||
      oldUser?.avatar ||
      ''
    const merged = {
      ...oldUser,
      ...responseUser,
      id: responseUser?.id || userId,
      name: nextName,
      nickname: nextName,
      avatar: nextAvatar
    }
    setStorage('user', merged)
    this.loadCurrentUser()
    toast({ title: successTitle, icon: 'success' })
    return true
  },
  async onAvatarTap() {
    if (this.data.updatingAvatar) return
    this.setData({ updatingAvatar: true })
    try {
      const profile = await this.getWechatProfile()
      const avatar = String(profile?.avatar || '').trim()
      if (!avatar) {
        toast({ title: '未获取到头像', icon: 'none' })
        return
      }
      await this.persistUserProfile({ avatar }, '头像已更新')
    } catch (error) {
      const isCancel = String(error?.errMsg || '').includes('cancel')
      if (!isCancel) {
        toast({ title: '头像更新失败，请重试', icon: 'none' })
      }
    } finally {
      this.setData({ updatingAvatar: false })
    }
  },
  onNameTap() {
    const currentName = String(this.data.currentUser?.name || '').trim()
    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: currentName || '请输入昵称',
      success: ({ confirm, content }) => {
        if (!confirm) return
        const inputName = String(content || '').trim()
        const nextName = inputName || currentName
        if (!nextName) {
          toast({ title: '昵称不能为空', icon: 'none' })
          return
        }
        this.submitNameUpdate(nextName)
      }
    })
  },
  async submitNameUpdate(name) {
    if (this.data.updatingName) return
    this.setData({ updatingName: true })
    try {
      await this.persistUserProfile({ name }, '昵称已更新')
    } catch (error) {
      toast({ title: error?.message || '昵称更新失败，请重试', icon: 'none' })
    } finally {
      this.setData({ updatingName: false })
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
