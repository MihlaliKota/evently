const authFetch = async (url, options = {}) => {
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
        const response = await fetch(url, defaultOptions);

        if (!response.ok && response.status === 401) {
            // Token might be invalid or expired - handle logout (for example, clear localStorage and redirect to login)
            localStorage.removeItem('authToken');
            console.error('Unauthorized access. JWT token likely invalid or expired.');
            // alert('Your session has expired. Please log in again.'); // Optional: Inform user session expired
            // TODO: Implement more graceful logout/redirect - for now, just returning the response
        }

        return response; // Return the response object (caller needs to handle response.ok and response.json())

    } catch (error) {
        console.error('Error during authenticated fetch:', error);
        throw error; // Re-throw error for the calling function to handle
    }
};

export default authFetch;