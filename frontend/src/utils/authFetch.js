const authFetch = async (url, options = {}) => {
    // Use environment variable for base URL
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    // If URL doesn't start with http/https, prepend the base URL
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
    
    const token = localStorage.getItem('authToken'); // Get JWT token from localStorage

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json', // Default to JSON content type
        },
        ...options, // Merge provided options (method, body, etc.)
    };

    if (token) {
        // If token exists, add Authorization header with Bearer token
        defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(fullUrl, defaultOptions);

        if (!response.ok && response.status === 401) {
            // Token might be invalid or expired - handle logout
            localStorage.removeItem('authToken');
            console.error('Unauthorized access. JWT token likely invalid or expired.');
            // alert('Your session has expired. Please log in again.'); // Optional: Inform user session expired
        }

        return response; // Return the response object

    } catch (error) {
        console.error('Error during authenticated fetch:', error);
        throw error; // Re-throw error for the calling function to handle
    }
};

export default authFetch;