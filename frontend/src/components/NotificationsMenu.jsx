import React, { useState, useEffect, useCallback } from 'react';
import {
    IconButton, Badge, Menu, MenuItem, Typography,
    Divider, Box, CircularProgress, Button, Tooltip,
    List, ListItem, ListItemText, ListItemIcon
} from '@mui/material';
import {
    Notifications, MarkEmailRead, Delete,
    Error, Info
} from '@mui/icons-material';
import api from '../utils/api';

const NotificationsMenu = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);

    const open = Boolean(anchorEl);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await api.users.getNotifications();
            
            if (result && result.notifications) {
                setNotifications(result.notifications);
                // Count unread notifications
                setUnreadCount(result.notifications.filter(notification => !notification.is_read).length);
            } else {
                setNotifications([]);
                setUnreadCount(0);
            }
        } catch (err) {
            console.error('Error fetching notifications:', err);
            setError('Failed to load notifications');
            setNotifications([]);
            setUnreadCount(0);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Fetch notifications on component mount
        fetchNotifications();
        
        // Set up polling every 60 seconds
        const intervalId = setInterval(fetchNotifications, 60000);
        
        return () => clearInterval(intervalId);
    }, [fetchNotifications]);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleMarkAllAsRead = async () => {
        try {
            await api.users.markAllNotificationsAsRead();
            
            // Update UI
            setNotifications(prevNotifications => 
                prevNotifications.map(notification => ({
                    ...notification,
                    is_read: true
                }))
            );
            setUnreadCount(0);
        } catch (err) {
            console.error('Error marking notifications as read:', err);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await api.users.markNotificationAsRead(notificationId);
            
            // Update UI
            setNotifications(prevNotifications => 
                prevNotifications.map(notification => 
                    notification.notification_id === notificationId
                        ? { ...notification, is_read: true }
                        : notification
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const handleDeleteNotification = async (notificationId) => {
        try {
            await api.users.deleteNotification(notificationId);
            
            // Update UI
            const deletedNotification = notifications.find(
                notification => notification.notification_id === notificationId
            );
            
            setNotifications(prevNotifications => 
                prevNotifications.filter(notification => 
                    notification.notification_id !== notificationId
                )
            );
            
            // Update unread count if we deleted an unread notification
            if (deletedNotification && !deletedNotification.is_read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error('Error deleting notification:', err);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'review_deleted':
            case 'review_rejected':
                return <Error color="error" />;
            default:
                return <Info color="primary" />;
        }
    };

    return (
        <>
            <Tooltip title="Notifications">
                <IconButton
                    color="inherit"
                    onClick={handleClick}
                    size="large"
                >
                    <Badge badgeContent={unreadCount} color="error">
                        <Notifications />
                    </Badge>
                </IconButton>
            </Tooltip>
            
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                PaperProps={{
                    sx: { 
                        width: 320,
                        maxHeight: 500
                    }
                }}
            >
                <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        Notifications
                    </Typography>
                    {notifications.length > 0 && (
                        <Button 
                            size="small" 
                            startIcon={<MarkEmailRead />}
                            onClick={handleMarkAllAsRead}
                            disabled={unreadCount === 0}
                        >
                            Mark All Read
                        </Button>
                    )}
                </Box>
                
                <Divider />
                
                {loading && notifications.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : error ? (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography color="error">{error}</Typography>
                        <Button 
                            size="small" 
                            onClick={fetchNotifications} 
                            sx={{ mt: 1 }}
                        >
                            Retry
                        </Button>
                    </Box>
                ) : notifications.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            No notifications
                        </Typography>
                    </Box>
                ) : (
                    <List sx={{ p: 0 }}>
                        {notifications.map((notification) => (
                            <React.Fragment key={notification.notification_id}>
                                <ListItem 
                                    alignItems="flex-start"
                                    sx={{ 
                                        bgcolor: notification.is_read ? 'inherit' : 'action.hover',
                                        pr: 8,
                                        position: 'relative',
                                    }}
                                    onClick={() => !notification.is_read && handleMarkAsRead(notification.notification_id)}
                                >
                                    <ListItemIcon>
                                        {getNotificationIcon(notification.type)}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={notification.message}
                                        secondary={formatDate(notification.created_at)}
                                    />
                                    <Box sx={{ position: 'absolute', right: 8, top: 8 }}>
                                        <Tooltip title="Delete">
                                            <IconButton 
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteNotification(notification.notification_id);
                                                }}
                                            >
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </ListItem>
                                <Divider component="li" />
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </Menu>
        </>
    );
};

export default NotificationsMenu;