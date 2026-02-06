import WxRequest from 'mina-request'
import { getStorage } from './storage'
import { toast } from './extendApi'
import config from '../config'


const API_BASE_URL = config.apiBaseUrl || ''

const instance = new WxRequest({
    baseURL: API_BASE_URL,
    timeout: 15000
})


instance.interceptors.request = (config) => {
    const token = getStorage('token')
    if (token) {
        config.header['token'] = token
        config.header['Authorization'] = `Bearer ${token}`
    }
    return config
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

    toast({
        title: data?.msg || '程序异常'
    })
    return Promise.reject(response)
}


export default instance
