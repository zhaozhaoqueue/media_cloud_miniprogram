import { createSpace, getSpaces, joinSpace, updateMyProfile } from '../../api/index'
import { toast } from '../../utils/extendApi'
import { getStorage, setStorage } from '../../utils/storage'

Page({
  data: {
    spaces: [],
    showJoin: false,
    joinCode: '',
    loading: false,
    syncingProfile: false,
    currentUser: {
      id: '',
      name: '用户',
      avatar: '',
      initial: '用'
    }
  },
  onShow() {
    this.loadCurrentUser()
    this.fetchSpaces()
  },
  loadCurrentUser() {
    const user = getStorage('user') || {}
    const userId = String(user?.id || '').trim()
    const name = (user?.name || user?.nickname || '用户').trim() || '用户'
    const avatar = user?.avatar || ''
    this.setData({
      currentUser: {
        id: userId,
        name,
        avatar,
        initial: name.slice(0, 1).toUpperCase()
      }
    })
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
  getWechatProfile() {
    return new Promise((resolve, reject) => {
      if (!wx.getUserProfile) {
        reject(new Error('当前基础库不支持获取微信资料'))
        return
      }
      wx.getUserProfile({
        desc: '用于更新头像和昵称',
        lang: 'zh_CN',
        success: (res) => {
          const info = res?.userInfo || {}
          resolve({
            nickname: info.nickName || '',
            avatar: info.avatarUrl || ''
          })
        },
        fail: (error) => reject(error)
      })
    })
  },
  async syncWechatProfile() {
    if (this.data.syncingProfile) return
    this.setData({ syncingProfile: true })
    try {
      const profile = await this.getWechatProfile()
      const name = String(profile?.nickname || '').trim()
      const avatar = String(profile?.avatar || '').trim()
      if (!name && !avatar) {
        toast({ title: '未获取到资料', icon: 'none' })
        return
      }

      const currentStoredUser = getStorage('user') || {}
      const userId = String(this.data.currentUser?.id || currentStoredUser?.id || '').trim()
      if (!userId) {
        toast({ title: '缺少用户ID，请重新登录', icon: 'none' })
        return
      }

      const data = await updateMyProfile({ userId, name, avatar })
      const oldUser = getStorage('user') || {}
      const responseUser = data?.user || data || {}
      const nextName =
        responseUser?.name ||
        name ||
        responseUser?.nickname ||
        oldUser?.name ||
        oldUser?.nickname ||
        '用户'
      const nextAvatar = responseUser?.avatar || avatar || oldUser?.avatar || ''
      const mergedUser = {
        ...oldUser,
        ...responseUser,
        name: nextName,
        nickname: nextName,
        avatar: nextAvatar,
        id: responseUser?.id || userId
      }
      setStorage('user', mergedUser)
      this.loadCurrentUser()
      toast({ title: '昵称和头像已更新', icon: 'success' })
    } catch (error) {
      const isCancel = String(error?.errMsg || '').includes('cancel')
      if (!isCancel) {
        toast({ title: '更新失败，请重试', icon: 'none' })
      }
    } finally {
      this.setData({ syncingProfile: false })
    }
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
