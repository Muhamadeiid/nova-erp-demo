import '../demo/install'
import axios from 'axios'
import { API_BASE_URL } from '../config/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept:         'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nova_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login')
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('nova_token')
      localStorage.removeItem('nova_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
