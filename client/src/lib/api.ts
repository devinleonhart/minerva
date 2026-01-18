import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    // Extract error message from response
    const message = error.response?.data?.error
      || error.response?.data?.message
      || error.message
      || 'An unexpected error occurred'

    // Create enhanced error with message
    const enhancedError = new Error(message)
    enhancedError.name = 'ApiError'
    // Preserve original error data
    Object.assign(enhancedError, {
      status: error.response?.status,
      code: error.response?.data?.code,
      originalError: error
    })

    throw enhancedError
  }
)
