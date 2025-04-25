import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getHoldings, getPositions, getOrders, getAccountInfo } from '../services/zerodha/api';
import { isAuthenticated, logout } from '../services/zerodha/authentication';

const ZerodhaContext = createContext();
const FETCH_COOLDOWN = 10000; // 10 seconds minimum between fetches
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Function to check if current time is within market hours
const isMarketHours = () => {
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours * 100 + minutes;

    // Check if it's a weekday (Monday-Friday) and between 9:00 AM and 3:30 PM
    return day !== 0 && day !== 6 && currentTime >= 900 && currentTime <= 1530;
};

export const useZerodha = () => {
    const context = useContext(ZerodhaContext);
    if (!context) {
        throw new Error('useZerodha must be used within a ZerodhaProvider');
    }
    return context;
};

export const ZerodhaProvider = ({ children }) => {
    const [isAuth, setIsAuth] = useState(false);
    const [sessionActive, setSessionActive] = useState(false);
    const [accountInfo, setAccountInfo] = useState(null);
    const [lastChecked, setLastChecked] = useState(0);
    const [loading, setLoading] = useState(false);
    const [holdings, setHoldings] = useState([]);
    const [positions, setPositions] = useState([]);
    const [orders, setOrders] = useState([]);
    const [isAutoSync, setIsAutoSync] = useState(false);
    const [error, setError] = useState(null);

    const isInitialLoadDone = useRef(false);
    const lastFetchTime = useRef(0);
    const fetchTimeoutRef = useRef(null);
    const retryCount = useRef(0);

    // Helper function to make API calls with retry logic
    const makeApiCallWithRetry = async (apiCall, errorMessage) => {
        try {
            const response = await apiCall();
            retryCount.current = 0; // Reset retry count on success
            return response;
        } catch (err) {
            if (err.message?.includes('ERR_INSUFFICIENT_RESOURCES') && retryCount.current < MAX_RETRIES) {
                retryCount.current++;
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retryCount.current));
                return makeApiCallWithRetry(apiCall, errorMessage);
            }
            throw new Error(`${errorMessage}: ${err.message}`);
        }
    };

    const checkSession = useCallback(async (forceCheck = false) => {
        const now = Date.now();
        if (!forceCheck && now - lastChecked < 2000) {
            return sessionActive;
        }

        try {
            setError(null);
            const response = await makeApiCallWithRetry(
                () => getAccountInfo(),
                'Failed to check session'
            );

            if (response.success) {
                setAccountInfo(response.data);
                setSessionActive(true);
                setIsAuth(true);
                setLastChecked(now);
                return true;
            } else {
                setSessionActive(false);
                setAccountInfo(null);
                if (!isAuth) {
                    setIsAuth(false);
                }
                return false;
            }
        } catch (err) {
            console.error('Error checking session:', err);
            setError(err.message);
            setSessionActive(false);
            setAccountInfo(null);
            return false;
        }
    }, [isAuth, lastChecked, sessionActive]);

    const fetchData = useCallback(async (force = false) => {
        const now = Date.now();
        if (!force && now - lastFetchTime.current < FETCH_COOLDOWN) {
            return;
        }

        if (!isAuth || !sessionActive) {
            return;
        }

        // Clear any pending fetch timeout
        if (fetchTimeoutRef.current) {
            clearTimeout(fetchTimeoutRef.current);
        }

        try {
            setLoading(true);
            setError(null);

            const [holdingsResponse, positionsResponse, ordersResponse] = await Promise.all([
                makeApiCallWithRetry(() => getHoldings(), 'Failed to fetch holdings'),
                makeApiCallWithRetry(() => getPositions(), 'Failed to fetch positions'),
                makeApiCallWithRetry(() => getOrders(), 'Failed to fetch orders')
            ]);

            setHoldings(holdingsResponse.data || []);
            setPositions(positionsResponse.data || []);
            setOrders(ordersResponse.data || []);
            lastFetchTime.current = now;
            retryCount.current = 0;
        } catch (err) {
            console.error('Error fetching data:', err);
            setError(err.message);
            // Schedule a retry after FETCH_COOLDOWN if it's an insufficient resources error
            if (err.message?.includes('ERR_INSUFFICIENT_RESOURCES')) {
                fetchTimeoutRef.current = setTimeout(() => fetchData(true), FETCH_COOLDOWN);
            }
        } finally {
            setLoading(false);
        }
    }, [isAuth, sessionActive]);

    const handleLogout = useCallback(async () => {
        try {
            await logout();
            localStorage.removeItem('zerodha_access_token');
            localStorage.removeItem('zerodha_public_token');
            setIsAuth(false);
            setSessionActive(false);
            setAccountInfo(null);
            setHoldings([]);
            setPositions([]);
            setOrders([]);
            setError(null);
            isInitialLoadDone.current = false;
            if (fetchTimeoutRef.current) {
                clearTimeout(fetchTimeoutRef.current);
            }
        } catch (err) {
            console.error('Error during logout:', err);
            setError(err.message);
        }
    }, []);

    // Initial setup effect
    useEffect(() => {
        const initializeApp = async () => {
            if (isInitialLoadDone.current) return;

            const token = localStorage.getItem('zerodha_access_token');
            if (token) {
                setIsAuth(true);
                const isSessionValid = await checkSession(true);
                if (isSessionValid) {
                    await fetchData(true);
                    setIsAutoSync(isMarketHours());
                    isInitialLoadDone.current = true;
                }
            }
        };

        initializeApp();

        return () => {
            if (fetchTimeoutRef.current) {
                clearTimeout(fetchTimeoutRef.current);
            }
        };
    }, [checkSession, fetchData]);

    // Auto-sync effect with increased interval
    useEffect(() => {
        let interval;

        if (isAuth && sessionActive && isAutoSync && isInitialLoadDone.current) {
            interval = setInterval(async () => {
                const isMarketOpen = isMarketHours();
                if (!isMarketOpen) {
                    setIsAutoSync(false);
                    return;
                }
                await fetchData();
            }, FETCH_COOLDOWN); // Use the same cooldown period for the interval
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isAuth, sessionActive, isAutoSync, fetchData]);

    const value = {
        isAuth,
        sessionActive,
        accountInfo,
        loading,
        error,
        checkSession,
        fetchData,
        handleLogout,
        isAutoSync,
        setIsAutoSync,
        holdings,
        positions,
        orders
    };

    return (
        <ZerodhaContext.Provider value={value}>
            {children}
        </ZerodhaContext.Provider>
    );
}; 