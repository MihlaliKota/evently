// api.js - Centralized API service

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://evently-production-cd21.up.railway.app';

// Helper function for making API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    ...options,
    headers,
  };
  
  try {
    console.log(`🌐 API Request to: ${API_BASE_URL}${endpoint}`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP Error: ${response.status}`,
      }));
      throw new Error(errorData.error || `HTTP Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Auth-related API calls
export const authAPI = {
  login: (credentials) => apiRequest('/api/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  
  register: (userData) => apiRequest('/api/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
};

// Events-related API calls
export const eventsAPI = {
  getAllEvents: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/api/events${queryParams ? `?${queryParams}` : ''}`);
  },
  
  getEvent: (eventId) => apiRequest(`/api/events/${eventId}`),
  
  createEvent: (eventData) => apiRequest('/api/events', {
    method: 'POST',
    body: JSON.stringify(eventData),
  }),
  
  updateEvent: (eventId, eventData) => apiRequest(`/api/events/${eventId}`, {
    method: 'PUT',
    body: JSON.stringify(eventData),
  }),
  
  deleteEvent: (eventId) => apiRequest(`/api/events/${eventId}`, {
    method: 'DELETE',
  }),
  
  getUpcomingEvents: () => apiRequest('/api/events/upcoming'),
  
  getPastEvents: () => apiRequest('/api/events/past'),
};

// Reviews-related API calls
export const reviewsAPI = {
  getEventReviews: (eventId) => apiRequest(`/api/events/${eventId}/reviews`),
  
  createReview: (eventId, reviewData) => apiRequest(`/api/events/${eventId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(reviewData),
  }),
  
  updateReview: (reviewId, reviewData) => apiRequest(`/api/reviews/${reviewId}`, {
    method: 'PUT',
    body: JSON.stringify(reviewData),
  }),
  
  deleteReview: (reviewId) => apiRequest(`/api/reviews/${reviewId}`, {
    method: 'DELETE',
  }),
  
  getAllReviews: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/api/reviews${queryParams ? `?${queryParams}` : ''}`);
  },
  
  getReviewAnalytics: (eventId) => {
    const queryParams = eventId ? `?event_id=${eventId}` : '';
    return apiRequest(`/api/reviews/analytics${queryParams}`);
  },
};

// User-related API calls
export const userAPI = {
  getProfile: () => apiRequest('/api/users/profile'),
  
  updateProfile: (profileData) => apiRequest('/api/users/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  }),
  
  changePassword: (passwordData) => apiRequest('/api/users/password', {
    method: 'PUT',
    body: JSON.stringify(passwordData),
  }),
  
  getUserActivities: () => apiRequest('/api/users/activities'),
};

// Categories-related API calls
export const categoriesAPI = {
  getAllCategories: () => apiRequest('/api/categories'),
};

// Dashboard-related API calls
export const dashboardAPI = {
  getStats: () => apiRequest('/api/dashboard/stats'),
};

// Calendar-related API calls
export const calendarAPI = {
  getEvents: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/api/calendar/events${queryParams ? `?${queryParams}` : ''}`);
  },
};

// Legacy support for components that use the old fetchApi function
export const fetchApi = async (endpoint, options = {}) => {
  console.warn('fetchApi is deprecated. Please use the new API service methods.');
  return apiRequest(endpoint, options);
};

export default {
  auth: authAPI,
  events: eventsAPI,
  reviews: reviewsAPI,
  users: userAPI,
  categories: categoriesAPI,
  dashboard: dashboardAPI,
  calendar: calendarAPI,
};