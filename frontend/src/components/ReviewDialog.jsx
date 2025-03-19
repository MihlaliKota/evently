import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, Box, Avatar, TextField,
    Divider, CircularProgress, Chip, IconButton, Alert,
    Select, MenuItem, FormControl, InputLabel, Paper,
    Tabs, Tab
} from '@mui/material';
import {
    Edit, Delete, Add, Sort, FilterList, 
    Search, Refresh, Close, Check
} from '@mui/icons-material';
import StarRating from './StarRating';
import api from '../utils/api';

const ReviewDialog = ({ 
    open, 
    onClose, 
    eventId, 
    eventName, 
    eventDate, 
    eventLocation,
    initialRating,
    reviewCount
}) => {
    // State management
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [editingReview, setEditingReview] = useState(null);
    const [newReview, setNewReview] = useState({
        rating: 0,
        review_text: ''
    });
    const [showAddReview, setShowAddReview] = useState(false);
    const [currentTab, setCurrentTab] = useState(0);
    const [analytics, setAnalytics] = useState(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);
    
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');
    const [filterRating, setFilterRating] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    
    // Get current user ID from JWT
    const getCurrentUserId = useCallback(() => {
        const token = localStorage.getItem('authToken');
        if (!token) return null;
        
        try {
            const payload = token.split('.')[1];
            const decodedPayload = JSON.parse(atob(payload));
            return decodedPayload.userId;
        } catch (error) {
            console.error('Error decoding JWT token:', error);
            return null;
        }
    }, []);
    
    const currentUserId = useMemo(() => getCurrentUserId(), [getCurrentUserId]);

    // Format date for display
    const formatDate = useCallback((dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
        }).format(date);
    }, []);

    // Fetch reviews when dialog opens or filters change
    const fetchReviews = useCallback(async () => {
        if (!eventId || !open) return;
        
        setLoading(true);
        setError(null);
        
        try {
            // Use the centralized API service with proper error handling
            const reviews = await api.reviews.getEventReviews(eventId);
            
            if (!reviews || !Array.isArray(reviews)) {
                throw new Error("Invalid response format");
            }
            
            // Apply client-side sorting and filtering
            let filteredReviews = [...reviews];
            
            // Apply rating filter
            if (filterRating !== 'all') {
                filteredReviews = filteredReviews.filter(
                    review => review.rating === parseInt(filterRating)
                );
            }
            
            // Apply sorting
            filteredReviews.sort((a, b) => {
                let compareA, compareB;
                
                if (sortBy === 'rating') {
                    compareA = a.rating;
                    compareB = b.rating;
                } else {
                    compareA = new Date(a.created_at);
                    compareB = new Date(b.created_at);
                }
                
                if (sortOrder === 'asc') {
                    return compareA < compareB ? -1 : compareA > compareB ? 1 : 0;
                } else {
                    return compareA > compareB ? -1 : compareA < compareB ? 1 : 0;
                }
            });
            
            setReviews(filteredReviews);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            setError(typeof error === 'string' ? error : error.message || 'Failed to load reviews');
            setReviews([]);
        } finally {
            setLoading(false);
        }
    }, [eventId, open, sortBy, sortOrder, filterRating]);
    
    // Fetch analytics for the event
    const fetchAnalytics = useCallback(async () => {
        if (!eventId || !open || currentTab !== 1) return;
        
        setLoadingAnalytics(true);
        
        try {
            const analyticsData = await api.reviews.getReviewAnalytics(eventId);
            setAnalytics(analyticsData);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            setAnalytics(null);
        } finally {
            setLoadingAnalytics(false);
        }
    }, [eventId, open, currentTab]);

    // Load data when dialog opens or dependencies change
    useEffect(() => {
        if (open) {
            fetchReviews();
            setShowAddReview(false);
            setEditingReview(null);
        }
    }, [open, fetchReviews]);
    
    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics, reviews]);

    // Clear form when dialog closes
    useEffect(() => {
        if (!open) {
            setNewReview({ rating: 0, review_text: '' });
            setEditingReview(null);
            setShowAddReview(false);
            setError(null);
            setSuccessMessage(null);
        }
    }, [open]);

    // Handle adding a new review
    const handleAddReview = useCallback(async () => {
    if (newReview.rating === 0) {
        setError('Please select a rating');
        return;
    }
    
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
        const data = await api.reviews.createReview(eventId, {
            rating: newReview.rating,
            review_text: newReview.review_text
        });
        
        // Validate response data
        if (!data) {
            throw new Error('Failed to add review: Invalid response');
        }
        
        setReviews(prev => [data, ...prev]);
        setNewReview({ rating: 0, review_text: '' });
        setShowAddReview(false);
        setSuccessMessage('Review added successfully!');
        
        setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
        console.error('Error adding review:', error);
        setError(typeof error === 'string' ? error : error.message || 'Failed to add review');
    } finally {
        setLoading(false);
    }
}, [eventId, newReview]);

    // Handle updating a review
    const handleUpdateReview = useCallback(async () => {
        if (!editingReview) return;
        
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        
        try {
            const updatedReview = await api.reviews.updateReview(editingReview.review_id, {
                rating: editingReview.rating,
                review_text: editingReview.review_text
            });
            
            setReviews(reviews.map(review => 
                review.review_id === updatedReview.review_id ? updatedReview : review
            ));
            
            setEditingReview(null);
            setSuccessMessage('Review updated successfully!');
            
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error('Error updating review:', error);
            setError(error.message || 'Failed to update review');
        } finally {
            setLoading(false);
        }
    }, [editingReview, reviews]);

    // Handle deleting a review
    const handleDeleteReview = useCallback(async (reviewId) => {
        if (!reviewId) return;
        
        if (!window.confirm('Are you sure you want to delete this review?')) {
            return;
        }
        
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        
        try {
            await api.reviews.deleteReview(reviewId);
            
            setReviews(reviews.filter(review => review.review_id !== reviewId));
            setSuccessMessage('Review deleted successfully!');
            
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error('Error deleting review:', error);
            setError(error.message || 'Failed to delete review');
        } finally {
            setLoading(false);
        }
    }, [reviews]);

    // Form input handlers
    const handleNewReviewChange = useCallback((field, value) => {
        setNewReview(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    const handleEditingReviewChange = useCallback((field, value) => {
        setEditingReview(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    const handleTabChange = useCallback((event, newValue) => {
        setCurrentTab(newValue);
    }, []);

    // Tab content rendering functions
    const renderReviewsTab = useCallback(() => {
        return (
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Button
                        startIcon={<Add />}
                        color="primary"
                        onClick={() => setShowAddReview(!showAddReview)}
                        disabled={loading}
                    >
                        Add Review
                    </Button>
                    <Box>
                        <IconButton 
                            onClick={() => setShowFilters(!showFilters)}
                            color={showFilters ? "primary" : "default"}
                        >
                            <FilterList />
                        </IconButton>
                        <IconButton onClick={fetchReviews} disabled={loading}>
                            <Refresh />
                        </IconButton>
                    </Box>
                </Box>
                
                {showFilters && (
                    <Paper sx={{ p: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                            <FormControl sx={{ minWidth: 120 }} size="small">
                                <InputLabel id="filter-rating-label">Rating</InputLabel>
                                <Select
                                    labelId="filter-rating-label"
                                    value={filterRating}
                                    label="Rating"
                                    onChange={(e) => setFilterRating(e.target.value)}
                                >
                                    <MenuItem value="all">All Ratings</MenuItem>
                                    <MenuItem value="5">5 Stars</MenuItem>
                                    <MenuItem value="4">4 Stars</MenuItem>
                                    <MenuItem value="3">3 Stars</MenuItem>
                                    <MenuItem value="2">2 Stars</MenuItem>
                                    <MenuItem value="1">1 Star</MenuItem>
                                </Select>
                            </FormControl>
                            
                            <FormControl sx={{ minWidth: 120 }} size="small">
                                <InputLabel id="sort-by-label">Sort By</InputLabel>
                                <Select
                                    labelId="sort-by-label"
                                    value={sortBy}
                                    label="Sort By"
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    <MenuItem value="created_at">Date</MenuItem>
                                    <MenuItem value="rating">Rating</MenuItem>
                                </Select>
                            </FormControl>
                            
                            <FormControl sx={{ minWidth: 120 }} size="small">
                                <InputLabel id="sort-order-label">Order</InputLabel>
                                <Select
                                    labelId="sort-order-label"
                                    value={sortOrder}
                                    label="Order"
                                    onChange={(e) => setSortOrder(e.target.value)}
                                >
                                    <MenuItem value="desc">Descending</MenuItem>
                                    <MenuItem value="asc">Ascending</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </Paper>
                )}
                
                {showAddReview && (
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Write a Review
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" gutterBottom>
                                Rating
                            </Typography>
                            <StarRating 
                                value={newReview.rating} 
                                onChange={(value) => handleNewReviewChange('rating', value)}
                                size="large"
                                precision={0.5}
                                showValue
                                hoverLabels={[
                                    'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'
                                ]}
                            />
                        </Box>
                        <TextField
                            label="Your Review"
                            multiline
                            rows={4}
                            value={newReview.review_text}
                            onChange={(e) => handleNewReviewChange('review_text', e.target.value)}
                            fullWidth
                            variant="outlined"
                            placeholder="Share your experience with this event..."
                            sx={{ mb: 2 }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <Button 
                                onClick={() => {
                                    setShowAddReview(false);
                                    setNewReview({ rating: 0, review_text: '' });
                                }}
                            >
                                Cancel
                            </Button>
                            <Button 
                                variant="contained" 
                                color="primary"
                                onClick={handleAddReview}
                                disabled={loading || newReview.rating === 0}
                            >
                                Submit Review
                            </Button>
                        </Box>
                    </Paper>
                )}
                
                {successMessage && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {successMessage}
                    </Alert>
                )}
                
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : reviews.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                            No reviews yet. Be the first to review this event!
                        </Typography>
                    </Box>
                ) : (
                    <Box>
                        {reviews.map((review) => (
                            <Box key={review.review_id} sx={{ mb: 3 }}>
                                {editingReview && editingReview.review_id === review.review_id ? (
                                    <Paper sx={{ p: 2 }}>
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="body2" gutterBottom>
                                                Rating
                                            </Typography>
                                            <StarRating 
                                                value={editingReview.rating} 
                                                onChange={(value) => handleEditingReviewChange('rating', value)}
                                                size="large"
                                                precision={0.5}
                                                showValue
                                            />
                                        </Box>
                                        <TextField
                                            label="Your Review"
                                            multiline
                                            rows={3}
                                            value={editingReview.review_text}
                                            onChange={(e) => handleEditingReviewChange('review_text', e.target.value)}
                                            fullWidth
                                            variant="outlined"
                                            sx={{ mb: 2 }}
                                        />
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                            <Button 
                                                onClick={() => setEditingReview(null)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button 
                                                variant="contained" 
                                                color="primary"
                                                onClick={handleUpdateReview}
                                                disabled={loading}
                                            >
                                                Update Review
                                            </Button>
                                        </Box>
                                    </Paper>
                                ) : (
                                    <Paper sx={{ p: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Avatar sx={{ mr: 1 }}>
                                                    {review.username?.charAt(0).toUpperCase() || 'U'}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="subtitle1">
                                                        {review.username || 'Anonymous'}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {formatDate(review.created_at)}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            {currentUserId && review.user_id === currentUserId && (
                                                <Box>
                                                    <IconButton 
                                                        size="small" 
                                                        onClick={() => setEditingReview(review)}
                                                        sx={{ ml: 1 }}
                                                    >
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                    <IconButton 
                                                        size="small" 
                                                        onClick={() => handleDeleteReview(review.review_id)}
                                                        sx={{ ml: 1 }}
                                                        color="error"
                                                    >
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            )}
                                        </Box>
                                        <Box sx={{ mb: 1 }}>
                                            <StarRating value={review.rating} readOnly size="small" />
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            {review.review_text || "No comment provided."}
                                        </Typography>
                                    </Paper>
                                )}
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>
        );
    }, [
        loading, reviews, showAddReview, showFilters, filterRating, sortBy, sortOrder,
        newReview, editingReview, successMessage, error, currentUserId, 
        handleNewReviewChange, handleEditingReviewChange,
        handleAddReview, handleUpdateReview, handleDeleteReview,
        fetchReviews, formatDate
    ]);

    // Analytics tab content
    const renderAnalyticsTab = useCallback(() => {
        if (loadingAnalytics) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            );
        }
        
        if (!analytics) {
            return (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                        No analytics available
                    </Typography>
                </Box>
            );
        }
        
        const { analytics: stats, recentReviews } = analytics;
        
        const totalReviews = stats.total_reviews || 1;
        const ratings = [
            { stars: 5, count: stats.five_star, percent: (stats.five_star / totalReviews) * 100 },
            { stars: 4, count: stats.four_star, percent: (stats.four_star / totalReviews) * 100 },
            { stars: 3, count: stats.three_star, percent: (stats.three_star / totalReviews) * 100 },
            { stars: 2, count: stats.two_star, percent: (stats.two_star / totalReviews) * 100 },
            { stars: 1, count: stats.one_star, percent: (stats.one_star / totalReviews) * 100 }
        ];
        
        return (
            <Box>
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Review Summary
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="primary.main">
                                {stats.average_rating ? stats.average_rating.toFixed(1) : '0.0'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Average Rating
                            </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="primary.main">
                                {stats.total_reviews || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Total Reviews
                            </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="success.main">
                                {Math.round((stats.positive_reviews / (totalReviews || 1)) * 100)}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Positive
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
                
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Rating Distribution
                    </Typography>
                    {ratings.map((rating) => (
                        <Box key={rating.stars} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Box sx={{ width: '80px', display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ mr: 1 }}>
                                    {rating.stars} stars
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
                                            width: `${rating.percent}%`,
                                            bgcolor: rating.stars >= 4 ? 'success.main' : 
                                                    rating.stars === 3 ? 'warning.main' : 'error.main',
                                            transition: 'width 1s ease-in-out'
                                        }}
                                    />
                                </Box>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: '60px' }}>
                                {rating.count} ({Math.round(rating.percent)}%)
                            </Typography>
                        </Box>
                    ))}
                </Paper>
                
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Recent Reviews
                    </Typography>
                    {recentReviews && recentReviews.length > 0 ? (
                        recentReviews.map((review) => (
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
                                    {review.review_text || "No comment provided."}
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
            </Box>
        );
    }, [analytics, loadingAnalytics]);

    // Handle tab switching
    const renderTabContent = useCallback(() => {
        switch (currentTab) {
            case 0:
                return renderReviewsTab();
            case 1:
                return renderAnalyticsTab();
            default:
                return renderReviewsTab();
        }
    }, [currentTab, renderReviewsTab, renderAnalyticsTab]);

    // Only render content when dialog is open for better performance
    if (!open) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="md"
            scroll="paper"
        >
            <DialogTitle>
                <Typography variant="h6">{eventName || 'Event Reviews'}</Typography>
                <Typography variant="subtitle2" color="text.secondary">
                    {eventDate && formatDate(eventDate)} • {eventLocation || 'No location'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <StarRating 
                        value={initialRating || 0} 
                        readOnly 
                        size="small"
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        {initialRating ? initialRating.toFixed(1) : '0.0'} ({reviewCount || 0} reviews)
                    </Typography>
                </Box>
            </DialogTitle>
            
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={currentTab} onChange={handleTabChange} aria-label="review tabs">
                    <Tab label="Reviews" />
                    <Tab label="Analytics" />
                </Tabs>
            </Box>
            
            <DialogContent dividers>
                {renderTabContent()}
            </DialogContent>
            
            <DialogActions>
                <Button onClick={onClose} startIcon={<Close />}>Close</Button>
                {currentTab === 0 && (
                    <Button 
                        variant="contained" 
                        color="primary" 
                        startIcon={<Add />}
                        onClick={() => setShowAddReview(true)}
                        disabled={showAddReview}
                    >
                        Add Review
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default ReviewDialog;