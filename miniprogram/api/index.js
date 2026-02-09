import http from '../utils/http'

export const getHealth = () => http.get('/api/v1/health')

export const authLogin = (data) => http.post('/api/v1/auth/login', data)
export const authRegister = (data) => http.post('/api/v1/auth/register', data)

export const getSpaces = (params = {}) => http.get('/api/v1/spaces', params)
export const createSpace = (data) => http.post('/api/v1/spaces', data)
export const joinSpace = (data) => http.post('/api/v1/spaces/join', data)
export const getSpace = (spaceId) => http.get(`/api/v1/spaces/${spaceId}`)
export const updateSpace = (spaceId, data) => http.patch(`/api/v1/spaces/${spaceId}`, data)
export const deleteSpace = (spaceId) => http.delete(`/api/v1/spaces/${spaceId}`)
export const createShareCode = (spaceId, data) => http.post(`/api/v1/spaces/${spaceId}/share-code`, data)
export const getShareCodes = (spaceId, params = {}) =>
  http.get(`/api/v1/spaces/${spaceId}/share-codes`, params)
export const deleteShareCode = (spaceId, shareCodeId) =>
  http.delete(`/api/v1/spaces/${spaceId}/share-codes/${shareCodeId}`)

export const getPhotos = (spaceId, params = {}) => http.get(`/api/v1/spaces/${spaceId}/photos`, params)
export const getPhoto = (photoId) => http.get(`/api/v1/photos/${photoId}`)
export const getUploadToken = (data) => http.post('/api/v1/photos/upload-token', data)
export const createPhoto = (data) => http.post('/api/v1/photos', data)
export const createPhotosBatch = (data) => http.post('/api/v1/photos/batch', data)
export const getDownloadUrl = (photoId) => http.get(`/api/v1/photos/${photoId}/download`)
export const updatePhoto = (photoId, data) => http.patch(`/api/v1/photos/${photoId}`, data)
export const deletePhoto = (photoId) => http.delete(`/api/v1/photos/${photoId}`)
export const deletePhotosBatch = (data) => http.post('/api/v1/photos/batch-delete', data)

export const getMembers = (spaceId) => http.get(`/api/v1/spaces/${spaceId}/members`)
export const addMember = (spaceId, data) => http.post(`/api/v1/spaces/${spaceId}/members`, data)
export const updateMemberRole = (spaceId, userId, data) =>
  http.post(`/api/v1/spaces/${spaceId}/members/${userId}/role`, data)
export const removeMember = (spaceId, userId) =>
  http.delete(`/api/v1/spaces/${spaceId}/members/${userId}`)
export const transferOwner = (spaceId, data) =>
  http.post(`/api/v1/spaces/${spaceId}/owner/transfer`, data)

export const getFiles = (params = {}) => http.get('/api/v1/files', params)
export const getFile = (fileId) => http.get(`/api/v1/files/${fileId}`)
export const updateFile = (fileId, data) => http.patch(`/api/v1/files/${fileId}`, data)
export const deleteFile = (fileId) => http.delete(`/api/v1/files/${fileId}`)
