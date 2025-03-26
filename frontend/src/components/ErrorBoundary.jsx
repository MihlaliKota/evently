import React from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';

/**
 * Error Boundary component to prevent the entire app from crashing on JS errors
 * This component catches JavaScript errors in its child component tree and displays
 * a fallback UI instead of crashing the whole application.
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            hasError: false, 
            error: null, 
            errorInfo: null 
        };
    }

    // Update state when an error occurs
    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    // Log error information for debugging
    componentDidCatch(error, errorInfo) {
        console.error("React Error Boundary caught an error:", error);
        console.error("Component stack trace:", errorInfo.componentStack);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <Box sx={{ 
                    m: 4, 
                    p: 4, 
                    border: '1px solid #f44336', 
                    borderRadius: 2,
                    backgroundColor: 'rgba(244, 67, 54, 0.08)'
                }}>
                    <Typography variant="h5" color="error" gutterBottom>
                        Something went wrong
                    </Typography>
                    
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {this.state.error && this.state.error.toString()}
                    </Alert>
                    
                    <Typography variant="body1" gutterBottom>
                        The application encountered an error and couldn't continue. 
                        You can try refreshing the page or contact support if the issue persists.
                    </Typography>
                    
                    {this.props.showStack && this.state.errorInfo && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, overflow: 'auto' }}>
                            <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                                {this.state.errorInfo.componentStack}
                            </Typography>
                        </Box>
                    )}
                    
                    <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                        <Button 
                            variant="contained" 
                            color="primary" 
                            onClick={() => window.location.reload()}
                        >
                            Refresh Page
                        </Button>
                        
                        {this.props.onReset && (
                            <Button 
                                variant="outlined"
                                onClick={() => {
                                    this.setState({ hasError: false, error: null, errorInfo: null });
                                    if (this.props.onReset) this.props.onReset();
                                }}
                            >
                                Reset App State
                            </Button>
                        )}
                    </Box>
                </Box>
            );
        }
        
        // When there's no error, render children normally
        return this.props.children;
    }
}

export default ErrorBoundary;