import React from 'react';
import LogoutButton from './LogOutButton'; // Import LogoutButton

const Dashboard = ({ username }) => {
    return (
        <div>
            <h2>Welcome to the Dashboard, {username}!</h2>
            <p>This is your protected area.</p>
            {/* You can add more content for your dashboard here */}
        </div>
    );
};

export default Dashboard;