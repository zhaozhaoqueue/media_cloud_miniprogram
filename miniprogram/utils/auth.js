import { getStorage, setStorage, removeStorage } from './storage'
import config from '../config'

const TOKEN_KEY = 'token'
const USER_KEY = 'user'
const AUTH_PROVIDER = 'wechat_mini'

export const getToken = () => getStorage(TOKEN_KEY)

export const clearToken = () => {
  removeStorage(TOKEN_KEY)
  removeStorage(USER_KEY)
  removeStorage('userId')
}

const createError = (message, code, data) => {
  const error = new Error(message || '请求失败')
  error.code = code
  error.data = data
  return error
}

const parseDetailMessage = (detail) => {
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0]
    if (typeof first === 'string') return first
    if (first?.msg) return first.msg
  }
  if (detail && typeof detail === 'object' && typeof detail.msg === 'string') {
    return detail.msg
  }
  return ''
}

const normalizeAuthResult = (res) => {
  const body = res?.data || {}
  const statusCode = Number(res?.statusCode || 0)
  const isHttpSuccess = statusCode >= 200 && statusCode < 300
  const detailMsg = parseDetailMessage(body?.detail)
  const message = body?.msg || detailMsg || `HTTP ${statusCode}`

  if (!isHttpSuccess) {
    return {
      ok: false,
      httpStatus: statusCode,
      code: body?.code || statusCode,
      msg: message,
      data: body?.data ?? body?.detail
    }
  }

  if (body?.code === 0 || body?.code === 200) {
    return {
      ok: true,
      httpStatus: statusCode,
      data: body?.data ?? body
    }
  }

  if (body?.status === 'ok' || body?.token) {
    return {
      ok: true,
      httpStatus: statusCode,
      data: body
    }
  }

  return {
    ok: false,
    httpStatus: statusCode,
    code: body?.code,
    msg: message,
    data: body?.data
  }
}

const postAuth = (path, data = {}) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${config.apiBaseUrl}${path}`,
      method: 'POST',
      data,
      timeout: config.loginTimeoutMs || 8000,
      success: (res) => {
        resolve(normalizeAuthResult(res))
      },
      fail: (err) => {
        reject(createError(err?.errMsg || '网络异常请重试'))
      }
    })
  })
}

const requestWxLoginCode = () => {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (!res?.code) {
          reject(createError('获取登录凭证失败'))
          return
        }
        resolve(res.code)
      },
      fail: (err) => {
        reject(createError(err?.errMsg || '获取登录凭证失败'))
      }
    })
  })
}

const persistSession = (payload = {}, profileFallback = {}) => {
  const token = payload?.token
  if (!token) {
    throw createError('登录信息无效，请重试')
  }

  const user = payload?.user || {}
  const normalizedUser = { ...user }
  if (!normalizedUser.name && profileFallback.nickname) {
    normalizedUser.name = profileFallback.nickname
  }
  if (!normalizedUser.avatar && profileFallback.avatar) {
    normalizedUser.avatar = profileFallback.avatar
  }

  setStorage(TOKEN_KEY, token)
  if (Object.keys(normalizedUser).length) {
    setStorage(USER_KEY, normalizedUser)
  }
}

export const login = async (payload = {}) => {
  const wxCode = await requestWxLoginCode()
  const inviteCode = String(payload?.inviteCode || '').trim().toUpperCase()
  const loginPayload = {
    provider: AUTH_PROVIDER,
    code: wxCode
  }
  if (inviteCode) {
    loginPayload.inviteCode = inviteCode
  }

  const result = await postAuth('/api/v1/auth/login', loginPayload)

  if (result?.ok) {
    const data = result?.data || {}
    persistSession(data)
    return {
      token: data?.token,
      user: data?.user || {}
    }
  }

  throw createError(result?.msg || '登录失败，请重试', result?.code || result?.httpStatus, result?.data)
}
