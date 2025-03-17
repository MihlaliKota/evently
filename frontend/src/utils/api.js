// api.js - Centralized API service

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://evently-production-cd21.up.railway.app';

// Handle token expiration
const handleTokenExpiration = (error) => {
    if (error.message && error.message.includes('Invalid or expired token')) {
        // Clear authentication data
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        localStorage.removeItem('userRole');

        // Reload the page to reset app state
        window.location.reload();

        return true;
    }
    return false;
};

// Helper function for making API requests
const apiRequest = async (endpoint, options = {}) => {
    const token = localStorage.getItem('authToken');
    const cacheKey = `${endpoint}-${options.method || 'GET'}-${options.body || ''}`;

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

    // Check cache for GET requests
    if (!options.method || options.method === 'GET') {
        const cachedData = apiCache.get(cacheKey);
        if (cachedData) return cachedData;
    }

    try {
        console.log(`🌐 API Request to: ${API_BASE_URL}${endpoint}`);
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({
                error: `HTTP Error: ${response.status}`,
            }));
            throw new Error(errorData.error || `HTTP Error: ${response.status}`);
        }

        // Handle 204 No Content responses
        if (response.status === 204) {
            return { success: true };
        }

        // Try to parse response as JSON
        try {
            const data = await response.json();

            // Process response if needed
            if (options.processResponse && typeof options.processResponse === 'function') {
                const processedData = options.processResponse(response, data);
                return processedData;
            }

            // Cache successful GET responses
            if (!options.method || options.method === 'GET') {
                apiCache.set(cacheKey, data);
            }

            return data;
        } catch (jsonError) {
            // If JSON parsing fails but response was successful, return success object
            console.warn('Response could not be parsed as JSON:', jsonError);
            return { success: true };
        }
    } catch (error) {
        console.error('API Request Error:', error);
        if (handleTokenExpiration(error)) {
            return null; // Return null when token expires
        }
        throw error;
    }
};

// API cache utility
const apiCache = {
    data: {},
    set: (key, value, ttl = 60000) => {
        apiCache.data[key] = {
            value,
            expiry: Date.now() + ttl
        };
    },
    get: (key) => {
        const item = apiCache.data[key];
        if (!item) return null;
        if (Date.now() > item.expiry) {
            delete apiCache.data[key];
            return null;
        }
        return item.value;
    }
};

// Auth-related API calls
const authAPI = {
    login: (credentials) => apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
    }),
    register: (userData) => apiRequest('/api/auth/register', {
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

    createEventWithImage: (formData) => {
        const token = localStorage.getItem('authToken');

        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return apiRequest('/api/events', {
            method: 'POST',
            body: formData,
            headers: headers,
        });
    },

    updateEventWithImage: (eventId, formData) => {
        const token = localStorage.getItem('authToken');

        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return apiRequest(`/api/events/${eventId}`, {
            method: 'PUT',
            body: formData,
            headers: {},
        });
    },

    getUpcomingEvents: (params = {}) => {
        const queryParams = new URLSearchParams();

        // Add pagination params
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.sort_by) queryParams.append('sort_by', params.sort_by);
        if (params.sort_order) queryParams.append('sort_order', params.sort_order);

        const queryString = queryParams.toString();
        return apiRequest(`/api/events/upcoming${queryString ? `?${queryString}` : ''}`, {
            processResponse: (response, data) => {
                // Extract pagination metadata from headers
                return {
                    events: data,
                    pagination: {
                        total: parseInt(response.headers.get('X-Total-Count') || '0'),
                        pages: parseInt(response.headers.get('X-Total-Pages') || '0'),
                        page: parseInt(response.headers.get('X-Current-Page') || '1'),
                        limit: parseInt(response.headers.get('X-Per-Page') || '12')
                    }
                };
            }
        });
    },

    getPastEvents: (params = {}) => {
        const queryParams = new URLSearchParams();

        // Add pagination params
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.sort_by) queryParams.append('sort_by', params.sort_by);
        if (params.sort_order) queryParams.append('sort_order', params.sort_order);

        const queryString = queryParams.toString();
        return apiRequest(`/api/events/past${queryString ? `?${queryString}` : ''}`, {
            processResponse: (response, data) => {
                // Extract pagination metadata from headers
                return {
                    events: data,
                    pagination: {
                        total: parseInt(response.headers.get('X-Total-Count') || '0'),
                        pages: parseInt(response.headers.get('X-Total-Pages') || '0'),
                        page: parseInt(response.headers.get('X-Current-Page') || '1'),
                        limit: parseInt(response.headers.get('X-Per-Page') || '12')
                    }
                };
            }
        });
    }
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

    getAllUsers: () => apiRequest('/api/admin/users'),
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