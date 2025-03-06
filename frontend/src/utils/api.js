export const fetchApi = async (endpoint, options = {}) => {
    const baseUrl = import.meta.env.VITE_API_URL || 
                    'https://evently-production-cd21.up.railway.app';
    
    console.group('🌐 API Request');
    console.log('Endpoint:', endpoint);
    console.log('Base URL:', baseUrl);

    try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Origin': window.location.origin,
                ...options.headers
            },
            credentials: 'include'  // Critical for cross-origin credentials
        });

        console.log('Response Status:', response.status);

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('❌ API Error:', errorBody);
            throw new Error(errorBody || 'Network response was not ok');
        }

        const data = await response.json();
        console.log('Response Data:', data);
        console.groupEnd();

        return data;
    } catch (error) {
        console.error('🚨 Fetch Error:', error);
        console.groupEnd();
        throw error;
    }
};