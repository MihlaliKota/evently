// api.js - Centralized API service

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://evently-production-cd21.up.railway.app';
console.log('API base URL:', API_BASE_URL);

// API cache utility - MOVED TO TOP to prevent TDZ error
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
    },
    clear: (pattern) => {
        if (pattern) {
            // Clear cache entries that match the pattern
            Object.keys(apiCache.data).forEach(key => {
                if (key.includes(pattern)) {
                    delete apiCache.data[key];
                }
            });
        } else {
            // Clear all cache
            apiCache.data = {};
        }
    }
};

// Handle token expiration
const handleTokenExpiration = (error) => {
    if (error.message && error.message.includes('Invalid or expired token')) {
        // Clear authentication data
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        localStorage.removeItem('userRole');
        localStorage.removeItem('profilePicture'); // Also clear profile picture

        // Reload the page to reset app state
        window.location.reload();

        return true;
    }
    return false;
};

// Helper function for making API requests
const apiRequest = async (endpoint, options = {}) => {
    try {
        const token = localStorage.getItem('authToken');
        const cacheKey = `${endpoint}-${options.method || 'GET'}-${options.body || ''}`;

        const headers = { ...options.headers };

        // Handle authentication with proper token attachment
        if (token && !headers['Authorization']) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Only set Content-Type for non-FormData requests
        if (!(options.body instanceof FormData) && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        const config = {
            ...options,
            headers,
        };

        // Stringify body for JSON requests (not FormData)
        if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData) && !options.skipStringify) {
            config.body = JSON.stringify(config.body);
        }

        // Check cache for GET requests
        if (!options.method || options.method === 'GET') {
            const cachedData = apiCache.get(cacheKey);
            if (cachedData && !options.skipCache) return cachedData;
        }

        console.log(`🌐 API Request to: ${API_BASE_URL}${endpoint}`);

        // Log FormData content for debugging (development only)
        if (config.body instanceof FormData && (import.meta.env.DEV || import.meta.env.MODE === 'development')) {
            console.log('FormData contents:');
            for (let [key, value] of config.body.entries()) {
                if (value instanceof File) {
                    console.log(`  ${key}: File (${value.name}, ${value.type}, ${(value.size / 1024).toFixed(2)}KB)`);
                } else {
                    console.log(`  ${key}: ${typeof value === 'string' ? value : 'Complex value'}`);
                }
            }
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        if (!response.ok) {
            let errorMessage;
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || `HTTP Error: ${response.status}`;

                // Add specific error messaging for image uploads
                if (options.body instanceof FormData && options.body.has('image') || options.body instanceof FormData && options.body.has('profile_picture')) {
                    if (response.status === 413) {
                        errorMessage = 'Image upload failed: File size is too large. Please try a smaller image.';
                    } else if (response.status === 415) {
                        errorMessage = 'Image upload failed: Unsupported file type. Please use JPEG, PNG, or WebP.';
                    } else if (response.status === 400 && errorMessage.includes('file')) {
                        errorMessage = `Image upload failed: ${errorMessage}`;
                    } else if (!response.ok) {
                        errorMessage = `Image upload failed: ${errorMessage}`;
                    }
                }
            } catch (e) {
                // If we can't parse the error as JSON, use status text
                errorMessage = `HTTP Error: ${response.status} ${response.statusText}`;

                // Special handling for image upload errors that don't return JSON
                if (options.body instanceof FormData && (options.body.has('image') || options.body.has('profile_picture'))) {
                    errorMessage = `Image upload failed: ${errorMessage}`;
                }
            }
            throw new Error(errorMessage);
        }

        // Handle 204 No Content responses
        if (response.status === 204) {
            return { success: true };
        }

        // Process response headers for pagination if needed
        let responseHeaders = {}; // Changed from 'headers' to 'responseHeaders' to avoid conflict
        if (options.extractHeaders) {
            const headersList = options.extractHeaders;
            headersList.forEach(header => {
                responseHeaders[header] = response.headers.get(header);
            });
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
            if ((!options.method || options.method === 'GET') && !options.skipCache) {
                apiCache.set(cacheKey, data, options.cacheTTL || 60000);
            }

            // Include headers in response if requested
            if (options.extractHeaders) {
                return { data, headers: responseHeaders }; // Using responseHeaders here too
            }

            return data;
        } catch (jsonError) {
            // If JSON parsing fails but response was successful, return success object
            console.warn('Response could not be parsed as JSON:', jsonError);
            return { success: true };
        }
    } catch (error) {
        console.error('API Request Error:', error);

        // Add specific handling for network errors during uploads
        if (options.body instanceof FormData && error.message === 'Failed to fetch') {
            error.message = 'Network error during file upload. Please check your connection and try again.';
        } else if (options.body instanceof FormData && error.name === 'AbortError') {
            error.message = 'File upload was aborted. The file might be too large or the connection was interrupted.';
        }

        if (handleTokenExpiration(error)) {
            return null; // Return null when token expires
        }
        throw error;
    }
};

