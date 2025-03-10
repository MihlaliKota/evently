import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, Paper, Card, CardContent, Divider,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, IconButton, Tabs, Tab, TextField, Dialog, DialogTitle,
    DialogContent, DialogActions, CircularProgress, Alert, Chip, Avatar,
    List, ListItem, ListItemText, ListItemAvatar, ListItemSecondaryAction
} from '@mui/material';
import {
    AdminPanelSettings, PeopleAlt, Category, Comment, Add,
    CheckCircle, Cancel, Delete, Edit, Refresh, Search
} from '@mui/icons-material';
import { fetchApi } from '../utils/api';

function AdminDashboard() {
    const [activeTab, setActiveTab] = useState(0);
    const [users, setUsers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [pendingReviews, setPendingReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalEvents: 0,
        totalReviews: 0
    });
    
    // Category dialog state
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    
    // User dialog state
    const [userDialogOpen, setUserDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userRoleForm, setUserRoleForm] = useState('user');
    
    useEffect(() => {
        if (activeTab === 0) {
            fetchAdminStats();
        } else if (activeTab === 1) {
            fetchUsers();
        } else if (activeTab === 2) {
            fetchCategories();
        } else if (activeTab === 3) {
            fetchPendingReviews();
        }
    }, [activeTab]);
    
    const fetchAdminStats = async () => {
        setLoading(true);
        try {
            const response = await fetchApi('/api/admin/stats');
            setStats(response);
            setError(null);
        } catch (error) {
            console.error('Error fetching admin stats:', error);
            setError('Failed to load admin statistics');
        } finally {
            setLoading(false);
        }
    };
    
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await fetchApi('/api/admin/users');
            setUsers(response);
            setError(null);
        } catch (error) {
            console.error('Error fetching users:', error);
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };
    
    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await fetchApi('/api/categories');
            setCategories(response);
            setError(null);
        } catch (error) {
            console.error('Error fetching categories:', error);
            setError('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };
    
    const fetchPendingReviews = async () => {
        setLoading(true);
        try {
            const response = await fetchApi('/api/admin/reviews/pending');
            setPendingReviews(response);
            setError(null);
        } catch (error) {
            console.error('Error fetching pending reviews:', error);
            setError('Failed to load pending reviews');
        } finally {
            setLoading(false);
        }
    };
    
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };
    
    // Category functions
    const handleOpenCategoryDialog = (category = null) => {
        if (category) {
            setCategoryForm({
                name: category.category_name,
                description: category.description || ''
            });
            setEditingCategoryId(category.category_id);
        } else {
            setCategoryForm({ name: '', description: '' });
            setEditingCategoryId(null);
        }
        setCategoryDialogOpen(true);
    };
    
    const handleCloseCategoryDialog = () => {
        setCategoryDialogOpen(false);
        setCategoryForm({ name: '', description: '' });
        setEditingCategoryId(null);
    };
    
    const handleCategoryFormChange = (e) => {
        const { name, value } = e.target;
        setCategoryForm(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const handleSaveCategory = async () => {
        try {
            if (editingCategoryId) {
                await fetchApi(`/api/categories/${editingCategoryId}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        name: categoryForm.name,
                        description: categoryForm.description
                    })
                });
            } else {
                await fetchApi('/api/categories', {
                    method: 'POST',
                    body: JSON.stringify({
                        name: categoryForm.name,
                        description: categoryForm.description
                    })
                });
            }
            handleCloseCategoryDialog();
            fetchCategories();
        } catch (error) {
            console.error('Error saving category:', error);
            setError('Failed to save category');
        }
    };
    
    const handleDeleteCategory = async (categoryId) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await fetchApi(`/api/categories/${categoryId}`, {
                    method: 'DELETE'
                });
                fetchCategories();
            } catch (error) {
                console.error('Error deleting category:', error);
                setError('Failed to delete category');
            }
        }
    };
    
    // User management functions
    const handleOpenUserDialog = (user) => {
        setSelectedUser(user);
        setUserRoleForm(user.role || 'user');
        setUserDialogOpen(true);
    };
    
    const handleCloseUserDialog = () => {
        setUserDialogOpen(false);
        setSelectedUser(null);
        setUserRoleForm('user');
    };
    
    const handleUpdateUserRole = async () => {
        try {
            await fetchApi(`/api/admin/users/${selectedUser.user_id}/role`, {
                method: 'PUT',
                body: JSON.stringify({ role: userRoleForm })
            });
            handleCloseUserDialog();
            fetchUsers();
        } catch (error) {
            console.error('Error updating user role:', error);
            setError('Failed to update user role');
        }
    };
    
    // Review moderation functions
    const handleReviewAction = async (reviewId, action) => {
        try {
            await fetchApi(`/api/admin/reviews/${reviewId}/moderate`, {
                method: 'PUT',
                body: JSON.stringify({ status: action })
            });
            fetchPendingReviews();
        } catch (error) {
            console.error('Error moderating review:', error);
            setError('Failed to moderate review');
        }
    };
    
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
    const renderDashboardTab = () => {
        return (
            <Box>
                <Typography variant="h5" sx={{ mb: 3 }}>Admin Dashboard Overview</Typography>
                
                {loading ? (
                    <CircularProgress />
                ) : (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography color="text.secondary" gutterBottom>
                                        Total Users
                                    </Typography>
                                    <Typography variant="h3">
                                        {stats.totalUsers || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography color="text.secondary" gutterBottom>
                                        Total Events
                                    </Typography>
                                    <Typography variant="h3">
                                        {stats.totalEvents || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography color="text.secondary" gutterBottom>
                                        Total Reviews
                                    </Typography>
                                    <Typography variant="h3">
                                        {stats.totalReviews || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        
                        <Grid item xs={12}>
                            <Paper sx={{ p: 2, mt: 3 }}>
                                <Typography variant="h6" gutterBottom>Recent Activities</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    This panel will display recent administrative actions and system events.
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                )}
            </Box>
        );
    };
    
    const renderUsersTab = () => {
        return (
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h5">User Management</Typography>
                    <Button 
                        startIcon={<Refresh />} 
                        onClick={fetchUsers}
                        disabled={loading}
                    >
                        Refresh
                    </Button>
                </Box>
                
                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                
                {loading ? (
                    <CircularProgress />
                ) : (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Username</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Role</TableCell>
                                    <TableCell>Created</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {users.map(user => (
                                    <TableRow key={user.user_id}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Avatar sx={{ mr: 1, width: 30, height: 30 }}>
                                                    {user.username.charAt(0).toUpperCase()}
                                                </Avatar>
                                                {user.username}
                                            </Box>
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={user.role || 'user'} 
                                                color={user.role === 'admin' ? 'primary' : 'default'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{formatDate(user.created_at)}</TableCell>
                                        <TableCell>
                                            <IconButton 
                                                color="primary" 
                                                onClick={() => handleOpenUserDialog(user)}
                                                size="small"
                                            >
                                                <Edit fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
                
                {/* User role dialog */}
                <Dialog open={userDialogOpen} onClose={handleCloseUserDialog}>
                    <DialogTitle>Edit User Role</DialogTitle>
                    <DialogContent>
                        {selectedUser && (
                            <>
                                <Typography variant="subtitle1">
                                    User: {selectedUser.username}
                                </Typography>
                                <TextField
                                    select
                                    label="Role"
                                    value={userRoleForm}
                                    onChange={(e) => setUserRoleForm(e.target.value)}
                                    fullWidth
                                    margin="normal"
                                    SelectProps={{
                                        native: true,
                                    }}
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </TextField>
                            </>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseUserDialog}>Cancel</Button>
                        <Button onClick={handleUpdateUserRole} color="primary">
                            Save
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        );
    };
    
    const renderCategoriesTab = () => {
        return (
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h5">Categories Management</Typography>
                    <Button 
                        variant="contained" 
                        startIcon={<Add />}
                        onClick={() => handleOpenCategoryDialog()}
                    >
                        Add Category
                    </Button>
                </Box>
                
                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                
                {loading ? (
                    <CircularProgress />
                ) : (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Description</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {categories.map(category => (
                                    <TableRow key={category.category_id}>
                                        <TableCell>{category.category_name}</TableCell>
                                        <TableCell>{category.description || '—'}</TableCell>
                                        <TableCell>
                                            <IconButton 
                                                color="primary" 
                                                onClick={() => handleOpenCategoryDialog(category)}
                                                size="small"
                                            >
                                                <Edit fontSize="small" />
                                            </IconButton>
                                            <IconButton 
                                                color="error" 
                                                onClick={() => handleDeleteCategory(category.category_id)}
                                                size="small"
                                            >
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
                
                {/* Category dialog */}
                <Dialog open={categoryDialogOpen} onClose={handleCloseCategoryDialog}>
                    <DialogTitle>
                        {editingCategoryId ? 'Edit Category' : 'Add New Category'}
                    </DialogTitle>
                    <DialogContent>
                        <TextField
                            name="name"
                            label="Category Name"
                            value={categoryForm.name}
                            onChange={handleCategoryFormChange}
                            fullWidth
                            margin="normal"
                            required
                        />
                        <TextField
                            name="description"
                            label="Description"
                            value={categoryForm.description}
                            onChange={handleCategoryFormChange}
                            fullWidth
                            margin="normal"
                            multiline
                            rows={3}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseCategoryDialog}>Cancel</Button>
                        <Button onClick={handleSaveCategory} color="primary">
                            {editingCategoryId ? 'Update' : 'Create'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        );
    };
    
    const renderReviewsTab = () => {
        return (
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h5">Review Moderation</Typography>
                    <Button 
                        startIcon={<Refresh />} 
                        onClick={fetchPendingReviews}
                        disabled={loading}
                    >
                        Refresh
                    </Button>
                </Box>
                
                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                
                {loading ? (
                    <CircularProgress />
                ) : pendingReviews.length === 0 ? (
                    <Alert severity="info">
                        No reviews pending moderation.
                    </Alert>
                ) : (
                    <List>
                        {pendingReviews.map(review => (
                            <Paper key={review.review_id} sx={{ mb: 2, p: 2 }}>
                                <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                                    <ListItemAvatar>
                                        <Avatar>
                                            {review.username?.charAt(0).toUpperCase() || 'U'}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Typography variant="subtitle1">
                                                {review.username} — reviewed {review.event_name}
                                            </Typography>
                                        }
                                        secondary={
                                            <>
                                                <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
                                                    {[...Array(5)].map((_, i) => (
                                                        <span key={i} style={{ color: i < review.rating ? 'gold' : 'gray' }}>★</span>
                                                    ))}
                                                    <Typography variant="body2" sx={{ ml: 1 }}>
                                                        {formatDate(review.created_at)}
                                                    </Typography>
                                                </Box>
                                                <Typography
                                                    variant="body2"
                                                    color="text.primary"
                                                    sx={{ mt: 1 }}
                                                >
                                                    {review.review_text}
                                                </Typography>
                                            </>
                                        }
                                    />
                                </ListItem>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                    <Button
                                        startIcon={<Cancel />}
                                        color="error"
                                        variant="outlined"
                                        size="small"
                                        sx={{ mr: 1 }}
                                        onClick={() => handleReviewAction(review.review_id, 'rejected')}
                                    >
                                        Reject
                                    </Button>
                                    <Button
                                        startIcon={<CheckCircle />}
                                        color="success"
                                        variant="contained"
                                        size="small"
                                        onClick={() => handleReviewAction(review.review_id, 'approved')}
                                    >
                                        Approve
                                    </Button>
                                </Box>
                            </Paper>
                        ))}
                    </List>
                )}
            </Box>
        );
    };
    
    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Admin Control Panel
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Manage users, categories, and content moderation
                </Typography>
            </Box>
            
            <Box sx={{ mb: 3 }}>
                <Tabs value={activeTab} onChange={handleTabChange}>
                    <Tab icon={<AdminPanelSettings />} label="Dashboard" />
                    <Tab icon={<PeopleAlt />} label="Users" />
                    <Tab icon={<Category />} label="Categories" />
                    <Tab icon={<Comment />} label="Reviews" />
                </Tabs>
            </Box>
            
            <Box sx={{ py: 2 }}>
                {activeTab === 0 && renderDashboardTab()}
                {activeTab === 1 && renderUsersTab()}
                {activeTab === 2 && renderCategoriesTab()}
                {activeTab === 3 && renderReviewsTab()}
            </Box>
        </Box>
    );
}

export default AdminDashboard;