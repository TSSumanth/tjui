// Function to check if current time is within market hours (extended 30 mins after close)
const isMarketHours = () => {
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours * 100 + minutes;

    // Check if it's a weekday (Monday-Friday) and between 9:00 AM and 4:00 PM
    return day !== 0 && day !== 6 && currentTime >= 900 && currentTime <= 1600;
};

// Add this helper function at the top with other constants
const isTokenExpired = (tokenTimestamp) => {
    const now = new Date();
    const tokenDate = new Date(tokenTimestamp);
    const tomorrow6AM = new Date();
    tomorrow6AM.setDate(tomorrow6AM.getDate() + 1);
    tomorrow6AM.setHours(6, 0, 0, 0);

    // If token was created today, it's valid until 6 AM tomorrow
    if (tokenDate.toDateString() === now.toDateString()) {
        return now > tomorrow6AM;
    }

    // If token was created before today, it's expired
    return true;
};

export { isMarketHours, isTokenExpired };