// Auth-related API calls
const authAPI = {
    login: (credentials) => apiRequest('/api/auth/login', {
        method: 'POST',
        body: credentials,
    }),
    register: (userData) => apiRequest('/api/auth/register', {
        method: 'POST',
        body: userData,
    }),
};

// Events-related API calls
export const eventsAPI = {
    getAllEvents: (params = {}) => {
        const queryParams = new URLSearchParams();

        // Add all parameters to query string
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                queryParams.append(key, value);
            }
        });

        const queryString = queryParams.toString();
        return apiRequest(`/api/events${queryString ? `?${queryString}` : ''}`, {
            extractHeaders: ['X-Total-Count', 'X-Total-Pages', 'X-Current-Page', 'X-Per-Page'],
            processResponse: (response, data) => {
                // Process the response to match expected frontend format
                return {
                    events: data, // The actual array of events
                    pagination: {
                        total: parseInt(response.headers.get('X-Total-Count') || '0'),
                        pages: parseInt(response.headers.get('X-Total-Pages') || '1'),
                        page: parseInt(response.headers.get('X-Current-Page') || '1'),
                        limit: parseInt(response.headers.get('X-Per-Page') || '3')
                    }
                };
            }
        });
    },

    getEvent: (eventId) => apiRequest(`/api/events/${eventId}`),

    createEvent: (eventData) => apiRequest('/api/events', {
        method: 'POST',
        body: eventData,
    }),

    updateEvent: (eventId, eventData) => apiRequest(`/api/events/${eventId}`, {
        method: 'PUT',
        body: eventData,
    }),

    deleteEvent: (eventId) => apiRequest(`/api/events/${eventId}`, {
        method: 'DELETE',
    }),

    createEventWithImage: (formData) => {
        return apiRequest('/api/events', {
            method: 'POST',
            body: formData,
            skipStringify: true,
            skipCache: true, // Always skip cache for image uploads
            timeout: 30000 // Extended timeout for image uploads (30 seconds)
        });
    },

    updateEventWithImage: (eventId, formData) => {
        return apiRequest(`/api/events/${eventId}`, {
            method: 'PUT',
            body: formData,
            skipStringify: true,
            skipCache: true,
            timeout: 30000
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
                        limit: parseInt(response.headers.get('X-Per-Page') || '3')
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
                        limit: parseInt(response.headers.get('X-Per-Page') || '3')
                    }
                };
            }
        });
    },

    // Test Cloudinary upload functionality
    testImageUpload: (formData) => {
        return apiRequest('/api/test/cloudinary', {
            method: 'POST',
            body: formData,
            skipStringify: true,
            skipCache: true
        });
    }
};

