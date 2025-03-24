import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Typography, Paper, Avatar, TextField, Button,
    Grid, Divider, Tab, Tabs, CircularProgress, Alert,
    Card, CardContent, List, ListItem, ListItemText,
    ListItemAvatar, ListItemSecondaryAction, Chip, Dialog,
    DialogTitle, DialogContent, DialogActions, IconButton,
    InputAdornment
} from '@mui/material';
import {
    Edit, Save, Cancel, Event, Star,
    CalendarToday, Email, AccountCircle,
    Visibility, VisibilityOff, Person, Comment
} from '@mui/icons-material';
import api from '../utils/api';

function UserProfile() {
    // State management
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [tabValue, setTabValue] = useState(0);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        bio: '',
        profile_picture: ''
    });
    const [activities, setActivities] = useState([]);
    const [loadingActivities, setLoadingActivities] = useState(false);
    const [activitiesPage, setActivitiesPage] = useState(1);
    const [totalActivities, setTotalActivities] = useState(0);
    const [changePasswordOpen, setChangePasswordOpen] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordError, setPasswordError] = useState(null);
    const [passwordSuccess, setPasswordSuccess] = useState(null);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [userEngagement, setUserEngagement] = useState({
        eventsAttended: 0,
        reviewsSubmitted: 0,
        averageRating: 0,
        categoryPreferences: [],
    });
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    // Extract user ID from JWT on component mount
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setCurrentUserId(payload.userId);
            } catch (error) {
                console.error("Error extracting user ID from token:", error);
            }
        }
    }, []);

    // Fetch user profile
    const fetchUserProfile = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.users.getProfile();
            setProfile(data);
            setFormData({
                email: data.email || '',
                bio: data.bio || '',
                profile_picture: data.profile_picture || ''
            });
            setError(null);
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError(`Failed to load profile data: ${err.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch user activities - real reviews from the API
    const fetchUserActivities = useCallback(async () => {
        if (tabValue !== 1 || !currentUserId) return;

        setLoadingActivities(true);

        try {
            // IMPORTANT: Pass user_id as a query parameter to filter server-side
            const reviewsData = await api.reviews.getAllReviews({ user_id: currentUserId });

            // No client-side filtering needed now since we're filtering at the API level
            const reviewActivities = reviewsData.map(review => ({
                activity_type: 'review_submitted',
                review_id: review.review_id,
                event_id: review.event_id,
                name: review.event_name || `Event #${review.event_id}`,
                rating: review.rating,
                created_at: review.created_at
            }));

            // Calculate engagement stats
            const totalReviews = reviewActivities.length;
            let avgRating = 0;

            if (totalReviews > 0) {
                const totalRating = reviewActivities.reduce((sum, item) => sum + item.rating, 0);
                avgRating = totalRating / totalReviews;
            }

            // Update engagement metrics with correct counts
            setUserEngagement(prev => ({
                ...prev,
                reviewsSubmitted: totalReviews,
                averageRating: avgRating
            }));

            setActivities(reviewActivities);
        } catch (err) {
            console.error('Error fetching activities:', err);
            setActivities([]);
        } finally {
            setLoadingActivities(false);
        }
    }, [tabValue, currentUserId]);

    // Initial data loading
    useEffect(() => {
        fetchUserProfile();
    }, [fetchUserProfile]);

    // Load activities when tab changes or user ID is available
    useEffect(() => {
        if (currentUserId) {
            fetchUserActivities();
        }
    }, [fetchUserActivities, currentUserId, tabValue]);

    // Form input handlers
    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    }, []);

    const handlePasswordInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
        setPasswordError(null);
    }, []);

    // Action handlers
    const handleEditToggle = useCallback(() => {
        if (editMode) {
            // Cancel editing - reset form data to original profile values
            setFormData({
                email: profile?.email || '',
                bio: profile?.bio || '',
                profile_picture: profile?.profile_picture || ''
            });
        }
        setEditMode(prev => !prev);
        setSuccessMessage(null);
    }, [editMode, profile]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMessage(null);
        setError(null);

        try {
            const formDataObj = new FormData();

            // Add regular form fields
            formDataObj.append('email', formData.email);
            if (formData.bio) formDataObj.append('bio', formData.bio);

            // Add profile picture if selected
            if (selectedImage) {
                formDataObj.append('profile_picture', selectedImage);
            }

            // Use the new API method
            const updatedProfile = await api.users.updateProfileWithImage(formDataObj);
            setProfile(updatedProfile);
            setEditMode(false);
            setSuccessMessage('Profile updated successfully!');

            // Auto-dismiss success message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error('Error updating profile:', err);
            setError(err.message || 'Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [formData, selectedImage]);

    const handlePasswordChange = useCallback(async (e) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(null);

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
        }

        try {
            await api.users.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            setPasswordSuccess('Password updated successfully!');
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });

            // Close dialog after success
            setTimeout(() => {
                setChangePasswordOpen(false);
                setPasswordSuccess(null);
            }, 2000);
        } catch (err) {
            console.error('Error updating password:', err);
            setPasswordError(err.message || 'Failed to update password');
        }
    }, [passwordData]);

    const handleTabChange = useCallback((event, newValue) => {
        setTabValue(newValue);
    }, []);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onload = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
    };

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

    // Loading state
    if (loading && !profile) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Error state
    if (error && !profile) {
        return (
            <Box sx={{ maxWidth: 'sm', mx: 'auto', mt: 4 }}>
                <Alert severity="error">{error}</Alert>
                <Button
                    variant="contained"
                    sx={{ mt: 2 }}
                    onClick={fetchUserProfile}
                >
                    Retry
                </Button>
            </Box>
        );
    }


    return (
        <Box sx={{ width: '100%' }}>
            {/* Header Section */}
            <Paper sx={{ p: 4, mb: 3, borderRadius: 2 }}>
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} sm={2}>
                        <Avatar
                            src={profile?.profile_picture || ''}
                            alt={profile?.username}
                            sx={{ width: 100, height: 100, mx: { xs: 'auto', sm: 0 } }}
                        >
                            {profile?.username?.charAt(0).toUpperCase()}
                        </Avatar>
                    </Grid>
                    <Grid item xs={12} sm={8}>
                        <Typography variant="h4" component="h1" gutterBottom>
                            {profile?.username}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Member since {formatDate(profile?.created_at || profile?.registration_date)}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <Button
                            variant="contained"
                            color={editMode ? "error" : "primary"}
                            startIcon={editMode ? <Cancel /> : <Edit />}
                            onClick={handleEditToggle}
                            fullWidth
                        >
                            {editMode ? 'Cancel' : 'Edit Profile'}
                        </Button>
                    </Grid>
                </Grid>

                {successMessage && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                        {successMessage}
                    </Alert>
                )}

                {error && editMode && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}
            </Paper>

            {/* Tabs and Content */}
            <Paper sx={{ borderRadius: 2 }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab label="Profile Information" />
                    <Tab label="Activity" />
                    <Tab label="Security" />
                </Tabs>

                {/* Profile Information Tab */}
                {tabValue === 0 && (
                    <Box sx={{ p: 3 }}>
                        {editMode ? (
                            <form onSubmit={handleSubmit}>
                                <Grid container spacing={3}>
                                    <Grid item xs={12}>
                                        <TextField
                                            label="Email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            fullWidth
                                            margin="normal"
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Email />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Box sx={{ border: '1px dashed #ccc', p: 2, borderRadius: 1 }}>
                                            <Typography variant="subtitle1" gutterBottom>Profile Picture</Typography>
                                            {imagePreview ? (
                                                <Box sx={{ position: 'relative', mt: 2, mb: 2 }}>
                                                    <img
                                                        src={imagePreview}
                                                        alt="Profile preview"
                                                        style={{
                                                            width: '100%',
                                                            maxHeight: '200px',
                                                            objectFit: 'contain'
                                                        }}
                                                    />
                                                    <IconButton
                                                        sx={{
                                                            position: 'absolute',
                                                            top: 0,
                                                            right: 0,
                                                            backgroundColor: 'rgba(0,0,0,0.5)',
                                                            color: 'white',
                                                        }}
                                                        onClick={handleRemoveImage}
                                                    >
                                                        <Delete />
                                                    </IconButton>
                                                </Box>
                                            ) : (
                                                <Button
                                                    component="label"
                                                    variant="outlined"
                                                    startIcon={<CloudUpload />}
                                                    sx={{ mt: 2 }}
                                                    fullWidth
                                                >
                                                    Upload Image
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        hidden
                                                        onChange={handleImageChange}
                                                    />
                                                </Button>
                                            )}
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            label="Bio"
                                            name="bio"
                                            value={formData.bio}
                                            onChange={handleInputChange}
                                            fullWidth
                                            margin="normal"
                                            multiline
                                            rows={4}
                                            placeholder="Tell us about yourself..."
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            color="primary"
                                            startIcon={<Save />}
                                            disabled={loading}
                                            sx={{ mt: 2 }}
                                        >
                                            {loading ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </Grid>
                                </Grid>
                            </form>
                        ) : (
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="overline" color="text.secondary">
                                            Email
                                        </Typography>
                                        <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                            <Email fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                                            {profile?.email || 'No email provided'}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="overline" color="text.secondary">
                                        Bio
                                    </Typography>
                                    <Typography variant="body1" sx={{ mt: 1 }}>
                                        {profile?.bio || 'No bio provided. Tell us about yourself!'}
                                    </Typography>
                                </Grid>
                            </Grid>
                        )}
                    </Box>
                )}

                {/* Activity Tab */}
                {tabValue === 1 && (
                    <Box sx={{ p: 3 }}>
                        {/* New Activity Stats Section */}
                        <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
                            <Typography variant="h6" gutterBottom>Your Activity Stats</Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6}>
                                    <Card sx={{ height: '100%' }}>
                                        <CardContent sx={{ textAlign: 'center' }}>
                                            <Comment color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                                            <Typography variant="h4" color="secondary.main">
                                                {userEngagement.reviewsSubmitted}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Reviews Submitted
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Card sx={{ height: '100%' }}>
                                        <CardContent sx={{ textAlign: 'center' }}>
                                            <Star sx={{ fontSize: 40, mb: 1, color: 'gold' }} />
                                            <Typography variant="h4" sx={{ color: 'gold' }}>
                                                {userEngagement.averageRating.toFixed(1)}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Average Rating Given
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Paper>

                        <Typography variant="h6" gutterBottom>
                            Recent Activity
                        </Typography>

                        {loadingActivities ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : activities.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="body1" color="text.secondary">
                                    No recent activity found
                                </Typography>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    sx={{ mt: 2 }}
                                    onClick={() => {
                                        window.dispatchEvent(new CustomEvent('navigate', {
                                            detail: 'events'
                                        }));
                                    }}
                                >
                                    Browse Events
                                </Button>
                            </Box>
                        ) : (
                            <List>
                                {activities.map((activity, index) => (
                                    <React.Fragment key={`${activity.activity_type}-${activity.event_id || activity.review_id}`}>
                                        <ListItem alignItems="flex-start">
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: activity.activity_type === 'event_created' ? 'primary.main' : 'secondary.main' }}>
                                                    {activity.activity_type === 'event_created' ? <Event /> : <Star />}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Typography variant="subtitle1">
                                                        {activity.activity_type === 'event_created'
                                                            ? 'Created event: '
                                                            : 'Reviewed event: '}
                                                        <Typography component="span" fontWeight="bold">
                                                            {activity.name || 'Unnamed event'}
                                                        </Typography>
                                                    </Typography>
                                                }
                                                secondary={
                                                    <>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {formatDate(activity.created_at || new Date())}
                                                        </Typography>
                                                        {activity.activity_type === 'review_submitted' && activity.rating && (
                                                            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                                                                {[...Array(5)].map((_, i) => (
                                                                    <Star
                                                                        key={i}
                                                                        fontSize="small"
                                                                        sx={{
                                                                            color: i < (activity.rating || 0) ? 'gold' : 'gray',
                                                                            mr: 0.5
                                                                        }}
                                                                    />
                                                                ))}
                                                            </Box>
                                                        )}
                                                        {activity.activity_type === 'event_created' && activity.event_date && (
                                                            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                                                                <CalendarToday fontSize="small" sx={{ mr: 0.5 }} />
                                                                <Typography variant="body2">
                                                                    {formatDate(activity.event_date)}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                    </>
                                                }
                                            />
                                            <ListItemSecondaryAction>
                                                <Chip
                                                    label={activity.activity_type === 'event_created' ? 'Created' : 'Reviewed'}
                                                    color={activity.activity_type === 'event_created' ? 'primary' : 'secondary'}
                                                    size="small"
                                                />
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                        {index < activities.length - 1 && <Divider component="li" />}
                                    </React.Fragment>
                                ))}
                            </List>
                        )}
                    </Box>
                )}


                {/* Security Tab */}
                {tabValue === 2 && (
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Account Security
                        </Typography>

                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" component="div">
                                    Password
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Change your account password regularly to keep your account secure.
                                </Typography>
                                <Button
                                    variant="outlined"
                                    onClick={() => setChangePasswordOpen(true)}
                                >
                                    Change Password
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent>
                                <Typography variant="h6" component="div">
                                    Account
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Download your data or delete your account.
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Button variant="outlined">
                                        Download My Data
                                    </Button>
                                    <Button variant="outlined" color="error">
                                        Delete Account
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                )}
            </Paper>

            {/* Change Password Dialog */}
            <Dialog
                open={changePasswordOpen}
                onClose={() => {
                    if (!passwordSuccess) {
                        setChangePasswordOpen(false);
                        setPasswordData({
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: ''
                        });
                        setPasswordError(null);
                    }
                }}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>Change Password</DialogTitle>
                <DialogContent>
                    {passwordError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {passwordError}
                        </Alert>
                    )}

                    {passwordSuccess && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {passwordSuccess}
                        </Alert>
                    )}

                    <form id="change-password-form" onSubmit={handlePasswordChange}>
                        <TextField
                            label="Current Password"
                            name="currentPassword"
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={passwordData.currentPassword}
                            onChange={handlePasswordInputChange}
                            fullWidth
                            margin="normal"
                            required
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            edge="end"
                                        >
                                            {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <TextField
                            label="New Password"
                            name="newPassword"
                            type={showNewPassword ? 'text' : 'password'}
                            value={passwordData.newPassword}
                            onChange={handlePasswordInputChange}
                            fullWidth
                            margin="normal"
                            required
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            edge="end"
                                        >
                                            {showNewPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <TextField
                            label="Confirm New Password"
                            name="confirmPassword"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordInputChange}
                            fullWidth
                            margin="normal"
                            required
                            error={passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== ''}
                            helperText={
                                passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== ''
                                    ? "Passwords don't match" : ""
                            }
                        />
                    </form>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setChangePasswordOpen(false);
                            setPasswordData({
                                currentPassword: '',
                                newPassword: '',
                                confirmPassword: ''
                            });
                            setPasswordError(null);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="change-password-form"
                        variant="contained"
                        color="primary"
                        disabled={!!passwordSuccess}
                    >
                        Update Password
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default UserProfile;