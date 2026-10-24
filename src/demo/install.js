import axios, { AxiosError, AxiosHeaders } from 'axios'
import { API_BASE_URL } from '../config/api'
import { installMockApi } from './mockApi'

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

// Routes axios through window.fetch at call time. axios' built-in fetch
// adapter keeps the fetch it saw when the module loaded, which in a
// production bundle is the original one, so the mock would be bypassed.
async function demoAdapter(config) {
  const url = new URL(axios.getUri(config), window.location.origin)
  const headers = AxiosHeaders.from(config.headers).toJSON()
  const hasBody = config.data !== undefined && !['get', 'head'].includes(config.method)
  const res = await window.fetch(url, {
    method: (config.method || 'get').toUpperCase(),
    headers,
    body: hasBody ? (typeof config.data === 'string' || config.data instanceof FormData ? config.data : JSON.stringify(config.data)) : undefined,
  })

  const text = await res.text()
  let data = text
  if (config.responseType === 'blob') {
    data = new Blob([text], { type: res.headers.get('Content-Type') || 'application/octet-stream' })
  } else {
    try { data = text ? JSON.parse(text) : null } catch { /* keep raw text */ }
  }

  const response = { data, status: res.status, statusText: res.statusText, headers: Object.fromEntries(res.headers), config, request: {} }
  if (config.validateStatus && !config.validateStatus(res.status)) {
    throw new AxiosError(`Request failed with status code ${res.status}`, AxiosError.ERR_BAD_REQUEST, config, {}, response)
  }
  return response
}

// Must be imported before any module creates an axios instance, so every
// instance inherits the demo adapter.
if (DEMO_MODE) {
  installMockApi(API_BASE_URL)
  axios.defaults.adapter = demoAdapter
}
