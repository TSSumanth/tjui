import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getHoldings, getPositions, getOrders } from '../services/zerodha/api';
import { isAuthenticated, logout } from '../services/zerodha/authentication';

const ZerodhaContext = createContext();

// Function to check if current time is within market hours
const isMarketHours = () => {
    const now = new Date();
    const day = now.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours * 100 + minutes; // Convert to HHMM format

    // Check if it's a weekday (Monday-Friday)
    if (day === 0 || day === 6) return false;

    // Check if time is between 9:00 AM and 3:30 PM
    return currentTime >= 900 && currentTime <= 1530;
};

export const useZerodha = () => {
    const context = useContext(ZerodhaContext);
    if (!context) {
        throw new Error('useZerodha must be used within a ZerodhaProvider');
    }
    return context;
};

export const ZerodhaProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [holdings, setHoldings] = useState([]);
    const [positions, setPositions] = useState([]);
    const [orders, setOrders] = useState([]);
    const [isAuth, setIsAuth] = useState(isAuthenticated());
    const [isAutoSync, setIsAutoSync] = useState(false);

    const fetchData = useCallback(async () => {
        if (!isAuth) return;

        setIsLoading(true);
        setError(null);

        try {
            const [holdingsData, positionsData, ordersData] = await Promise.all([
                getHoldings(),
                getPositions(),
                getOrders()
            ]);

            setHoldings(holdingsData.data || []);
            setPositions(positionsData.data || []);
            setOrders(ordersData.data || []);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError(err.response?.data?.error || err.message || 'Failed to fetch data');
            if (err.response?.status === 401) {
                handleLogout();
            }
        } finally {
            setIsLoading(false);
        }
    }, [isAuth]);

    const handleLogout = useCallback(() => {
        logout();
        setIsAuth(false);
        setHoldings([]);
        setPositions([]);
        setOrders([]);
        setError(null);
        setIsAutoSync(false);
    }, []);

    // Effect for auto-sync during market hours
    useEffect(() => {
        let interval;
        let isInitialLoad = true;  // Flag to track initial load

        const checkAndFetch = () => {
            if (isAuth) {
                if (isInitialLoad) {
                    // Always fetch on initial load
                    fetchData();
                    isInitialLoad = false;
                    setIsAutoSync(isMarketHours());  // Set auto-sync status based on market hours
                } else if (isMarketHours()) {
                    // Only auto-fetch during market hours after initial load
                    fetchData();
                    setIsAutoSync(true);
                } else {
                    setIsAutoSync(false);
                }
            }
        };

        if (isAuth) {
            // Initial check and fetch
            checkAndFetch();

            // Set up interval to check market hours and fetch data
            interval = setInterval(() => {
                checkAndFetch();
            }, 60000); // Check every minute
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
            setIsAutoSync(false);
        };
    }, [isAuth, fetchData]);

    const value = {
        isLoading,
        error,
        holdings,
        positions,
        orders,
        isAuth,
        setIsAuth,
        fetchData,
        handleLogout,
        isAutoSync // Add this to context so we can show sync status
    };

    return (
        <ZerodhaContext.Provider value={value}>
            {children}
        </ZerodhaContext.Provider>
    );
}; 