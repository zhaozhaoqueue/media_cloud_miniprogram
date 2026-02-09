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

export const login = async () => {
  const wxCode = await requestWxLoginCode()
  const result = await postAuth('/api/v1/auth/login', {
    provider: AUTH_PROVIDER,
    code: wxCode
  })

  if (result.ok) {
    const data = result?.data || {}
    if (data?.needRegister === true || data?.registered === false) {
      return {
        needRegister: true,
        wxCode,
        registerTicket: data?.registerTicket || data?.ticket || ''
      }
    }
    persistSession(data)
    return {
      needRegister: false,
      token: data?.token,
      user: data?.user || {}
    }
  }

  if (result?.httpStatus === 404) {
    return {
      needRegister: true,
      wxCode,
      registerTicket: ''
    }
  }

  throw createError(result?.msg || '登录失败，请重试', result?.code || result?.httpStatus, result?.data)
}

export const register = async (payload = {}) => {
  const wxCode = String(payload?.wxCode || '').trim()
  const registerTicket = String(payload?.registerTicket || '').trim()
  const nickname = String(payload?.nickname || '').trim()
  const avatar = String(payload?.avatar || '').trim()
  const accessCode = String(payload?.accessCode || '').trim()

  if (!wxCode) {
    throw createError('登录态已过期，请返回重新登录')
  }
  if (!nickname || !avatar || !accessCode) {
    throw createError('请完整填写头像、昵称和 accessCode')
  }

  const registerPayload = {
    provider: AUTH_PROVIDER,
    code: wxCode,
    nickname,
    avatar,
    accessCode
  }
  if (registerTicket) {
    registerPayload.registerTicket = registerTicket
  }

  const result = await postAuth('/api/v1/auth/register', registerPayload)
  if (!result?.ok) {
    throw createError(result?.msg || '注册失败，请重试', result?.code || result?.httpStatus, result?.data)
  }

  const data = result?.data || {}
  persistSession(data, { nickname, avatar })
  return data
}
