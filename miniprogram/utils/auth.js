import { authLogin } from '../api/index'
import { getStorage, setStorage, removeStorage } from './storage'
import config from '../config'

const TOKEN_KEY = 'token'

export const getToken = () => getStorage(TOKEN_KEY)

export const clearToken = () => removeStorage(TOKEN_KEY)

export const login = () => {
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
          const data = await authLogin(res.code)
          const token = data?.token
          if (!token) {
            clearTimeout(timer)
            return reject(new Error('no token'))
          }
          setStorage(TOKEN_KEY, token)
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
