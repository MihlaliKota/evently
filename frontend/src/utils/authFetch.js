const authFetch = async (url, options = {}) => {
    // Use environment variable for base URL
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    // If URL doesn't start with http/https, prepend the base URL
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
    
    const token = localStorage.getItem('authToken'); // Get JWT token from localStorage

    const defaultOptions = {
        method: options.method || 'GET', // Ensure method is explicitly set
        headers: {
            'Content-Type': 'application/json', // Default to JSON content type
            ...options.headers, // Merge any additional headers
        },
        ...options, // Merge provided options (method, body, etc.)
    };

    if (token) {
        // If token exists, add Authorization header with Bearer token
        defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        console.log('Fetch Details:', {
            url: fullUrl,
            method: defaultOptions.method,
            headers: defaultOptions.headers,
            body: defaultOptions.body
        });

        const response = await fetch(fullUrl, defaultOptions);

        // Log response details for debugging
        console.log('Response Status:', response.status);
        console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

        // Try to parse response body for more detailed error information
        let responseBody;
        try {
            responseBody = await response.clone().json();
            console.log('Response Body:', responseBody);
        } catch {
            // If parsing fails, it might not be JSON
            const textBody = await response.clone().text();
            console.log('Response Text:', textBody);
        }

        if (!response.ok) {
            if (response.status === 401) {
                // Token might be invalid or expired - handle logout
                localStorage.removeItem('authToken');
                console.error('Unauthorized access. JWT token likely invalid or expired.');
                
                // Optional: Trigger a logout/redirect
                window.location.href = '/login';
            }

            // Throw an error with more context
            throw new Error(`HTTP error! status: ${response.status}, body: ${JSON.stringify(responseBody)}`);
        }

        return response; // Return the response object

    } catch (error) {
        console.error('Error during authenticated fetch:', {
            message: error.message,
            url: fullUrl,
            token: !!token
        });
        throw error; // Re-throw error for the calling function to handle
    }
};

export default authFetch;