// Reviews-related API calls
export const reviewsAPI = {
    getEventReviews: (eventId) => apiRequest(`/api/events/${eventId}/reviews`),

    createReview: (eventId, reviewData) => apiRequest(`/api/events/${eventId}/reviews`, {
        method: 'POST',
        body: reviewData,
    }),

    createReviewWithImage: (eventId, formData) => apiRequest(`/api/events/${eventId}/reviews`, {
        method: 'POST',
        body: formData,
        skipStringify: true,
        skipCache: true,
        timeout: 30000
    }),

    updateReview: (reviewId, reviewData) => apiRequest(`/api/reviews/${reviewId}`, {
        method: 'PUT',
        body: reviewData,
    }),

    deleteReview: (reviewId) => apiRequest(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
    }),

    getAllReviews: (params = {}) => {
        const queryParams = new URLSearchParams();

        // Add all parameters to query string
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                queryParams.append(key, value);
            }
        });

        const queryString = queryParams.toString();
        return apiRequest(`/api/reviews${queryString ? `?${queryString}` : ''}`, {
            extractHeaders: ['X-Total-Count', 'X-Total-Pages', 'X-Current-Page', 'X-Per-Page'],
            processResponse: (response, data) => {
                // Process the response to match expected frontend format
                return {
                    reviews: data, // The actual array of reviews
                    pagination: {
                        total: parseInt(response.headers.get('X-Total-Count') || '0'),
                        pages: parseInt(response.headers.get('X-Total-Pages') || '1'),
                        page: parseInt(response.headers.get('X-Current-Page') || '1'),
                        limit: parseInt(response.headers.get('X-Per-Page') || '3')
                    }
                };
            }
        });
    },

    getReviewAnalytics: (eventId) => {
        const queryParams = eventId ? `?event_id=${eventId}` : '';
        return apiRequest(`/api/reviews/analytics${queryParams}`);
    },
};

// User-related API calls
export const userAPI = {
    getProfile: () => apiRequest('/api/users/profile'),

    updateProfile: (userData) => apiRequest('/api/users/profile', {
        method: 'PUT',
        body: userData,
    }),

    updateProfileWithImage: (formData) => apiRequest('/api/users/profile', {
        method: 'PUT',
        body: formData,
        skipStringify: true,
        skipCache: true,
        timeout: 30000
    }),

    changePassword: (passwordData) => apiRequest('/api/users/password', {
        method: 'PUT',
        body: passwordData,
    }),

    getUserActivities: () => apiRequest('/api/users/activities'),

    getAllUsers: (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        return apiRequest(`/api/users${queryParams ? `?${queryParams}` : ''}`, {
            processResponse: (response, data) => {
                // Extract pagination metadata from headers
                return {
                    users: data,
                    pagination: {
                        total: parseInt(response.headers.get('X-Total-Count') || '0'),
                        pages: parseInt(response.headers.get('X-Total-Pages') || '0'),
                        page: parseInt(response.headers.get('X-Current-Page') || '1'),
                        limit: parseInt(response.headers.get('X-Per-Page') || '3')
                    }
                };
            }
        });
    },
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

// Utility functions for image handling
export const imageUtils = {
    // Check if a Cloudinary URL is valid
    isValidCloudinaryUrl: (url) => {
        if (!url) return false;
        return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
    },

    // Format image URL (handle Cloudinary URLs properly)
    formatImageUrl: (imagePath) => {
        if (!imagePath) return null;

        // If it's already a full URL, return it as is
        if (imagePath.startsWith('http')) {
            return imagePath;
        }

        // If it's a Cloudinary path, return it as is (backend returns full URL)
        if (imagePath.includes('cloudinary.com') || imagePath.includes('res.cloudinary.com')) {
            return imagePath;
        }

        // Otherwise, prepend the API base URL
        return `${API_BASE_URL}${imagePath}`;
    },

    // Get placeholder image for events
    getEventPlaceholder: (eventId) => {
        return `https://source.unsplash.com/random/400x140/?event&sig=${eventId || Math.random()}`;
    },

    // Get placeholder image for users
    getUserPlaceholder: (username) => {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(username || 'User')}&background=random`;
    }
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
    imageUtils
};