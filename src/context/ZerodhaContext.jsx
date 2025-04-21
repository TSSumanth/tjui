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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [holdings, setHoldings] = useState([]);
    const [positions, setPositions] = useState([]);
    const [orders, setOrders] = useState([]);
    const [isAuth, setIsAuth] = useState(isAuthenticated());
    const [isAutoSync, setIsAutoSync] = useState(false);

    const fetchData = useCallback(async () => {
        if (!isAuth) return;

        setLoading(true);
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
            setLoading(false);
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
                const isMarketOpen = isMarketHours();
                console.log('Market status check:', {
                    isMarketOpen,
                    currentTime: new Date().toLocaleTimeString(),
                    isInitialLoad,
                    isAutoSync
                });

                if (isInitialLoad) {
                    // Always fetch on initial load
                    console.log('Performing initial data fetch');
                    fetchData();
                    isInitialLoad = false;
                    setIsAutoSync(isMarketOpen);
                } else if (isMarketOpen) {
                    // Only auto-fetch during market hours after initial load
                    console.log('Auto-fetching data during market hours');
                    fetchData();
                    setIsAutoSync(true);
                } else {
                    console.log('Market is closed, stopping auto-sync');
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
            }, 30000); // Check every 30 seconds instead of every minute
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
            setIsAutoSync(false);
        };
    }, [isAuth, fetchData, isAutoSync]);

    const value = {
        loading,
        error,
        holdings,
        positions,
        orders,
        isAuth,
        setIsAuth,
        fetchData,
        handleLogout,
        isAutoSync
    };

    return (
        <ZerodhaContext.Provider value={value}>
            {children}
        </ZerodhaContext.Provider>
    );
}; 