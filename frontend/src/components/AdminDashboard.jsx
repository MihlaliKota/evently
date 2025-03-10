import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, Paper, Card, CardContent,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
    Button, IconButton, Tabs, Tab, TextField, InputAdornment, Chip, Avatar,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
    Drawer, List, ListItem, ListItemText, Divider, CircularProgress, Alert, Stack,
    FormControl, InputLabel, Select, MenuItem, Tooltip
} from '@mui/material';
import {
    AdminPanelSettings, PeopleAlt, Category, Comment, Add, Search,
    CheckCircle, Cancel, Delete, Edit, Refresh, FilterList, ViewList,
    MoreVert, Event, Star, Person, CalendarMonth, Info, Check, Close
} from '@mui/icons-material';
import { fetchApi } from '../utils/api';

function AdminDashboard() {
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Data states
    const [users, setUsers] = useState([]);
    const [events, setEvents] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalEvents: 0,
        totalReviews: 0
    });
    
    // Pagination states
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    
    // Filtering states
    const [searchTerm, setSearchTerm] = useState('');
    const [filterOpen, setFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        userRole: 'all',
        eventCategory: 'all',
        reviewRating: 'all'
    });
    
    // Detail dialog states
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [detailType, setDetailType] = useState('');
    
    useEffect(() => {
        if (activeTab === 0) {
            fetchAdminStats();
        } else if (activeTab === 1) {
            fetchUsers();
        } else if (activeTab === 2) {
            fetchEvents();
        } else if (activeTab === 3) {
            fetchReviews();
        }
    }, [activeTab]);
    
    const fetchAdminStats = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch admin stats: ${response.status}`);
            }
            
            const data = await response.json();
            setStats(data);
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
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch users: ${response.status}`);
            }
            
            const data = await response.json();
            setUsers(data);
            setError(null);
        } catch (error) {
            console.error('Error fetching users:', error);
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };
    
    const fetchEvents = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/events`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch events: ${response.status}`);
            }
            
            const data = await response.json();
            setEvents(data);
            setError(null);
        } catch (error) {
            console.error('Error fetching events:', error);
            setError('Failed to load events');
        } finally {
            setLoading(false);
        }
    };
    
    const fetchReviews = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/reviews`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch reviews: ${response.status}`);
            }
            
            const data = await response.json();
            setReviews(data);
            setError(null);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            setError('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };
    
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
        setPage(0);
        setSearchTerm('');
        setFilters({
            userRole: 'all',
            eventCategory: 'all',
            reviewRating: 'all'
        });
    };
    
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };
    
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };
    
    const handleFilterChange = (event) => {
        const { name, value } = event.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
        setPage(0);
    };
    
    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        setPage(0);
    };
    
    const handleRefresh = () => {
        if (activeTab === 0) {
            fetchAdminStats();
        } else if (activeTab === 1) {
            fetchUsers();
        } else if (activeTab === 2) {
            fetchEvents();
        } else if (activeTab === 3) {
            fetchReviews();
        }
    };
    
    const handleOpenDetails = (item, type) => {
        setSelectedItem(item);
        setDetailType(type);
        setDetailDialogOpen(true);
    };
    
    const handleCloseDetails = () => {
        setDetailDialogOpen(false);
        setSelectedItem(null);
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
    
    // Filter and search functions
    const getFilteredData = (dataType) => {
        let filteredData = [];
        
        if (dataType === 'users') {
            filteredData = users.filter(user => {
                const matchesSearch = 
                    searchTerm === '' || 
                    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
                
                const matchesFilter = 
                    filters.userRole === 'all' || 
                    user.role === filters.userRole;
                
                return matchesSearch && matchesFilter;
            });
        } else if (dataType === 'events') {
            filteredData = events.filter(event => {
                const matchesSearch = 
                    searchTerm === '' || 
                    event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase()));
                
                // If we had category_id or category_name available in the event object
                const matchesFilter = 
                    filters.eventCategory === 'all' || 
                    (event.category_id && event.category_id.toString() === filters.eventCategory);
                
                return matchesSearch && matchesFilter;
            });
        } else if (dataType === 'reviews') {
            filteredData = reviews.filter(review => {
                const matchesSearch = 
                    searchTerm === '' || 
                    (review.username && review.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (review.review_text && review.review_text.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (review.event_name && review.event_name.toLowerCase().includes(searchTerm.toLowerCase()));
                
                const matchesFilter = 
                    filters.reviewRating === 'all' || 
                    (review.rating && review.rating.toString() === filters.reviewRating);
                
                return matchesSearch && matchesFilter;
            });
        }
        
        return filteredData;
    };
    
    // Pagination helpers
    const getPaginatedData = (dataType) => {
        const filteredData = getFilteredData(dataType);
        return filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    };
    
    // Component for dashboard tab
    const renderDashboardTab = () => {
        return (
            <Box>
                <Typography variant="h5" sx={{ mb: 3 }}>Admin Dashboard Overview</Typography>
                
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <Person sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                                            <Box>
                                                <Typography color="text.secondary" gutterBottom>
                                                    Total Users
                                                </Typography>
                                                <Typography variant="h3">
                                                    {stats.totalUsers || 0}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Button 
                                            variant="outlined" 
                                            fullWidth
                                            onClick={() => setActiveTab(1)}
                                        >
                                            View Users
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                            
                            <Grid item xs={12} md={4}>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <Event sx={{ fontSize: 40, color: 'secondary.main', mr: 2 }} />
                                            <Box>
                                                <Typography color="text.secondary" gutterBottom>
                                                    Total Events
                                                </Typography>
                                                <Typography variant="h3">
                                                    {stats.totalEvents || 0}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Button 
                                            variant="outlined" 
                                            fullWidth
                                            onClick={() => setActiveTab(2)}
                                        >
                                            View Events
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                            
                            <Grid item xs={12} md={4}>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <Comment sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                                            <Box>
                                                <Typography color="text.secondary" gutterBottom>
                                                    Total Reviews
                                                </Typography>
                                                <Typography variant="h3">
                                                    {stats.totalReviews || 0}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Button 
                                            variant="outlined" 
                                            fullWidth
                                            onClick={() => setActiveTab(3)}
                                        >
                                            View Reviews
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                        
                        <Box sx={{ mt: 4 }}>
                            <Typography variant="h6" gutterBottom>Quick Actions</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Button 
                                        variant="contained" 
                                        color="primary" 
                                        fullWidth
                                        startIcon={<Add />}
                                        onClick={() => {
                                            window.dispatchEvent(new CustomEvent('navigate', {
                                                detail: 'events'
                                            }));
                                        }}
                                    >
                                        Create Event
                                    </Button>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Button 
                                        variant="contained" 
                                        color="secondary" 
                                        fullWidth
                                        startIcon={<Category />}
                                    >
                                        Manage Categories
                                    </Button>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Button 
                                        variant="contained" 
                                        color="info" 
                                        fullWidth
                                        startIcon={<Comment />}
                                    >
                                        Moderate Reviews
                                    </Button>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Button 
                                        variant="contained" 
                                        color="warning" 
                                        fullWidth
                                        startIcon={<Refresh />}
                                        onClick={handleRefresh}
                                    >
                                        Refresh Stats
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>
                    </>
                )}
            </Box>
        );
    };
    
    // Component for users tab
    const renderUsersTab = () => {
        const filteredUsers = getFilteredData('users');
        const paginatedUsers = getPaginatedData('users');
        
        return (
            <Box>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h5">User Management</Typography>
                    <Typography variant="body2" color="text.secondary">
                        View and manage all registered users in the system
                    </Typography>
                </Box>
                
                <Paper sx={{ mb: 3, p: 2 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                        <TextField
                            label="Search Users"
                            variant="outlined"
                            size="small"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            sx={{ flexGrow: 1, minWidth: '200px' }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search />
                                    </InputAdornment>
                                ),
                            }}
                            placeholder="Search by username or email"
                        />
                        
                        <FormControl sx={{ minWidth: '150px' }} size="small">
                            <InputLabel id="user-role-filter-label">Role</InputLabel>
                            <Select
                                labelId="user-role-filter-label"
                                id="user-role-filter"
                                value={filters.userRole}
                                label="Role"
                                name="userRole"
                                onChange={handleFilterChange}
                            >
                                <MenuItem value="all">All Roles</MenuItem>
                                <MenuItem value="admin">Admin</MenuItem>
                                <MenuItem value="user">User</MenuItem>
                            </Select>
                        </FormControl>
                        
                        <Button 
                            variant="outlined" 
                            startIcon={<Refresh />}
                            onClick={handleRefresh}
                        >
                            Refresh
                        </Button>
                    </Box>
                </Paper>
                
                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Paper>
                        <TableContainer>
                            <Table aria-label="users table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>User</TableCell>
                                        <TableCell>Email</TableCell>
                                        <TableCell>Role</TableCell>
                                        <TableCell>Member Since</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedUsers.map((user) => (
                                        <TableRow key={user.user_id} hover>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                                                        {user.username.charAt(0).toUpperCase()}
                                                    </Avatar>
                                                    <Typography variant="body1">
                                                        {user.username}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>{user.email || 'Not provided'}</TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={user.role || 'user'} 
                                                    color={user.role === 'admin' ? 'primary' : 'default'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>{formatDate(user.created_at)}</TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="View Details">
                                                    <IconButton 
                                                        color="info" 
                                                        size="small"
                                                        onClick={() => handleOpenDetails(user, 'user')}
                                                    >
                                                        <Info fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Edit Role">
                                                    <IconButton 
                                                        color="primary" 
                                                        size="small"
                                                    >
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    
                                    {paginatedUsers.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                                <Typography variant="body1" color="text.secondary">
                                                    No users found matching your criteria
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25]}
                            component="div"
                            count={filteredUsers.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    </Paper>
                )}
            </Box>
        );
    };
    
    // Component for events tab
    const renderEventsTab = () => {
        const filteredEvents = getFilteredData('events');
        const paginatedEvents = getPaginatedData('events');
        
        return (
            <Box>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h5">Events Management</Typography>
                    <Typography variant="body2" color="text.secondary">
                        View and manage all events in the system
                    </Typography>
                </Box>
                
                <Paper sx={{ mb: 3, p: 2 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                        <TextField
                            label="Search Events"
                            variant="outlined"
                            size="small"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            sx={{ flexGrow: 1, minWidth: '200px' }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search />
                                    </InputAdornment>
                                ),
                            }}
                            placeholder="Search by name or location"
                        />
                        
                        <FormControl sx={{ minWidth: '180px' }} size="small">
                            <InputLabel id="event-category-filter-label">Category</InputLabel>
                            <Select
                                labelId="event-category-filter-label"
                                id="event-category-filter"
                                value={filters.eventCategory}
                                label="Category"
                                name="eventCategory"
                                onChange={handleFilterChange}
                            >
                                <MenuItem value="all">All Categories</MenuItem>
                                <MenuItem value="1">Category 1</MenuItem>
                                <MenuItem value="2">Category 2</MenuItem>
                                <MenuItem value="3">Category 3</MenuItem>
                            </Select>
                        </FormControl>
                        
                        <Button 
                            variant="contained" 
                            color="primary"
                            startIcon={<Add />}
                            onClick={() => {
                                window.dispatchEvent(new CustomEvent('navigate', {
                                    detail: 'events'
                                }));
                            }}
                        >
                            Create Event
                        </Button>
                        
                        <Button 
                            variant="outlined" 
                            startIcon={<Refresh />}
                            onClick={handleRefresh}
                        >
                            Refresh
                        </Button>
                    </Box>
                </Paper>
                
                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Paper>
                        <TableContainer>
                            <Table aria-label="events table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Event Name</TableCell>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Location</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedEvents.map((event) => {
                                        const eventDate = new Date(event.event_date);
                                        const isPast = eventDate < new Date();
                                        
                                        return (
                                            <TableRow key={event.event_id} hover>
                                                <TableCell>
                                                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                                        {event.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        ID: {event.event_id}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <CalendarMonth fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                                        {formatDate(event.event_date)}
                                                    </Box>
                                                </TableCell>
                                                <TableCell>{event.location || 'No location'}</TableCell>
                                                <TableCell>
                                                    <Chip 
                                                        label={isPast ? 'Past' : 'Upcoming'} 
                                                        color={isPast ? 'default' : 'success'}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Tooltip title="View Details">
                                                        <IconButton 
                                                            color="info" 
                                                            size="small"
                                                            onClick={() => handleOpenDetails(event, 'event')}
                                                        >
                                                            <Info fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Edit Event">
                                                        <IconButton 
                                                            color="primary" 
                                                            size="small"
                                                        >
                                                            <Edit fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete Event">
                                                        <IconButton 
                                                            color="error" 
                                                            size="small"
                                                        >
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    
                                    {paginatedEvents.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                                <Typography variant="body1" color="text.secondary">
                                                    No events found matching your criteria
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25]}
                            component="div"
                            count={filteredEvents.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    </Paper>
                )}
            </Box>
        );
    };
    
    // Component for reviews tab
    const renderReviewsTab = () => {
        const filteredReviews = getFilteredData('reviews');
        const paginatedReviews = getPaginatedData('reviews');
        
        return (
            <Box>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h5">Reviews Management</Typography>
                    <Typography variant="body2" color="text.secondary">
                        View and moderate user reviews
                    </Typography>
                </Box>
                
                <Paper sx={{ mb: 3, p: 2 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                        <TextField
                            label="Search Reviews"
                            variant="outlined"
                            size="small"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            sx={{ flexGrow: 1, minWidth: '200px' }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search />
                                    </InputAdornment>
                                ),
                            }}
                            placeholder="Search by user, event or review content"
                        />
                        
                        <FormControl sx={{ minWidth: '150px' }} size="small">
                            <InputLabel id="review-rating-filter-label">Rating</InputLabel>
                            <Select
                                labelId="review-rating-filter-label"
                                id="review-rating-filter"
                                value={filters.reviewRating}
                                label="Rating"
                                name="reviewRating"
                                onChange={handleFilterChange}
                            >
                                <MenuItem value="all">All Ratings</MenuItem>
                                <MenuItem value="5">5 Stars</MenuItem>
                                <MenuItem value="4">4 Stars</MenuItem>
                                <MenuItem value="3">3 Stars</MenuItem>
                                <MenuItem value="2">2 Stars</MenuItem>
                                <MenuItem value="1">1 Star</MenuItem>
                            </Select>
                        </FormControl>
                        
                        <Button 
                            variant="outlined" 
                            startIcon={<Refresh />}
                            onClick={handleRefresh}
                        >
                            Refresh
                        </Button>
                    </Box>
                </Paper>
                
                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Paper>
                        <TableContainer>
                            <Table aria-label="reviews table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>User</TableCell>
                                        <TableCell>Event</TableCell>
                                        <TableCell>Rating</TableCell>
                                        <TableCell>Review</TableCell>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedReviews.map((review) => (
                                        <TableRow key={review.review_id} hover>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Avatar sx={{ width: 30, height: 30, mr: 1, bgcolor: 'primary.light' }}>
                                                        {review.username?.charAt(0).toUpperCase() || 'U'}
                                                    </Avatar>
                                                    {review.username || 'Anonymous'}
                                                </Box>
                                            </TableCell>
                                            <TableCell>{review.event_name || `Event #${review.event_id}`}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star 
                                                            key={i} 
                                                            fontSize="small"
                                                            sx={{ 
                                                                color: i < review.rating ? 'gold' : 'text.disabled'
                                                            }}
                                                        />
                                                    ))}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography
                                                    sx={{
                                                        maxWidth: 250,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {review.review_text || 'No text content'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{formatDate(review.created_at)}</TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={review.moderation_status || 'pending'} 
                                                    color={
                                                        review.moderation_status === 'approved' ? 'success' : 
                                                        review.moderation_status === 'rejected' ? 'error' : 
                                                        'warning'
                                                    }
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="View Details">
                                                    <IconButton 
                                                        color="info" 
                                                        size="small"
                                                        onClick={() => handleOpenDetails(review, 'review')}
                                                    >
                                                        <Info fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Approve">
                                                    <IconButton 
                                                        color="success" 
                                                        size="small"
                                                        disabled={review.moderation_status === 'approved'}
                                                    >
                                                        <Check fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Reject">
                                                    <IconButton 
                                                        color="error" 
                                                        size="small"
                                                        disabled={review.moderation_status === 'rejected'}
                                                    >
                                                        <Close fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    
                                    {paginatedReviews.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                                <Typography variant="body1" color="text.secondary">
                                                    No reviews found matching your criteria
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25]}
                            component="div"
                            count={filteredReviews.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    </Paper>
                )}
            </Box>
        );
    };
    
    // Detail dialog content
    const renderDetailDialogContent = () => {
        if (!selectedItem) return null;
        
        if (detailType === 'user') {
            return (
                <>
                    <DialogTitle>User Details</DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <Avatar sx={{ width: 60, height: 60, mr: 2, bgcolor: 'primary.main' }}>
                                {selectedItem.username.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                                <Typography variant="h6">{selectedItem.username}</Typography>
                                <Chip 
                                    label={selectedItem.role || 'user'} 
                                    color={selectedItem.role === 'admin' ? 'primary' : 'default'}
                                    size="small"
                                    sx={{ mt: 0.5 }}
                                />
                            </Box>
                        </Box>
                        
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary">
                                    Email
                                </Typography>
                                <Typography variant="body1">
                                    {selectedItem.email || 'Not provided'}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary">
                                    Member Since
                                </Typography>
                                <Typography variant="body1">
                                    {formatDate(selectedItem.created_at)}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body2" color="text.secondary">
                                    Bio
                                </Typography>
                                <Typography variant="body1">
                                    {selectedItem.bio || 'No bio provided'}
                                </Typography>
                            </Grid>
                        </Grid>
                        
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="h6" gutterBottom>User Activity</Typography>
                            <Alert severity="info">
                                Activity statistics would be displayed here (events created, reviews submitted, etc.)
                            </Alert>
                        </Box>
                    </DialogContent>
                </>
            );
        } else if (detailType === 'event') {
            return (
                <>
                    <DialogTitle>Event Details</DialogTitle>
                    <DialogContent>
                        <Typography variant="h5" gutterBottom>{selectedItem.name}</Typography>
                        
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary">
                                    Date & Time
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <CalendarMonth fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                    <Typography variant="body1">
                                        {formatDate(selectedItem.event_date)}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary">
                                    Location
                                </Typography>
                                <Typography variant="body1">
                                    {selectedItem.location || 'No location specified'}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body2" color="text.secondary">
                                    Description
                                </Typography>
                                <Typography variant="body1">
                                    {selectedItem.description || 'No description provided'}
                                </Typography>
                            </Grid>
                        </Grid>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Typography variant="h6" gutterBottom>Event Statistics</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6} sm={3}>
                                <Paper sx={{ p: 2, textAlign: 'center' }} elevation={1}>
                                    <Typography variant="h4" color="primary.main">
                                        {selectedItem.attendees || 0}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Attendees
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Paper sx={{ p: 2, textAlign: 'center' }} elevation={1}>
                                    <Typography variant="h4" color="secondary.main">
                                        {selectedItem.review_count || 0}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Reviews
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Paper sx={{ p: 2, textAlign: 'center' }} elevation={1}>
                                    <Typography variant="h4" color="warning.main">
                                        {selectedItem.avg_rating ? selectedItem.avg_rating.toFixed(1) : '0.0'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Avg. Rating
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Paper sx={{ p: 2, textAlign: 'center' }} elevation={1}>
                                    <Typography variant="h4" color="success.main">
                                        {selectedItem.views || 0}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Views
                                    </Typography>
                                </Paper>
                            </Grid>
                        </Grid>
                    </DialogContent>
                </>
            );
        } else if (detailType === 'review') {
            return (
                <>
                    <DialogTitle>Review Details</DialogTitle>
                    <DialogContent>
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h6">
                                Review for: {selectedItem.event_name || `Event #${selectedItem.event_id}`}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                <Avatar sx={{ width: 30, height: 30, mr: 1, bgcolor: 'primary.light' }}>
                                    {selectedItem.username?.charAt(0).toUpperCase() || 'U'}
                                </Avatar>
                                <Typography variant="body1">
                                    {selectedItem.username || 'Anonymous'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                    {formatDate(selectedItem.created_at)}
                                </Typography>
                            </Box>
                        </Box>
                        
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="body2" color="text.secondary">
                                Rating
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {[...Array(5)].map((_, i) => (
                                    <Star 
                                        key={i} 
                                        fontSize="large"
                                        sx={{ 
                                            color: i < selectedItem.rating ? 'gold' : 'text.disabled'
                                        }}
                                    />
                                ))}
                                <Typography variant="h6" sx={{ ml: 1 }}>
                                    {selectedItem.rating}/5
                                </Typography>
                            </Box>
                        </Box>
                        
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="body2" color="text.secondary">
                                Review Content
                            </Typography>
                            <Paper sx={{ p: 2, bgcolor: 'background.default' }} elevation={1}>
                                <Typography variant="body1">
                                    {selectedItem.review_text || 'No text content provided'}
                                </Typography>
                            </Paper>
                        </Box>
                        
                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                Moderation Status
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                <Chip 
                                    label={selectedItem.moderation_status || 'pending'} 
                                    color={
                                        selectedItem.moderation_status === 'approved' ? 'success' : 
                                        selectedItem.moderation_status === 'rejected' ? 'error' : 
                                        'warning'
                                    }
                                />
                            </Box>
                        </Box>
                    </DialogContent>
                </>
            );
        }
        
        return null;
    };
    
    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Admin Control Panel
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Manage users, events, and content moderation
                </Typography>
            </Box>
            
            <Box sx={{ mb: 3 }}>
                <Tabs 
                    value={activeTab} 
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab icon={<AdminPanelSettings />} label="Dashboard" />
                    <Tab icon={<PeopleAlt />} label="Users" />
                    <Tab icon={<Event />} label="Events" />
                    <Tab icon={<Comment />} label="Reviews" />
                </Tabs>
            </Box>
            
            <Box sx={{ py: 2 }}>
                {activeTab === 0 && renderDashboardTab()}
                {activeTab === 1 && renderUsersTab()}
                {activeTab === 2 && renderEventsTab()}
                {activeTab === 3 && renderReviewsTab()}
            </Box>
            
            {/* Detail Dialog */}
            <Dialog
                open={detailDialogOpen}
                onClose={handleCloseDetails}
                maxWidth="md"
                fullWidth
            >
                {renderDetailDialogContent()}
                <DialogActions>
                    <Button onClick={handleCloseDetails}>Close</Button>
                    {detailType === 'user' && (
                        <Button 
                            variant="contained" 
                            color="primary"
                        >
                            Edit User
                        </Button>
                    )}
                    {detailType === 'event' && (
                        <Button 
                            variant="contained" 
                            color="primary"
                        >
                            Edit Event
                        </Button>
                    )}
                    {detailType === 'review' && (
                        <>
                            <Button 
                                variant="contained" 
                                color="error"
                                disabled={selectedItem?.moderation_status === 'rejected'}
                            >
                                Reject
                            </Button>
                            <Button 
                                variant="contained" 
                                color="success"
                                disabled={selectedItem?.moderation_status === 'approved'}
                            >
                                Approve
                            </Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default AdminDashboard;