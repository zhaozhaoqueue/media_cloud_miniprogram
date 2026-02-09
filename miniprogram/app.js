// app.js
import { toast } from 'utils/extendApi'
import { getToken } from 'utils/auth'

const AUTH_FREE_ROUTES = ['pages/login/login', 'pages/register/register']

App({
  async onShow() {
    try {
      const token = getToken()
      const pages = getCurrentPages()
      const currentRoute = pages[pages.length - 1]?.route || ''
      if (AUTH_FREE_ROUTES.includes(currentRoute)) {
        return
      }
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
