import axiosInstance from './axiosInstance';

export const checkinApi = {
  getToday: async () => {
    const response = await axiosInstance.get('/checkins/today');
    return response.data;
  },

  upsertCheckin: async (data) => {
    const response = await axiosInstance.post('/checkins/', data);
    return response.data;
  },

  getHistory: async (page = 1, perPage = 50, options = {}) => {
    let url = `/checkins/history?page=${page}&per_page=${perPage}`;
    if (options.period) url += `&period=${encodeURIComponent(options.period)}`;
    if (options.startDate) url += `&start_date=${encodeURIComponent(options.startDate)}`;
    if (options.endDate) url += `&end_date=${encodeURIComponent(options.endDate)}`;
    const response = await axiosInstance.get(url);
    return response.data;
  },

  getByDate: async (dateStr) => {
    const cleanDate = typeof dateStr === 'string' ? dateStr.split('T')[0] : dateStr;
    const response = await axiosInstance.get(`/checkins/date/${cleanDate}`);
    return response.data;
  }
};
