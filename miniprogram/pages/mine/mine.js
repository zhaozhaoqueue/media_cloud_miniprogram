import { updateMyProfile } from '../../api/index'
import { toast } from '../../utils/extendApi'
import { getStorage, setStorage } from '../../utils/storage'

Page({
  data: {
    saving: false,
    syncingWechat: false,
    currentUser: {
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
    const name = String(user?.name || user?.nickname || '用户').trim() || '用户'
    const avatar = String(user?.avatar || '').trim()
    this.setData({
      currentUser: {
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
  onAvatarInput(e) {
    this.setData({
      'form.avatar': e?.detail?.value || ''
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
  async syncByWechat() {
    if (this.data.syncingWechat) return
    this.setData({ syncingWechat: true })
    try {
      const profile = await this.getWechatProfile()
      this.setData({
        'form.name': profile?.name || this.data.form.name,
        'form.avatar': profile?.avatar || this.data.form.avatar
      })
      toast({ title: '已填充微信资料', icon: 'success' })
    } catch (error) {
      const isCancel = String(error?.errMsg || '').includes('cancel')
      if (!isCancel) {
        toast({ title: '获取微信资料失败', icon: 'none' })
      }
    } finally {
      this.setData({ syncingWechat: false })
    }
  },
  async submitProfile() {
    if (this.data.saving) return
    const nextName = String(this.data.form?.name || '').trim()
    const nextAvatar = String(this.data.form?.avatar || '').trim()
    if (!nextName && !nextAvatar) {
      toast({ title: '请至少填写昵称或头像', icon: 'none' })
      return
    }

    const current = this.data.currentUser || {}
    if (nextName === current.name && nextAvatar === current.avatar) {
      toast({ title: '资料无变化', icon: 'none' })
      return
    }

    const payload = {}
    if (nextName) payload.name = nextName
    if (nextAvatar) payload.avatar = nextAvatar

    this.setData({ saving: true })
    try {
      const data = await updateMyProfile(payload)
      const responseUser = data?.user || data || {}
      const storedUser = getStorage('user') || {}
      const merged = {
        ...storedUser,
        ...responseUser,
        name: responseUser?.name || nextName || storedUser?.name || '用户',
        nickname: responseUser?.name || nextName || storedUser?.nickname || '用户',
        avatar: responseUser?.avatar || nextAvatar || storedUser?.avatar || ''
      }
      setStorage('user', merged)
      this.loadCurrentUser()
      toast({ title: '资料已更新', icon: 'success' })
    } catch (error) {
      toast({
        title: error?.message || '更新失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ saving: false })
    }
  }
})
