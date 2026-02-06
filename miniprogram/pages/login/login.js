import { login, getToken } from '../../utils/auth'
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
  async handleLogin() {
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      // await login()
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
