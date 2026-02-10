import { getToken, login } from '../../utils/auth'
import { toast } from '../../utils/extendApi'

Page({
  data: {
    loading: false,
    inviteCode: ''
  },
  onShow() {
    const token = getToken()
    if (token) {
      wx.reLaunch({ url: '/pages/index/index' })
    }
  },
  onInviteCodeInput(e) {
    this.setData({
      inviteCode: (e?.detail?.value || '').trim().toUpperCase()
    })
  },
  async handleLogin() {
    if (this.data.loading) return

    this.setData({ loading: true })
    try {
      await login({
        inviteCode: this.data.inviteCode
      })
      wx.reLaunch({ url: '/pages/index/index' })
    } catch (error) {
      toast({
        title: error?.message || '登录失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  }
})
