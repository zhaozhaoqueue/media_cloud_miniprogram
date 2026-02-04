import WxRequest from 'mina-request'
import { getStorage } from './storage'
import { toast } from './extendApi'


const instance = new WxRequest({
    baseURL: '',
    timeout: 15000
})


instance.interceptors.request = (config) => {
    const token = getStorage('token')
    if (token) {
        config.header['token'] = token
    }
    return config
}

instance.interceptors.response = (response) => {
    const { isSuccess, data } = response

    if (!isSuccess){
        toast({
            title: '网络异常请重试',
            icon: 'error'
        })
        return Promise.reject(response)
    }

    switch (data.code){
        case 200:
            return data
        default:
            toast({
                title: '程序异常'
            })
            return Promise.reject(response)
    }
}


export default instance