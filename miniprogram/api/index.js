import http from '../utils/http'

export const authLogin = (code) => http.post('/api/v1/auth/login', { code })

export const getSpaces = (params = {}) => http.get('/api/v1/spaces', params)
export const createSpace = (data) => http.post('/api/v1/spaces', data)
export const joinSpace = (data) => http.post('/api/v1/spaces/join', data)
export const getSpace = (spaceId) => http.get(`/api/v1/spaces/${spaceId}`)
export const createShareCode = (spaceId, data) => http.post(`/api/v1/spaces/${spaceId}/share-code`, data)

export const getPhotos = (spaceId, params = {}) => http.get(`/api/v1/spaces/${spaceId}/photos`, params)
export const getPhoto = (photoId) => http.get(`/api/v1/photos/${photoId}`)
export const getUploadToken = (data) => http.post('/api/v1/photos/upload-token', data)
export const createPhoto = (data) => http.post('/api/v1/photos', data)
export const getDownloadUrl = (photoId) => http.get(`/api/v1/photos/${photoId}/download`)
export const deletePhoto = (photoId) => http.delete(`/api/v1/photos/${photoId}`)

export const getMembers = (spaceId) => http.get(`/api/v1/spaces/${spaceId}/members`)
export const updateMemberRole = (spaceId, userId, data) =>
  http.post(`/api/v1/spaces/${spaceId}/members/${userId}/role`, data)
export const removeMember = (spaceId, userId) =>
  http.delete(`/api/v1/spaces/${spaceId}/members/${userId}`)
