import api from './axiosInstance';

export const reportsApi = {
  getMonthlyReport: async (year, month) => {
    const response = await api.get('/reports/monthly', {
      params: { year, month }
    });
    return response.data;
  },
  getWeeklyReport: async (params = {}) => {
    const response = await api.get('/reports/weekly', {
      params
    });
    return response.data;
  }
};

