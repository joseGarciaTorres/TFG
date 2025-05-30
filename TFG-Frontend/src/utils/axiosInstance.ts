import axios, {
    AxiosError,
    AxiosRequestConfig,
    AxiosRequestHeaders,
    InternalAxiosRequestConfig
  } from 'axios'
  
  interface RefreshResponse {
    access: string
  }
  
  const instance = axios.create({
    baseURL: 'https://backjosetfg.com/api/',
  })
  
  // Interceptor de requests
  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const storage = await chrome.storage.local.get(['access'])
  
      if (storage.access) {
        // Usa el tipo correcto para headers
        const headers = config.headers as AxiosRequestHeaders
        headers.Authorization = `Bearer ${storage.access}`
      }
  
      return config
    }
  )
  
  // Interceptor de responses
  instance.interceptors.response.use(
    response => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
  
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true
  
        const storage = await chrome.storage.local.get(['refresh'])
        const refresh = storage.refresh
  
        if (refresh) {
          try {
            const res = await axios.post<RefreshResponse>(
              'https://backjosetfg.com/api/user/token/refresh/',
              { refresh }
            )
  
            const newAccess = res.data.access
            await chrome.storage.local.set({ access: newAccess })
  
            const headers = originalRequest.headers as AxiosRequestHeaders
            headers.Authorization = `Bearer ${newAccess}`
  
            return instance(originalRequest)
          } catch (e) {
            console.error('Refresh token expired or invalid')
            await chrome.storage.local.remove(['access', 'refresh'])
          }
        }
      }
  
      return Promise.reject(error)
    }
  )
  
  export default instance
  
  
// src/utils/axiosInstance.ts

// import axios from 'axios';

// const axiosInstance = axios.create({
//   baseURL: 'http://localhost:8000/api/user/',  // Cambia esto a la URL correcta de tu backend si es necesario
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Interceptor de solicitud (solo muestra en consola, no hace nada)
// axiosInstance.interceptors.request.use(
//   (config) => {
//     console.log('Interceptor de solicitud activado');
//     return config;
//   },
//   (error) => {
//     console.log('Error en el interceptor de solicitud');
//     return Promise.reject(error);
//   }
// );

// // Interceptor de respuesta (solo muestra en consola, no hace nada)
// axiosInstance.interceptors.response.use(
//   (response) => {
//     console.log('Interceptor de respuesta activado');
//     return response;
//   },
//   (error) => {
//     console.log('Error en el interceptor de respuesta');
//     return Promise.reject(error);
//   }
// );

// export default axiosInstance;
