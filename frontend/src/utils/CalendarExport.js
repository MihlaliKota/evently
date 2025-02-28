// Create a new file in src/utils/CalendarExport.js

/**
 * Utility functions for calendar exports
 */

// Format date for iCalendar (YYYYMMDDTHHMMSSZ)
const formatICalDate = (date) => {
    const pad = (num) => (num < 10 ? '0' : '') + num;
    
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
};

// Generate a random string for unique identifiers
const generateUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

/**
 * Generate an iCalendar file for a single event
 * @param {Object} event - The event object
 * @returns {string} - iCalendar formatted string
 */
export const generateICalEvent = (event) => {
    const { name, description, location, event_date } = event;
    const eventStart = new Date(event_date);
    // Default duration 1 hour
    const eventEnd = new Date(eventStart.getTime() + 60 * 60 * 1000);
    
    const now = new Date();
    const uid = generateUID();
    
    let iCalContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Evently//NONSGML Event Calendar//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${formatICalDate(now)}`,
        `DTSTART:${formatICalDate(eventStart)}`,
        `DTEND:${formatICalDate(eventEnd)}`,
        `SUMMARY:${name}`,
    ].join('\r\n');
    
    // Add optional fields if available
    if (description) {
        iCalContent += `\r\nDESCRIPTION:${description.replace(/\n/g, '\\n')}`;
    }
    
    if (location) {
        iCalContent += `\r\nLOCATION:${location}`;
    }
    
    // Add end of event and calendar
    iCalContent += '\r\nEND:VEVENT\r\nEND:VCALENDAR';
    
    return iCalContent;
};

/**
 * Download an iCalendar file for an event
 * @param {Object} event - The event object
 */
export const downloadICalEvent = (event) => {
    const iCalContent = generateICalEvent(event);
    const blob = new Blob([iCalContent], { type: 'text/calendar;charset=utf-8' });
    
    // Create a download link and trigger it
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${event.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Create Google Calendar URL for an event
 * @param {Object} event - The event object
 * @returns {string} - Google Calendar URL
 */
export const getGoogleCalendarUrl = (event) => {
    const { name, description, location, event_date } = event;
    const eventStart = new Date(event_date);
    // Default duration 1 hour
    const eventEnd = new Date(eventStart.getTime() + 60 * 60 * 1000);
    
    // Format dates for Google Calendar
    const formatGoogleDate = (date) => {
        return date.toISOString().replace(/-|:|\.\d\d\d/g, '');
    };
    
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: name,
        dates: `${formatGoogleDate(eventStart)}/${formatGoogleDate(eventEnd)}`,
        details: description || '',
        location: location || '',
        sf: 'true',
        output: 'xml'
    });
    
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Create Outlook Calendar URL for an event
 * @param {Object} event - The event object
 * @returns {string} - Outlook Calendar URL
 */
export const getOutlookCalendarUrl = (event) => {
    const { name, description, location, event_date } = event;
    const eventStart = new Date(event_date);
    // Default duration 1 hour
    const eventEnd = new Date(eventStart.getTime() + 60 * 60 * 1000);
    
    const params = new URLSearchParams({
        path: '/calendar/action/compose',
        rru: 'addevent',
        subject: name,
        startdt: eventStart.toISOString(),
        enddt: eventEnd.toISOString(),
        body: description || '',
        location: location || ''
    });
    
    return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
};

export default {
    downloadICalEvent,
    getGoogleCalendarUrl,
    getOutlookCalendarUrl
};