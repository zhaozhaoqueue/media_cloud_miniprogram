import { createPhoto, createPhotosBatch, getUploadToken } from '../../api/index'
import { toast } from '../../utils/extendApi'

const inferMimeType = (filePath = '') => {
  const lower = filePath.toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.gif')) return 'image/gif'
  return 'image/jpeg'
}

const fileNameFromPath = (filePath = '') => {
  const parts = filePath.split('/')
  return parts[parts.length - 1] || `image_${Date.now()}.jpg`
}

Page({
  data: {
    spaceId: '',
    selectedFiles: [],
    uploading: false
  },
  onLoad(query) {
    this.setData({
      spaceId: query?.spaceId || ''
    })
  },
  chooseImages() {
    wx.chooseImage({
      count: 9,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFiles = (res.tempFiles || []).map((file) => {
          const path = file.path || file.tempFilePath
          return {
            path,
            size: file.size || 0,
            name: fileNameFromPath(path),
            type: inferMimeType(path)
          }
        })
        if (!tempFiles.length && Array.isArray(res.tempFilePaths)) {
          res.tempFilePaths.forEach((path) => {
            tempFiles.push({
              path,
              size: 0,
              name: fileNameFromPath(path),
              type: inferMimeType(path)
            })
          })
        }
        this.setData({ selectedFiles: tempFiles })
      }
    })
  },
  async uploadBySignedUrl(filePath, uploadInfo) {
    const fs = wx.getFileSystemManager()
    const binary = await new Promise((resolve, reject) => {
      fs.readFile({
        filePath,
        success: ({ data }) => resolve(data),
        fail: reject
      })
    })

    return new Promise((resolve, reject) => {
      wx.request({
        url: uploadInfo.uploadUrl,
        method: uploadInfo.method || 'PUT',
        header: uploadInfo.headers || {},
        data: binary,
        success: ({ statusCode }) => {
          if (statusCode >= 200 && statusCode < 300) {
            resolve(true)
          } else {
            reject(new Error(`upload status: ${statusCode}`))
          }
        },
        fail: reject
      })
    })
  },
  async startUpload() {
    const { spaceId, selectedFiles, uploading } = this.data
    if (uploading || !selectedFiles.length) return
    if (!spaceId) {
      toast({ title: '缺少空间ID', icon: 'none' })
      return
    }

    this.setData({ uploading: true })
    wx.showLoading({ title: '上传中' })
    try {
      const payload = {
        spaceId,
        files: selectedFiles.map((file) => ({
          name: file.name,
          size: file.size,
          type: file.type
        }))
      }
      const tokenRes = await getUploadToken(payload)
      const uploads = tokenRes?.uploads || []
      if (!uploads.length || uploads.length !== selectedFiles.length) {
        throw new Error('upload-token invalid')
      }

      const createdItems = []
      for (let i = 0; i < uploads.length; i += 1) {
        const uploadInfo = uploads[i]
        const file = selectedFiles[i]
        await this.uploadBySignedUrl(file.path, uploadInfo)
        createdItems.push({
          fileId: uploadInfo.fileId,
          name: file.name
        })
      }

      if (createdItems.length === 1) {
        await createPhoto({
          spaceId,
          fileId: createdItems[0].fileId,
          name: createdItems[0].name
        })
      } else {
        await createPhotosBatch({
          spaceId,
          items: createdItems
        })
      }

      toast({ title: '上传成功', icon: 'success' })
      this.setData({ selectedFiles: [] })
      setTimeout(() => {
        wx.navigateBack()
      }, 300)
    } catch (error) {
      toast({ title: '上传失败，请重试', icon: 'none' })
    } finally {
      wx.hideLoading()
      this.setData({ uploading: false })
    }
  }
})
