import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getHoldings, getPositions, getOrders, getAccountInfo } from '../services/zerodha/api';
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
    const [sessionActive, setSessionActive] = useState(false);
    const [lastChecked, setLastChecked] = useState(0);

    // Initialize session state
    useEffect(() => {
        const initializeSession = async () => {
            if (isAuthenticated()) {
                try {
                    const response = await getAccountInfo();
                    const isActive = response.success;
                    console.log('Initial session check:', { isActive, timestamp: new Date().toLocaleTimeString() });
                    setSessionActive(isActive);
                    setIsAuth(true);
                    if (isActive) {
                        fetchData();
                    }
                } catch (err) {
                    console.error('Initial session check failed:', err);
                    if (err.response?.status === 401) {
                        handleLogout();
                    }
                }
            }
        };

        initializeSession();
    }, []); // Run only on mount

    const handleLogout = useCallback(() => {
        logout();
        setIsAuth(false);
        setSessionActive(false);
        setHoldings([]);
        setPositions([]);
        setOrders([]);
        setError(null);
        setIsAutoSync(false);
        setLastChecked(0);
    }, []);

    const checkSession = useCallback(async (force = false) => {
        const now = Date.now();
        const timeSinceLastCheck = now - lastChecked;

        // Skip check if less than 30 seconds have passed, unless forced
        if (!force && timeSinceLastCheck < 30000) {
            console.log('Skipping session check - checked recently:', {
                timeSinceLastCheck: Math.round(timeSinceLastCheck / 1000) + 's ago'
            });
            return sessionActive;
        }

        if (!isAuthenticated()) {
            setIsAuth(false);
            setSessionActive(false);
            return false;
        }

        try {
            setLoading(true);
            const response = await getAccountInfo();
            const isActive = response.success;
            console.log('Session check:', { isActive, timestamp: new Date().toLocaleTimeString() });
            setSessionActive(isActive);
            setIsAuth(true);
            setLastChecked(now);

            if (!isActive) {
                handleLogout();
            }
            return isActive;
        } catch (err) {
            console.error('Session check failed:', err);
            if (err.response?.status === 401) {
                handleLogout();
            }
            setSessionActive(false);
            return false;
        } finally {
            setLoading(false);
        }
    }, [handleLogout, lastChecked, sessionActive]);

    const fetchData = useCallback(async () => {
        if (!isAuth || !sessionActive) {
            console.log('Skipping fetch - not authenticated or session inactive');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('Fetching data at:', new Date().toLocaleTimeString());

            // Sequential fetching with delays to avoid rate limits
            console.log('Fetching holdings...');
            const holdingsData = await getHoldings();
            setHoldings(holdingsData.data || []);
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay

            console.log('Fetching positions...');
            const positionsData = await getPositions();
            setPositions(positionsData.data || []);
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay

            console.log('Fetching orders...');
            const ordersData = await getOrders();
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
    }, [isAuth, sessionActive, handleLogout]);

    // Effect for auto-sync during market hours
    useEffect(() => {
        let interval;
        let isInitialLoad = true;  // Flag to track initial load

        const checkAndFetch = async () => {
            if (isAuth) {
                // First check if session is active
                const isSessionValid = await checkSession();
                if (!isSessionValid) {
                    console.log('Session invalid, skipping fetch');
                    return;
                }

                const isMarketOpen = isMarketHours();
                console.log('Market status check:', {
                    isMarketOpen,
                    currentTime: new Date().toLocaleTimeString(),
                    isInitialLoad,
                    isAutoSync,
                    sessionActive
                });

                if (isInitialLoad) {
                    // Fetch on initial load only during market hours
                    console.log('Initial load check:', { isMarketOpen });
                    await fetchData();
                    isInitialLoad = false;
                    setIsAutoSync(isMarketOpen);
                } else if (isAutoSync && isMarketOpen) {
                    // Only auto-fetch if both auto-sync is enabled and market is open
                    console.log('Auto-fetching data during market hours');
                    await fetchData();
                } else {
                    console.log('Skipping auto-fetch:', {
                        reason: !isMarketOpen ? 'Market closed' : 'Auto-sync disabled'
                    });
                    setIsAutoSync(false);
                }
            }
        };

        if (isAuth) {
            // Initial check and fetch
            checkAndFetch();

            // Set up interval for market hours check
            interval = setInterval(() => {
                const isMarketOpen = isMarketHours();
                if (!isMarketOpen) {
                    // If market is closed, disable auto-sync
                    setIsAutoSync(false);
                    console.log('Market closed, disabled auto-sync');
                    return;
                }
                // Only proceed with check and fetch if market is open
                checkAndFetch();
            }, 60000); // Check every minute
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
            setIsAutoSync(false);
        };
    }, [isAuth, fetchData, checkSession, isAutoSync]);

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
        isAutoSync,
        sessionActive,
        checkSession
    };

    return (
        <ZerodhaContext.Provider value={value}>
            {children}
        </ZerodhaContext.Provider>
    );
}; 