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
  async handleLogin() {
    if (this.data.loading) return

    this.setData({ loading: true })
    try {
      const result = await login()
      if (result?.needRegister) {
        const code = encodeURIComponent(result?.wxCode || '')
        const ticket = encodeURIComponent(result?.registerTicket || '')
        wx.navigateTo({
          url: `/pages/register/register?code=${code}&ticket=${ticket}`
        })
        return
      }

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
