import axios from 'axios'
import { API_BASE_URL } from '../config/api'
import { installMockApi } from './mockApi'

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

// Must be imported before any module creates an axios instance, so every
// instance inherits the fetch adapter that the mock API intercepts.
if (DEMO_MODE) {
  axios.defaults.adapter = 'fetch'
  installMockApi(API_BASE_URL)
}
