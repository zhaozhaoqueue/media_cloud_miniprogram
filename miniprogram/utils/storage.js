export const setStorage = (key, value) => {
    try {
        wx.setStorageSync(key, value)
    } catch (error) {
        console.error(`存储指定 ${key} 数据发生异常`, error)
    }
}

export const getStorage = (key) => {
    try {
        const value = wx.getStorageSync(key)
        if (value){
            return value
        }
    } catch (error){
        console.error(`读取指定 ${key} 数据发生异常`, error)
    }
}

export const removeStorage = (key) => {
    try {
        wx.removeStorageSync(key)
    } catch (error){
        console.error(`移除指定 ${key} 数据发生异常`, error)
    }
}

export const clearStorage = () => {
    try {
        wx.removeStorageSync()
    } catch (error) {
        console.error(`清除数据发生了异常`, error)
    }
}

export const asyncSetStorage = (key, data) => {
    return new Promise((resolve) => {
        wx.setStorage({
            key,
            data,
            complete(res) {
                resolve(res)
            }
        })
    })
}

export const asyncGetStorage = (key) => {
    return new Promise((resolve) => {
        wx.getStorage({
            key,
            complete(res){
                resolve(res)
            }
        })
    })
}

export const asyncRemoveStorage = (key) => {
    return new Promise((resolve) => {
        wx.removeStorage({
            key,
            complete(res){
                resolve(res)
            }
        })
    })
}

export const asyncClearStorage = () => {
    return new Promise((resolve) => {
        wx.clearStorage({
            complete(res) {
                resolve(res)
            }
        })
    })
}