import api from './axiosInstance';

export const profileApi = {
  getProfile: async () => {
    const response = await api.get('/profile/');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/profile/', data);
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/profile/password', {
      current_password: currentPassword,
      new_password: newPassword
    });
    return response.data;
  },

  deleteAccount: async () => {
    const response = await api.delete('/profile/');
    return response.data;
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post('/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getAvatarBlob: async () => {
    const response = await api.get('/profile/avatar', { responseType: 'blob' });
    return URL.createObjectURL(response.data);
  },

  removeAvatar: async () => {
    const response = await api.delete('/profile/avatar');
    return response.data;
  },

  getJourneyStats: async () => {
    const response = await api.get('/profile/stats');
    return response.data;
  },

  exportUserData: async () => {
    const response = await api.get('/profile/export');
    return response.data;
  }
};
