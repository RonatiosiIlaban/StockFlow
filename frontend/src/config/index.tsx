import axios from 'axios'

export const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
})

export type ApiResponse<T, M = undefined> = {
  code: string
  message: string
  data: T
  meta?: M
}
