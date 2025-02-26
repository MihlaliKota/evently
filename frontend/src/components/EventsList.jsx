import React, { useState, useEffect } from 'react';
import { Container, Typography, List, ListItem, ListItemText, Paper } from '@mui/material'; // Import MUI components

function EventsList() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch('http://localhost:5000/api/events');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setEvents(data);
                setLoading(false);
            } catch (e) {
                setError(e);
                setLoading(false);
                console.error("Error fetching events:", e);
            }
        };
        fetchEvents();
    }, []);

    if (loading) {
        return <p>Loading events...</p>;
    }

    if (error) {
        return <p>Error loading events: {error.message}</p>;
    }

    return (
        <Container maxWidth="md"> {/* Use MUI Container for layout */}
            <Typography variant="h4" component="h2" align="center" gutterBottom> {/* MUI Typography for heading */}
                Events List
            </Typography>
            <List> {/* MUI List for event items */}
                {events.map(event => (
                    <Paper elevation={2} sx={{ marginBottom: 2 }}> {/* MUI Paper for card-like appearance */}
                        <ListItem key={event.event_id} alignItems="flex-start"> {/* MUI ListItem for each event */}
                            <ListItemText
                                primary={<Typography variant="h6" component="span" style={{ fontWeight: 'bold' }}>{event.name}</Typography>} // Bold event name
                                secondary={
                                    <React.Fragment>
                                        <Typography
                                            sx={{ display: 'inline' }}
                                            component="span"
                                            variant="body2"
                                            color="text.primary"
                                        >
                                            {new Date(event.event_date).toLocaleDateString()} - Location: {event.location}
                                        </Typography>
                                        <Typography variant="body1">
                                            {event.description}
                                        </Typography>
                                    </React.Fragment>
                                }
                            />
                        </ListItem>
                    </Paper>
                ))}
            </List>
        </Container>
    );
}

export default EventsList;