// ReviewDialog.jsx
import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, Box, Avatar, Rating, TextField,
    Divider, CircularProgress, Chip, IconButton, Alert,
    Select, MenuItem, FormControl, InputLabel, Paper,
    Tabs, Tab
} from '@mui/material';
import {
    Edit, Delete, Flag, Check, Close, Add,
    Sort, FilterList, Search, Refresh, MoreVert
} from '@mui/icons-material';
import StarRating from './StarRating';

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
    
    const getToken = () => {
        return localStorage.getItem('authToken');
    };

    const getCurrentUserId = () => {
        const token = getToken();
        if (!token) return null;
        
        try {
            const payload = token.split('.')[1];
            const decodedPayload = JSON.parse(atob(payload));
            return decodedPayload.userId;
        } catch (error) {
            console.error('Error decoding JWT token:', error);
            return null;
        }
    };
    
    const currentUserId = getCurrentUserId();

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

    const fetchReviews = async () => {
        if (!eventId) return;
        
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
            
            let url = `http://localhost:5000/api/events/${eventId}/reviews?sort_by=${sortBy}&sort_order=${sortOrder}`;
            
            if (filterRating !== 'all') {
                url += `&rating=${filterRating}`;
            }

            const response = await fetch(url, { headers });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch reviews: ${response.status}`);
            }
            
            const data = await response.json();
            setReviews(data);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            setError(error.message);
            setReviews([]);
        } finally {
            setLoading(false);
        }
    };
    
    const fetchAnalytics = async () => {
        if (!eventId) return;
        
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
            
            const response = await fetch(`http://localhost:5000/api/reviews/analytics?event_id=${eventId}`, { headers });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch analytics: ${response.status}`);
            }
            
            const data = await response.json();
            setAnalytics(data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            setAnalytics(null);
        } finally {
            setLoadingAnalytics(false);
        }
    };

    useEffect(() => {
        if (open && eventId) {
            fetchReviews();
        }
    }, [open, eventId, sortBy, sortOrder, filterRating]);
    
    useEffect(() => {
        if (open && eventId && currentTab === 1) {
            fetchAnalytics();
        }
    }, [open, eventId, currentTab, reviews]);

    const handleAddReview = async () => {
        if (newReview.rating === 0) {
            setError('Please select a rating');
            return;
        }
        
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        
        try {
            const token = getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            const response = await fetch(`http://localhost:5000/api/events/${eventId}/reviews`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    rating: newReview.rating,
                    review_text: newReview.review_text
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to add review: ${response.status}`);
            }
            
            const data = await response.json();
            
            setReviews([data, ...reviews]);
            setNewReview({ rating: 0, review_text: '' });
            setShowAddReview(false);
            setSuccessMessage('Review added successfully!');
            
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error('Error adding review:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateReview = async () => {
        if (!editingReview) return;
        
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        
        try {
            const token = getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            const response = await fetch(`http://localhost:5000/api/reviews/${editingReview.review_id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    rating: editingReview.rating,
                    review_text: editingReview.review_text
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to update review: ${response.status}`);
            }
            
            const updatedReview = await response.json();
            
            setReviews(reviews.map(review => 
                review.review_id === updatedReview.review_id ? updatedReview : review
            ));
            
            setEditingReview(null);
            setSuccessMessage('Review updated successfully!');
            
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error('Error updating review:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!reviewId) return;
        
        if (!window.confirm('Are you sure you want to delete this review?')) {
            return;
        }
        
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        
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
            
            setReviews(reviews.filter(review => review.review_id !== reviewId));
            setSuccessMessage('Review deleted successfully!');
            
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error('Error deleting review:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleNewReviewChange = (field, value) => {
        setNewReview({
            ...newReview,
            [field]: value
        });
    };

    const handleEditingReviewChange = (field, value) => {
        setEditingReview({
            ...editingReview,
            [field]: value
        });
    };

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    const renderTabContent = () => {
        switch (currentTab) {
            case 0:
                return renderReviewsTab();
            case 1:
                return renderAnalyticsTab();
            default:
                return renderReviewsTab();
        }
    };

    const renderReviewsTab = () => {
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
    };

    const renderAnalyticsTab = () => {
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
    };

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
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ReviewDialog;