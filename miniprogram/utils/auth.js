import { authLogin } from '../api/index'
import { getStorage, setStorage, removeStorage } from './storage'
import config from '../config'

const TOKEN_KEY = 'token'
const USER_KEY = 'user'

export const getToken = () => getStorage(TOKEN_KEY)

export const clearToken = () => {
  removeStorage(TOKEN_KEY)
  removeStorage(USER_KEY)
  removeStorage('userId')
}

export const login = (profile = {}) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('login timeout'))
    }, config.loginTimeoutMs || 8000)

    wx.login({
      success: async (res) => {
        try {
          if (!res.code) {
            clearTimeout(timer)
            return reject(new Error('no login code'))
          }
          const payload = { code: res.code }
          if (profile.nickname) {
            payload.nickname = profile.nickname
          }
          if (profile.avatar) {
            payload.avatar = profile.avatar
          }
          const data = await authLogin(payload)
          const token = data?.token
          const user = data?.user || {}
          if (!token) {
            clearTimeout(timer)
            return reject(new Error('no token'))
          }
          setStorage(TOKEN_KEY, token)
          const normalizedUser = { ...user }
          if (!normalizedUser.name && profile.nickname) {
            normalizedUser.name = profile.nickname
          }
          if (!normalizedUser.avatar && profile.avatar) {
            normalizedUser.avatar = profile.avatar
          }
          if (Object.keys(normalizedUser).length) {
            setStorage(USER_KEY, normalizedUser)
          }
          clearTimeout(timer)
          resolve(token)
        } catch (error) {
          clearTimeout(timer)
          reject(error)
        }
      },
      fail: (err) => {
        clearTimeout(timer)
        reject(err)
      }
    })
  })
}
