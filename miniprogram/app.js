// app.js
import { toast } from 'utils/extendApi'
import { login, getToken } from 'utils/auth'

App({
  async onShow() {
    try {
      const token = getToken()
      if (!token) {
        wx.reLaunch({ url: '/pages/login/login' })
        return
      }
    } catch (error) {
      toast({
        title: '登录失败，请稍后重试',
        icon: 'none'
      })
    }
  }
})
