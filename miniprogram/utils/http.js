import WxRequest from 'mina-request'
import { getStorage } from './storage'
import { toast } from './extendApi'
import appConfig from '../config'


const API_BASE_URL = appConfig.apiBaseUrl || ''

const instance = new WxRequest({
    baseURL: API_BASE_URL,
    timeout: 15000
})

instance.patch = (url, data = {}, reqConfig = {}) => {
    return instance.request(Object.assign({ url, data, method: 'PATCH' }, reqConfig))
}


instance.interceptors.request = (requestConfig) => {
    requestConfig.header = requestConfig.header || {}
    const token = getStorage('token')
    if (token) {
        requestConfig.header['Authorization'] = `Bearer ${token}`
    }
    return requestConfig
}

instance.interceptors.response = (response) => {
    const { isSuccess, data } = response

    if (!isSuccess) {
        toast({
            title: '网络异常请重试',
            icon: 'error'
        })
        return Promise.reject(response)
    }

    const code = data?.code
    if (code === 0 || code === 200) {
        return data?.data ?? data
    }
    if (data?.status === 'ok') {
        return data
    }

    toast({
        title: data?.msg || '程序异常'
    })
    return Promise.reject(response)
}


export default instance
