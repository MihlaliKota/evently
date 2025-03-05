const authFetch = async (url, options = {}) => {
    const baseUrl = process.env.REACT_APP_API_URL || 'https://your-backend-domain.com';
    
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
    
    const token = localStorage.getItem('authToken');

    const defaultOptions = {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers
        },
        ...options
    };

    try {
        const response = await fetch(fullUrl, defaultOptions);

        if (response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('authToken');
            window.location.href = '/login';
            throw new Error('Unauthorized');
        }

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorBody}`);
        }

        return response;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
};

export default authFetch;