// EventsManagement.jsx - Component for administrators to manage events
import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, Divider, CircularProgress, TextField,
    Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, Tooltip, FormControl, InputLabel, Select, MenuItem,
    Alert, Grid, Snackbar, Pagination, Toolbar
} from '@mui/material';
import {
    Add, Edit, Delete, Visibility, Event, LocationOn, Category,
    CalendarToday, Person, EventAvailable, FilterList, Search, Refresh,
    Close, Save
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';

const EventsManagement = () => {
    const [events, setEvents] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [eventForm, setEventForm] = useState({
        event_id: null,
        name: '',
        description: '',
        location: '',
        event_date: new Date(),
        category_id: '',
        attendees: 0
    });
    const [formErrors, setFormErrors] = useState({});
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        category_id: '',
        sortBy: 'event_date',
        sortOrder: 'desc',
        showPastEvents: false
    });
    const [showFilters, setShowFilters] = useState(false);

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

    // Fetch events and categories
    useEffect(() => {
        const fetchData = async () => {
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
                
                // Build query params for events
                const params = new URLSearchParams();
                params.append('page', page);
                params.append('limit', 10);
                
                if (filters.category_id) {
                    params.append('category_id', filters.category_id);
                }
                
                if (searchTerm) {
                    params.append('search', searchTerm);
                }
                
                params.append('sort_by', filters.sortBy);
                params.append('sort_order', filters.sortOrder);
                
                if (!filters.showPastEvents) {
                    // Only show future events
                    params.append('future_only', 'true');
                }

                // Fetch events
                const eventsResponse = await fetch(`http://localhost:5000/api/events?${params.toString()}`, { headers });
                if (!eventsResponse.ok) {
                    throw new Error(`Failed to fetch events: ${eventsResponse.status}`);
                }
                
                const eventsData = await eventsResponse.json();
                setEvents(eventsData);
                
                // Get pagination info from headers
                const totalPages = parseInt(eventsResponse.headers.get('X-Total-Pages') || '1');
                setTotalPages(totalPages);
                
                // Fetch categories
                const categoriesResponse = await fetch('http://localhost:5000/api/categories', { headers });
                if (categoriesResponse.ok) {
                    const categoriesData = await categoriesResponse.json();
                    setCategories(categoriesData);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                setError(error.message);
                
                // Set some mock data for development
                setEvents([
                    {
                        event_id: 1,
                        name: 'Tech Conference 2024',
                        description: 'Annual tech conference with speakers from leading tech companies.',
                        location: 'New York Convention Center',
                        event_date: new Date().toISOString(),
                        category_id: 1,
                        category_name: 'Technology',
                        attendees: 250
                    },
                    {
                        event_id: 2,
                        name: 'Music Festival',
                        description: 'Annual music festival featuring local and international artists.',
                        location: 'Central Park',
                        event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                        category_id: 2,
                        category_name: 'Music',
                        attendees: 1500
                    }
                ]);
                
                setCategories([
                    { category_id: 1, category_name: 'Technology' },
                    { category_id: 2, category_name: 'Music' },
                    { category_id: 3, category_name: 'Food & Drink' },
                    { category_id: 4, category_name: 'Arts & Culture' }
                ]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [page, filters, searchTerm]);

    // Create or update an event
    const handleSaveEvent = async () => {
        // Validate form
        const errors = {};
        if (!eventForm.name) errors.name = 'Event name is required';
        if (!eventForm.location) errors.location = 'Location is required';
        if (!eventForm.event_date) errors.event_date = 'Date is required';
        if (!eventForm.category_id) errors.category_id = 'Category is required';
        
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
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
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
            
            const isNewEvent = !eventForm.event_id;
            const url = isNewEvent 
                ? 'http://localhost:5000/api/events' 
                : `http://localhost:5000/api/events/${eventForm.event_id}`;
            
            const method = isNewEvent ? 'POST' : 'PUT';
            
            const response = await fetch(url, {
                method,
                headers,
                body: JSON.stringify(eventForm)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to ${isNewEvent ? 'create' : 'update'} event`);
            }
            
            const savedEvent = await response.json();
            
            // Update events list
            if (isNewEvent) {
                setEvents([savedEvent, ...events]);
            } else {
                setEvents(events.map(event => 
                    event.event_id === savedEvent.event_id ? savedEvent : event
                ));
            }
            
            setSuccess(`Event ${isNewEvent ? 'created' : 'updated'} successfully!`);
            setDialogOpen(false);
            
            // Reset form
            setEventForm({
                event_id: null,
                name: '',
                description: '',
                location: '',
                event_date: new Date(),
                category_id: '',
                attendees: 0
            });
            
            // Clear form errors
            setFormErrors({});
        } catch (error) {
            console.error('Error saving event:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Delete an event
    const handleDeleteEvent = async () => {
        if (!selectedEvent) return;
        
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

            const response = await fetch(`http://localhost:5000/api/events/${selectedEvent.event_id}`, {
                method: 'DELETE',
                headers
            });
            
            if (!response.ok) {
                throw new Error(`Failed to delete event: ${response.status}`);
            }
            
            // Remove event from list
            setEvents(events.filter(event => event.event_id !== selectedEvent.event_id));
            setSuccess(`Event "${selectedEvent.name}" deleted successfully!`);
            setDeleteConfirmOpen(false);
            setSelectedEvent(null);
        } catch (error) {
            console.error('Error deleting event:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle opening the edit dialog
    const handleEditEvent = (event) => {
        setEventForm({
            event_id: event.event_id,
            name: event.name,
            description: event.description || '',
            location: event.location || '',
            event_date: new Date(event.event_date),
            category_id: event.category_id || '',
            attendees: event.attendees || 0
        });
        setDialogOpen(true);
    };

    // Handle opening the delete confirmation dialog
    const handleDeleteConfirm = (event) => {
        setSelectedEvent(event);
        setDeleteConfirmOpen(true);
    };

    // Handle form input changes
    const handleFormChange = (field, value) => {
        setEventForm({
            ...eventForm,
            [field]: value
        });
        
        // Clear error for this field
        if (formErrors[field]) {
            setFormErrors({
                ...formErrors,
                [field]: null
            });
        }
    };

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

    // Handle search
    const handleSearch = (e) => {
        e.preventDefault();
        // Reset to first page when searching
        setPage(1);
    };

    // Check if an event date is in the past
    const isEventPast = (dateString) => {
        const eventDate = new Date(dateString);
        return eventDate < new Date();
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" component="h2" gutterBottom>
                    Events Management
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Create, edit, and delete events
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
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => {
                            setEventForm({
                                event_id: null,
                                name: '',
                                description: '',
                                location: '',
                                event_date: new Date(),
                                category_id: '',
                                attendees: 0
                            });
                            setFormErrors({});
                            setDialogOpen(true);
                        }}
                    >
                        Create Event
                    </Button>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <form onSubmit={handleSearch}>
                            <TextField
                                size="small"
                                placeholder="Search events..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    endAdornment: (
                                        <IconButton type="submit" size="small">
                                            <Search />
                                        </IconButton>
                                    )
                                }}
                            />
                        </form>
                        
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
                                setSearchTerm('');
                                setFilters({
                                    category_id: '',
                                    sortBy: 'event_date',
                                    sortOrder: 'desc',
                                    showPastEvents: false
                                });
                            }}
                        >
                            Reset
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
                                <InputLabel id="category-filter-label">Category</InputLabel>
                                <Select
                                    labelId="category-filter-label"
                                    value={filters.category_id}
                                    label="Category"
                                    onChange={(e) => handleFilterChange('category_id', e.target.value)}
                                >
                                    <MenuItem value="">All Categories</MenuItem>
                                    {categories.map((category) => (
                                        <MenuItem key={category.category_id} value={category.category_id}>
                                            {category.category_name}
                                        </MenuItem>
                                    ))}
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
                                    <MenuItem value="event_date">Event Date</MenuItem>
                                    <MenuItem value="name">Event Name</MenuItem>
                                    <MenuItem value="attendees">Attendees</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel id="sort-order-label">Sort Order</InputLabel>
                                <Select
                                    labelId="sort-order-label"
                                    value={filters.sortOrder}
                                    label="Sort Order"
                                    onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                                >
                                    <MenuItem value="asc">Ascending</MenuItem>
                                    <MenuItem value="desc">Descending</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth>
                                <Button
                                    variant={filters.showPastEvents ? "contained" : "outlined"}
                                    color={filters.showPastEvents ? "primary" : "inherit"}
                                    onClick={() => handleFilterChange('showPastEvents', !filters.showPastEvents)}
                                    startIcon={<Event />}
                                >
                                    {filters.showPastEvents ? "Showing Past Events" : "Hide Past Events"}
                                </Button>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Paper>
            )}
            
            {/* Events table */}
            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <TableContainer sx={{ maxHeight: 600 }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>Event Name</TableCell>
                                <TableCell>Category</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Location</TableCell>
                                <TableCell>Attendees</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        <CircularProgress size={30} sx={{ my: 3 }} />
                                    </TableCell>
                                </TableRow>
                            ) : events.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        <Typography variant="body1" color="text.secondary" sx={{ py: 3 }}>
                                            No events found
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                events.map((event) => {
                                    const isPast = isEventPast(event.event_date);
                                    
                                    return (
                                        <TableRow key={event.event_id} hover>
                                            <TableCell>
                                                <Typography variant="body1">
                                                    {event.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {event.description ? 
                                                        (event.description.length > 60 ? 
                                                            `${event.description.substring(0, 60)}...` : 
                                                            event.description) : 
                                                        'No description'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={event.category_name || 'Uncategorized'} 
                                                    size="small" 
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(event.event_date)}
                                            </TableCell>
                                            <TableCell>
                                                {event.location || 'No location'}
                                            </TableCell>
                                            <TableCell>
                                                {event.attendees || 0}
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={isPast ? 'Past' : 'Upcoming'} 
                                                    color={isPast ? 'default' : 'success'} 
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex' }}>
                                                    <Tooltip title="Edit Event">
                                                        <IconButton 
                                                            size="small" 
                                                            color="primary"
                                                            onClick={() => handleEditEvent(event)}
                                                        >
                                                            <Edit fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete Event">
                                                        <IconButton 
                                                            size="small" 
                                                            color="error"
                                                            onClick={() => handleDeleteConfirm(event)}
                                                        >
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="View Event">
                                                        <IconButton 
                                                            size="small"
                                                            onClick={() => window.open(`/events/${event.event_id}`, '_blank')}
                                                        >
                                                            <Visibility fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                
                {/* Pagination */}
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center',
                    p: 2
                }}>
                    <Pagination 
                        count={totalPages} 
                        page={page} 
                        onChange={handlePageChange} 
                        color="primary"
                        disabled={loading}
                    />
                </Box>
            </Paper>
            
            {/* Create/Edit Event Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {eventForm.event_id ? 'Edit Event' : 'Create New Event'}
                    <IconButton onClick={() => setDialogOpen(false)}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                label="Event Name"
                                value={eventForm.name}
                                onChange={(e) => handleFormChange('name', e.target.value)}
                                fullWidth
                                required
                                error={!!formErrors.name}
                                helperText={formErrors.name}
                                InputProps={{
                                    startAdornment: (
                                        <Event sx={{ color: 'action.active', mr: 1 }} />
                                    ),
                                }}
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth error={!!formErrors.category_id}>
                                <InputLabel>Category *</InputLabel>
                                <Select
                                    value={eventForm.category_id}
                                    onChange={(e) => handleFormChange('category_id', e.target.value)}
                                    label="Category *"
                                    required
                                    startAdornment={
                                        <Category sx={{ color: 'action.active', mr: 1 }} />
                                    }
                                >
                                    <MenuItem value="">
                                        <em>Select a category</em>
                                    </MenuItem>
                                    {categories.map((category) => (
                                        <MenuItem key={category.category_id} value={category.category_id}>
                                            {category.category_name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {formErrors.category_id && (
                                    <Typography variant="caption" color="error">
                                        {formErrors.category_id}
                                    </Typography>
                                )}
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DateTimePicker
                                    label="Event Date & Time *"
                                    value={eventForm.event_date}
                                    onChange={(newValue) => handleFormChange('event_date', newValue)}
                                    renderInput={(params) => (
                                        <TextField 
                                            {...params} 
                                            fullWidth 
                                            required
                                            error={!!formErrors.event_date}
                                            helperText={formErrors.event_date}
                                            InputProps={{
                                                startAdornment: (
                                                    <CalendarToday sx={{ color: 'action.active', mr: 1 }} />
                                                ),
                                            }}
                                        />
                                    )}
                                />
                            </LocalizationProvider>
                        </Grid>
                        
                        <Grid item xs={12}>
                            <TextField
                                label="Location"
                                value={eventForm.location}
                                onChange={(e) => handleFormChange('location', e.target.value)}
                                fullWidth
                                required
                                error={!!formErrors.location}
                                helperText={formErrors.location}
                                InputProps={{
                                    startAdornment: (
                                        <LocationOn sx={{ color: 'action.active', mr: 1 }} />
                                    ),
                                }}
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Expected Attendees"
                                type="number"
                                value={eventForm.attendees}
                                onChange={(e) => handleFormChange('attendees', parseInt(e.target.value) || 0)}
                                fullWidth
                                InputProps={{
                                    startAdornment: (
                                        <Person sx={{ color: 'action.active', mr: 1 }} />
                                    ),
                                }}
                            />
                        </Grid>
                        
                        <Grid item xs={12}>
                            <TextField
                                label="Description"
                                value={eventForm.description}
                                onChange={(e) => handleFormChange('description', e.target.value)}
                                fullWidth
                                multiline
                                rows={4}
                                placeholder="Provide details about the event..."
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSaveEvent}
                        disabled={loading}
                        startIcon={<Save />}
                    >
                        {eventForm.event_id ? 'Update Event' : 'Create Event'}
                    </Button>
                </DialogActions>
            </Dialog>
            
            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
                <DialogTitle>
                    Confirm Deletion
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1">
                        Are you sure you want to delete the event: 
                        <Typography component="span" fontWeight="bold" sx={{ display: 'inline', ml: 1 }}>
                            {selectedEvent?.name}
                        </Typography>
                        ?
                    </Typography>
                    <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                        This action cannot be undone. All associated data, including reviews, will be permanently deleted.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleDeleteEvent}
                        disabled={loading}
                    >
                        Delete Event
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EventsManagement;