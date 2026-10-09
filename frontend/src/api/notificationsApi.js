import axiosInstance from './axiosInstance';

export const notificationsApi = {
  getSmartNotifications: async () => {
    const { data } = await axiosInstance.get('/notifications/smart');
    return data;
  },

  getNotifications: async () => {
    const { data } = await axiosInstance.get('/notifications/');
    return data;
  },

  markAsRead: async (notifId) => {
    const { data } = await axiosInstance.post(`/notifications/read/${notifId}`);
    return data;
  },

  markAllAsRead: async () => {
    const { data } = await axiosInstance.post('/notifications/read-all');
    return data;
  }
};
