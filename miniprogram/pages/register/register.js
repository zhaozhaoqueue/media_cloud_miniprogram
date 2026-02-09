import { getToken, register } from '../../utils/auth'
import { toast } from '../../utils/extendApi'

Page({
  data: {
    wxCode: '',
    registerTicket: '',
    nickname: '',
    avatar: '',
    accessCode: '',
    loading: false,
    fetchingProfile: false,
    canSubmit: false
  },
  onLoad(query) {
    const wxCode = decodeURIComponent(query?.code || '')
    const registerTicket = decodeURIComponent(query?.ticket || '')
    this.setData({
      wxCode,
      registerTicket
    })
    if (!wxCode) {
      this.refreshWxCode()
    }
    this.updateCanSubmit()
    this.promptProfilePrefill()
  },
  onShow() {
    const token = getToken()
    if (token) {
      wx.reLaunch({ url: '/pages/index/index' })
    }
  },
  promptProfilePrefill() {
    if (!wx.getUserProfile) return
    wx.showModal({
      title: '预填资料',
      content: '是否使用微信头像和昵称自动填充注册信息？',
      confirmText: '使用',
      cancelText: '手动填写',
      success: ({ confirm }) => {
        if (confirm) {
          this.fillByWechatProfile()
        }
      }
    })
  },
  refreshWxCode() {
    wx.login({
      success: (res) => {
        const nextCode = res?.code || ''
        this.setData(
          {
            wxCode: nextCode
          },
          () => this.updateCanSubmit()
        )
      },
      fail: () => {
        toast({ title: '登录态已过期，请返回重试', icon: 'none' })
      }
    })
  },
  fillByWechatProfile() {
    if (this.data.fetchingProfile || !wx.getUserProfile) return
    this.setData({ fetchingProfile: true })
    wx.getUserProfile({
      desc: '用于注册时预填头像和昵称',
      lang: 'zh_CN',
      success: (res) => {
        const userInfo = res?.userInfo || {}
        this.setData(
          {
            nickname: userInfo.nickName || this.data.nickname,
            avatar: userInfo.avatarUrl || this.data.avatar
          },
          () => this.updateCanSubmit()
        )
      },
      fail: () => {
        toast({ title: '未获取到微信资料，可手动填写', icon: 'none' })
      },
      complete: () => {
        this.setData({ fetchingProfile: false })
      }
    })
  },
  onAvatarInput(e) {
    this.setData(
      {
        avatar: e?.detail?.value || ''
      },
      () => this.updateCanSubmit()
    )
  },
  onNicknameInput(e) {
    this.setData(
      {
        nickname: e?.detail?.value || ''
      },
      () => this.updateCanSubmit()
    )
  },
  onAccessCodeInput(e) {
    this.setData(
      {
        accessCode: e?.detail?.value || ''
      },
      () => this.updateCanSubmit()
    )
  },
  updateCanSubmit() {
    const canSubmit =
      !!String(this.data.wxCode || '').trim() &&
      !!String(this.data.avatar || '').trim() &&
      !!String(this.data.nickname || '').trim() &&
      !!String(this.data.accessCode || '').trim()
    this.setData({ canSubmit })
  },
  async handleRegister() {
    if (this.data.loading) return
    if (!this.data.canSubmit) {
      toast({ title: '请完整填写注册信息', icon: 'none' })
      return
    }

    this.setData({ loading: true })
    try {
      await register({
        wxCode: String(this.data.wxCode || '').trim(),
        registerTicket: String(this.data.registerTicket || '').trim(),
        nickname: String(this.data.nickname || '').trim(),
        avatar: String(this.data.avatar || '').trim(),
        accessCode: String(this.data.accessCode || '').trim()
      })
      wx.reLaunch({ url: '/pages/index/index' })
    } catch (error) {
      toast({
        title: error?.message || '注册失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  }
})
