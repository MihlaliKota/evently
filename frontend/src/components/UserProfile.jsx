import React, { useState, useEffect } from 'react';
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
    Visibility, VisibilityOff
} from '@mui/icons-material';

function UserProfile() {
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

    // Get token from localStorage
    const getToken = () => {
        // Add debugging output
        const token = localStorage.getItem('authToken');
        console.log('Token found in UserProfile:', token ? 'Yes' : 'No');
        return token;
    };

    // Fetch user profile
    useEffect(() => {
        const fetchUserProfile = async () => {
            setLoading(true);
            try {
                const token = getToken();
                if (!token) {
                    throw new Error('No authentication token found');
                }

                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };

                console.log('UserProfile: Fetching profile with token');

                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                // Make request to backend - ensure it includes the full URL
                const response = await fetch(`${apiUrl}/api/users/profile`, { headers });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error('Profile fetch error:', response.status, errorData);
                    throw new Error(errorData.error || `Failed to fetch profile: ${response.status}`);
                }

                const data = await response.json();
                console.log('Profile data received');

                setProfile(data);
                setFormData({
                    email: data.email || '',
                    bio: data.bio || '',
                    profile_picture: data.profile_picture || ''
                });
                setError(null);
            } catch (err) {
                console.error('Error fetching profile:', err);
                setError(`Failed to load profile data: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, []);

    // Fetch user activities
    const fetchUserActivities = async () => {
        if (tabValue !== 1) return;

        setLoadingActivities(true);
        try {
            const token = getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            // Use full URL for API call
            const response = await fetch('http://localhost:5000/api/users/activities', { headers });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to fetch activities: ${response.status}`);
            }

            const data = await response.json();
            setActivities(data);
        } catch (err) {
            console.error('Error fetching activities:', err);
        } finally {
            setLoadingActivities(false);
        }
    };

    useEffect(() => {
        fetchUserActivities();
    }, [tabValue]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleEditToggle = () => {
        if (editMode) {
            // Cancel editing - reset form data to original profile values
            setFormData({
                email: profile.email || '',
                bio: profile.bio || '',
                profile_picture: profile.profile_picture || ''
            });
        }
        setEditMode(!editMode);
        setSuccessMessage(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMessage(null);
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

            // Use full URL for API call
            const response = await fetch('http://localhost:5000/api/users/profile', {
                method: 'PUT',
                headers,
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to update profile: ${response.status}`);
            }

            const updatedProfile = await response.json();
            setProfile(updatedProfile);
            setEditMode(false);
            setSuccessMessage('Profile updated successfully!');
        } catch (err) {
            console.error('Error updating profile:', err);
            setError(err.message || 'Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(null);

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
        }

        try {
            const token = getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            // Use full URL for API call
            const response = await fetch('http://localhost:5000/api/users/password', {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to update password: ${response.status}`);
            }

            setPasswordSuccess('Password updated successfully!');
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });

            // Close dialog after 2 seconds
            setTimeout(() => {
                setChangePasswordOpen(false);
                setPasswordSuccess(null);
            }, 2000);
        } catch (err) {
            console.error('Error updating password:', err);
            setPasswordError(err.message || 'Failed to update password');
        }
    };

    const handlePasswordInputChange = (e) => {
        const { name, value } = e.target;
        setPasswordData({
            ...passwordData,
            [name]: value
        });
        setPasswordError(null);
    };

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
                    onClick={() => window.location.reload()}
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
                                        <TextField
                                            label="Profile Picture URL"
                                            name="profile_picture"
                                            value={formData.profile_picture}
                                            onChange={handleInputChange}
                                            fullWidth
                                            margin="normal"
                                            placeholder="Enter a URL for your profile picture"
                                            helperText="Leave empty to use initials"
                                        />
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
                                                            {activity.name}
                                                        </Typography>
                                                    </Typography>
                                                }
                                                secondary={
                                                    <>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {formatDate(activity.created_at)}
                                                        </Typography>
                                                        {activity.activity_type === 'review_submitted' && (
                                                            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                                                                {[...Array(5)].map((_, i) => (
                                                                    <Star
                                                                        key={i}
                                                                        fontSize="small"
                                                                        sx={{
                                                                            color: i < activity.rating ? 'gold' : 'gray',
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
                            error={passwordData.newPassword !== passwordData.confirmPassword}
                            helperText={
                                passwordData.newPassword !== passwordData.confirmPassword ?
                                    "Passwords don't match" : ""
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