// ReviewManagement.jsx - A component for administrators to manage and moderate reviews
import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, Divider, CircularProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, MenuItem, Select, FormControl, InputLabel, Alert,
    FormControlLabel, Switch, Pagination, Toolbar, Tooltip, Avatar,
    Grid, Card, CardContent
} from '@mui/material';
import {
    Delete, Edit, Flag, CheckCircle, Block, Search,
    FilterList, Refresh, Visibility, BarChart, WarningAmber
} from '@mui/icons-material';
import StarRating from './StarRating';

const ReviewManagement = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [reviewCount, setReviewCount] = useState(0);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [moderationStatus, setModerationStatus] = useState('');
    const [moderationNotes, setModerationNotes] = useState('');
    const [filters, setFilters] = useState({
        status: 'all',
        minRating: '',
        maxRating: '',
        eventId: '',
        sortBy: 'created_at',
        sortDir: 'desc'
    });
    const [showFilters, setShowFilters] = useState(false);
    const [analyticsOpen, setAnalyticsOpen] = useState(false);
    const [analytics, setAnalytics] = useState(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);

    // Get JWT token from localStorage
    const getToken = () => {
        return localStorage.getItem('authToken');
    };

    // Format date for display
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
        }).format(date);
    };

    // Truncate text with ellipsis
    const truncateText = (text, maxLength = 100) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    // Fetch reviews
    const fetchReviews = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const token = getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
            
            // Build query params from filters
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('limit', 10);
            
            if (filters.minRating) params.append('min_rating', filters.minRating);
            if (filters.maxRating) params.append('max_rating', filters.maxRating);
            if (filters.eventId) params.append('event_id', filters.eventId);
            if (filters.status !== 'all') params.append('status', filters.status);
            params.append('sort_by', filters.sortBy);
            params.append('sort_order', filters.sortDir);

            const response = await fetch(`http://localhost:5000/api/reviews?${params.toString()}`, { headers });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch reviews: ${response.status}`);
            }
            
            const data = await response.json();
            setReviews(data);
            
            // Get pagination info from headers
            const totalCount = parseInt(response.headers.get('X-Total-Count') || '0');
            const totalPages = parseInt(response.headers.get('X-Total-Pages') || '1');
            setTotalPages(totalPages);
            setReviewCount(totalCount);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            setError(error.message);
            
            // Set some mock data for development if the API fails
            setReviews([
                {
                    review_id: 1,
                    event_id: 101,
                    user_id: 201,
                    username: 'JohnDoe',
                    event_name: 'Tech Conference 2024',
                    rating: 4.5,
                    review_text: 'This was a great event with excellent speakers and networking opportunities.',
                    created_at: new Date().toISOString(),
                    moderation_status: 'approved'
                },
                {
                    review_id: 2,
                    event_id: 102,
                    user_id: 202,
                    username: 'JaneSmith',
                    event_name: 'Music Festival',
                    rating: 2.0,
                    review_text: 'The sound quality was poor and it was overcrowded. Not worth the money.',
                    created_at: new Date(Date.now() - 86400000).toISOString(),
                    moderation_status: 'flagged'
                }
            ]);
            setTotalPages(1);
            setReviewCount(2);
        } finally {
            setLoading(false);
        }
    };

    // Fetch analytics
    const fetchAnalytics = async () => {
        setLoadingAnalytics(true);
        
        try {
            const token = getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            const response = await fetch('http://localhost:5000/api/reviews/analytics', { headers });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch analytics: ${response.status}`);
            }
            
            const data = await response.json();
            setAnalytics(data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            
            // Create mock analytics data
            setAnalytics({
                analytics: {
                    total_reviews: 45,
                    average_rating: 4.2,
                    five_star: 15,
                    four_star: 20,
                    three_star: 5,
                    two_star: 3,
                    one_star: 2,
                    positive_reviews: 35,
                    negative_reviews: 5
                },
                recentReviews: reviews.slice(0, 5)
            });
        } finally {
            setLoadingAnalytics(false);
        }
    };

    // Load reviews on mount and when page or filters change
    useEffect(() => {
        fetchReviews();
    }, [page, filters]);

    // Handle page change
    const handlePageChange = (event, value) => {
        setPage(value);
    };

    // Handle filter change
    const handleFilterChange = (name, value) => {
        setFilters({
            ...filters,
            [name]: value
        });
        // Reset to first page when filters change
        setPage(1);
    };

    // Handle review moderation
    const handleModerate = async () => {
        if (!selectedReview) return;
        
        setLoading(true);
        setError(null);
        setSuccess(null);
        
        try {
            const token = getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            const response = await fetch(`http://localhost:5000/api/reviews/${selectedReview.review_id}/moderate`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    status: moderationStatus,
                    moderation_notes: moderationNotes
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to moderate review: ${response.status}`);
            }
            
            const updatedReview = await response.json();
            
            // Update the review in the list
            setReviews(reviews.map(review => 
                review.review_id === updatedReview.review_id ? updatedReview : review
            ));
            
            setSuccess(`Review #${selectedReview.review_id} has been ${moderationStatus}`);
            setDetailsOpen(false);
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(null), 3000);
        } catch (error) {
            console.error('Error moderating review:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle review deletion
    const handleDelete = async (reviewId) => {
        if (!reviewId || !window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
            return;
        }
        
        setLoading(true);
        setError(null);
        setSuccess(null);
        
        try {
            const token = getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const headers = {
                'Authorization': `Bearer ${token}`
            };

            const response = await fetch(`http://localhost:5000/api/reviews/${reviewId}`, {
                method: 'DELETE',
                headers
            });
            
            if (!response.ok) {
                throw new Error(`Failed to delete review: ${response.status}`);
            }
            
            // Remove the review from the list
            setReviews(reviews.filter(review => review.review_id !== reviewId));
            setSuccess(`Review #${reviewId} has been deleted`);
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(null), 3000);
        } catch (error) {
            console.error('Error deleting review:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Open the details modal for a review
    const handleViewDetails = (review) => {
        setSelectedReview(review);
        setModerationStatus(review.moderation_status || '');
        setModerationNotes(review.moderation_notes || '');
        setDetailsOpen(true);
    };

    // Open the analytics modal
    const handleOpenAnalytics = () => {
        fetchAnalytics();
        setAnalyticsOpen(true);
    };

    // Get chip color based on moderation status
    const getModerationStatusColor = (status) => {
        switch (status) {
            case 'approved':
                return 'success';
            case 'flagged':
                return 'warning';
            case 'rejected':
                return 'error';
            default:
                return 'default';
        }
    };

    // Render the review details modal
    const renderDetailsModal = () => {
        if (!selectedReview) return null;
        
        return (
            <Dialog
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle>
                    Review Details
                    {selectedReview.moderation_status && (
                        <Chip 
                            label={selectedReview.moderation_status.toUpperCase()}
                            color={getModerationStatusColor(selectedReview.moderation_status)}
                            size="small"
                            sx={{ ml: 2 }}
                        />
                    )}
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle1" gutterBottom>
                                Event
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                                {selectedReview.event_name || `Event #${selectedReview.event_id}`}
                            </Typography>
                            
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Reviewer
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Avatar sx={{ mr: 1 }}>
                                        {selectedReview.username?.charAt(0).toUpperCase() || 'U'}
                                    </Avatar>
                                    <Typography variant="body1">
                                        {selectedReview.username || `User #${selectedReview.user_id}`}
                                    </Typography>
                                </Box>
                            </Box>
                            
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Rating
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <StarRating
                                        value={selectedReview.rating}
                                        readOnly
                                        showValue
                                    />
                                </Box>
                            </Box>
                            
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Date
                                </Typography>
                                <Typography variant="body1">
                                    {formatDate(selectedReview.created_at)}
                                </Typography>
                            </Box>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle1" gutterBottom>
                                Review Text
                            </Typography>
                            <Paper sx={{ p: 2, bgcolor: 'background.default', minHeight: 150 }}>
                                <Typography variant="body1">
                                    {selectedReview.review_text || "No text provided"}
                                </Typography>
                            </Paper>
                            
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Moderation
                                </Typography>
                                <FormControl fullWidth sx={{ mb: 2 }}>
                                    <InputLabel id="moderation-status-label">Status</InputLabel>
                                    <Select
                                        labelId="moderation-status-label"
                                        value={moderationStatus}
                                        label="Status"
                                        onChange={(e) => setModerationStatus(e.target.value)}
                                    >
                                        <MenuItem value="">
                                            <em>Pending</em>
                                        </MenuItem>
                                        <MenuItem value="approved">Approved</MenuItem>
                                        <MenuItem value="flagged">Flagged</MenuItem>
                                        <MenuItem value="rejected">Rejected</MenuItem>
                                    </Select>
                                </FormControl>
                                
                                <TextField
                                    label="Moderation Notes"
                                    multiline
                                    rows={3}
                                    value={moderationNotes}
                                    onChange={(e) => setModerationNotes(e.target.value)}
                                    placeholder="Internal notes about this review..."
                                    fullWidth
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button
                        color="error"
                        startIcon={<Delete />}
                        onClick={() => {
                            setDetailsOpen(false);
                            handleDelete(selectedReview.review_id);
                        }}
                    >
                        Delete Review
                    </Button>
                    <Button 
                        onClick={() => setDetailsOpen(false)}
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={handleModerate}
                        disabled={!moderationStatus}
                    >
                        Save Moderation
                    </Button>
                </DialogActions>
            </Dialog>
        );
    };

    // Render the analytics modal
    const renderAnalyticsModal = () => {
        return (
            <Dialog
                open={analyticsOpen}
                onClose={() => setAnalyticsOpen(false)}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle>
                    Review Analytics
                </DialogTitle>
                <DialogContent dividers>
                    {loadingAnalytics ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : !analytics ? (
                        <Alert severity="info">
                            No analytics data available
                        </Alert>
                    ) : (
                        <Grid container spacing={3}>
                            {/* Summary cards */}
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                    <Card sx={{ flexGrow: 1, minWidth: 200 }}>
                                        <CardContent>
                                            <Typography variant="h4" color="primary.main">
                                                {analytics.analytics.total_reviews}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Total Reviews
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                    
                                    <Card sx={{ flexGrow: 1, minWidth: 200 }}>
                                        <CardContent>
                                            <Typography variant="h4" color="primary.main">
                                                {analytics.analytics.average_rating.toFixed(1)}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Average Rating
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                    
                                    <Card sx={{ flexGrow: 1, minWidth: 200 }}>
                                        <CardContent>
                                            <Typography variant="h4" color="success.main">
                                                {Math.round((analytics.analytics.positive_reviews / (analytics.analytics.total_reviews || 1)) * 100)}%
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Positive Reviews
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Box>
                            </Grid>
                            
                            {/* Rating distribution */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="h6" gutterBottom>
                                    Rating Distribution
                                </Typography>
                                <Paper sx={{ p: 2 }}>
                                    {[5, 4, 3, 2, 1].map((stars) => {
                                        const count = analytics.analytics[`${stars}_star`] || 0;
                                        const percent = (count / (analytics.analytics.total_reviews || 1)) * 100;
                                        
                                        return (
                                            <Box key={stars} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <Box sx={{ width: '80px', display: 'flex', alignItems: 'center' }}>
                                                    <Typography variant="body2" sx={{ mr: 1 }}>
                                                        {stars} stars
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ flexGrow: 1, mr: 2 }}>
                                                    <Box 
                                                        sx={{ 
                                                            height: 12, 
                                                            bgcolor: 'grey.300', 
                                                            borderRadius: 1,
                                                            overflow: 'hidden'
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                height: '100%',
                                                                width: `${percent}%`,
                                                                bgcolor: stars >= 4 ? 'success.main' : 
                                                                        stars === 3 ? 'warning.main' : 'error.main',
                                                                transition: 'width 1s ease-in-out'
                                                            }}
                                                        />
                                                    </Box>
                                                </Box>
                                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: '60px' }}>
                                                    {count} ({Math.round(percent)}%)
                                                </Typography>
                                            </Box>
                                        );
                                    })}
                                </Paper>
                            </Grid>
                            
                            {/* Recent reviews */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="h6" gutterBottom>
                                    Recent Reviews
                                </Typography>
                                <Paper sx={{ p: 2 }}>
                                    {analytics.recentReviews && analytics.recentReviews.length > 0 ? (
                                        analytics.recentReviews.map((review) => (
                                            <Box key={review.review_id} sx={{ mb: 2 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                    <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                                                        {review.username?.charAt(0).toUpperCase() || 'U'}
                                                    </Avatar>
                                                    <Typography variant="subtitle2">
                                                        {review.username || 'Anonymous'}
                                                    </Typography>
                                                    <Box sx={{ ml: 'auto' }}>
                                                        <StarRating value={review.rating} readOnly size="small" />
                                                    </Box>
                                                </Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    {truncateText(review.review_text, 80) || "No comment provided."}
                                                </Typography>
                                                <Divider sx={{ mt: 1 }} />
                                            </Box>
                                        ))
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            No recent reviews available
                                        </Typography>
                                    )}
                                </Paper>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAnalyticsOpen(false)}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        );
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Review Management
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Manage and moderate user reviews
                </Typography>
            </Box>
            
            {/* Success or error messages */}
            {success && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}
            
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}
            
            {/* Toolbar with actions */}
            <Paper sx={{ mb: 3, p: 2 }}>
                <Toolbar disableGutters sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1 
                }}>
                    <Box>
                        <Button
                            variant="contained"
                            startIcon={<BarChart />}
                            onClick={handleOpenAnalytics}
                        >
                            Review Analytics
                        </Button>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant={showFilters ? "contained" : "outlined"}
                            startIcon={<FilterList />}
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            Filters
                        </Button>
                        
                        <Button
                            variant="outlined"
                            startIcon={<Refresh />}
                            onClick={() => {
                                setPage(1);
                                fetchReviews();
                            }}
                            disabled={loading}
                        >
                            Refresh
                        </Button>
                    </Box>
                </Toolbar>
            </Paper>
            
            {/* Filters */}
            {showFilters && (
                <Paper sx={{ mb: 3, p: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel id="status-filter-label">Moderation Status</InputLabel>
                                <Select
                                    labelId="status-filter-label"
                                    value={filters.status}
                                    label="Moderation Status"
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                >
                                    <MenuItem value="all">All Statuses</MenuItem>
                                    <MenuItem value="pending">Pending</MenuItem>
                                    <MenuItem value="approved">Approved</MenuItem>
                                    <MenuItem value="flagged">Flagged</MenuItem>
                                    <MenuItem value="rejected">Rejected</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel id="min-rating-label">Min Rating</InputLabel>
                                <Select
                                    labelId="min-rating-label"
                                    value={filters.minRating}
                                    label="Min Rating"
                                    onChange={(e) => handleFilterChange('minRating', e.target.value)}
                                >
                                    <MenuItem value="">Any</MenuItem>
                                    <MenuItem value="1">1 Star</MenuItem>
                                    <MenuItem value="2">2 Stars</MenuItem>
                                    <MenuItem value="3">3 Stars</MenuItem>
                                    <MenuItem value="4">4 Stars</MenuItem>
                                    <MenuItem value="5">5 Stars</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel id="sort-by-label">Sort By</InputLabel>
                                <Select
                                    labelId="sort-by-label"
                                    value={filters.sortBy}
                                    label="Sort By"
                                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                >
                                    <MenuItem value="created_at">Date</MenuItem>
                                    <MenuItem value="rating">Rating</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel id="sort-dir-label">Sort Direction</InputLabel>
                                <Select
                                    labelId="sort-dir-label"
                                    value={filters.sortDir}
                                    label="Sort Direction"
                                    onChange={(e) => handleFilterChange('sortDir', e.target.value)}
                                >
                                    <MenuItem value="desc">Newest First</MenuItem>
                                    <MenuItem value="asc">Oldest First</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Paper>
            )}
            
            {/* Reviews table */}
            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <TableContainer sx={{ maxHeight: 600 }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Event</TableCell>
                                <TableCell>User</TableCell>
                                <TableCell>Rating</TableCell>
                                <TableCell>Review</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center">
                                        <CircularProgress size={30} sx={{ my: 3 }} />
                                    </TableCell>
                                </TableRow>
                            ) : reviews.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center">
                                        <Typography variant="body1" color="text.secondary" sx={{ py: 3 }}>
                                            No reviews found
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                reviews.map((review) => (
                                    <TableRow 
                                        key={review.review_id}
                                        hover
                                        sx={{
                                            cursor: 'pointer',
                                            '&:hover': {
                                                bgcolor: 'action.hover'
                                            }
                                        }}
                                        onClick={() => handleViewDetails(review)}
                                    >
                                        <TableCell>#{review.review_id}</TableCell>
                                        <TableCell>{review.event_name || `Event #${review.event_id}`}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                                                    {review.username?.charAt(0).toUpperCase() || 'U'}
                                                </Avatar>
                                                <Typography variant="body2">
                                                    {review.username || `User #${review.user_id}`}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <StarRating value={review.rating} readOnly size="small" />
                                        </TableCell>
                                        <TableCell>
                                            {truncateText(review.review_text, 50) || "No text provided"}
                                        </TableCell>
                                        <TableCell>
                                            {formatDate(review.created_at)}
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={review.moderation_status ? review.moderation_status.toUpperCase() : 'PENDING'}
                                                color={getModerationStatusColor(review.moderation_status)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex' }}>
                                                <Tooltip title="View Details">
                                                    <IconButton size="small">
                                                        <Visibility fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                {review.moderation_status === 'flagged' && (
                                                    <Tooltip title="Flagged for Review">
                                                        <IconButton size="small" color="warning">
                                                            <WarningAmber fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                
                {/* Pagination */}
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    px: 2,
                    py: 1.5
                }}>
                    <Typography variant="body2" color="text.secondary">
                        {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'} found
                    </Typography>
                    <Pagination 
                        count={totalPages} 
                        page={page} 
                        onChange={handlePageChange} 
                        color="primary"
                        size="small"
                        disabled={loading}
                    />
                </Box>
            </Paper>
            
            {/* Modals */}
            {renderDetailsModal()}
            {renderAnalyticsModal()}
        </Box>
    );
};

export default ReviewManagement;