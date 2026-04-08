import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
})

export const fetchCurrentDailyReport = async () => {
  const { data } = await api.get('/daily-report/current')
  return data
}
