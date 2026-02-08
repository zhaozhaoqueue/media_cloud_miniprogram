import { getToken, login } from '../../utils/auth'
import { toast } from '../../utils/extendApi'

Page({
  data: {
    loading: false
  },
  onShow() {
    const token = getToken()
    if (token) {
      wx.reLaunch({ url: '/pages/index/index' })
    }
  },
  askProfileConsent() {
    return new Promise((resolve) => {
      wx.showModal({
        title: '完善个人信息',
        content: '是否允许获取你的昵称和头像？你也可以选择跳过。',
        confirmText: '允许',
        cancelText: '跳过',
        success: ({ confirm }) => resolve(confirm),
        fail: () => resolve(false)
      })
    })
  },
  getUserProfileOptional() {
    return new Promise((resolve) => {
      if (!wx.getUserProfile) {
        resolve({})
        return
      }
      wx.getUserProfile({
        desc: '用于展示你的昵称和头像',
        lang: 'zh_CN',
        success: (res) => {
          const userInfo = res?.userInfo || {}
          resolve({
            nickname: userInfo.nickName || '',
            avatar: userInfo.avatarUrl || ''
          })
        },
        fail: () => resolve({})
      })
    })
  },
  async handleLogin() {
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      let profile = {}
      const allowProfile = await this.askProfileConsent()
      if (allowProfile) {
        profile = await this.getUserProfileOptional()
      }
      await login(profile)
      wx.reLaunch({ url: '/pages/index/index' })
    } catch (error) {
      toast({
        title: '登录失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  }
})
