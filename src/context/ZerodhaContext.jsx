import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getHoldings, getPositions, getOrders, getAccountInfo } from '../services/zerodha/api';
import { isAuthenticated, logout } from '../services/zerodha/authentication';

const ZerodhaContext = createContext();
const FETCH_COOLDOWN = 10000; // 10 seconds minimum between fetches
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds
const SESSION_CHECK_INTERVAL = 2000; // 2 seconds
const FETCH_INTERVAL = 10000; // 10 seconds
const AUTO_SYNC_INTERVAL = 10000; // 10 seconds

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
    const isMounted = useRef(true);
    const sessionCheckTimeoutRef = useRef(null);

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

    // Check session status
    const checkSession = useCallback(async (force = false) => {
        if (!isMounted.current) return false;

        const now = Date.now();
        if (!force && now - lastChecked < SESSION_CHECK_INTERVAL) {
            return Boolean(sessionActive);
        }

        try {
            const response = await makeApiCallWithRetry(
                () => getAccountInfo(),
                'Failed to check session'
            );

            const currentSessionState = Boolean(sessionActive);
            console.log('Session check response:', {
                success: response?.success,
                hasData: !!response?.data,
                currentSessionActive: currentSessionState,
                responseData: response?.data
            });

            if (!response || !response.success) {
                console.log('Setting session to inactive due to invalid response');
                if (isMounted.current) {
                    setSessionActive(false);
                    setIsAuth(false);
                }
                return false;
            }

            // If we have a successful response with data, consider the session valid
            const isValid = Boolean(response.success && response.data);
            console.log('Session validity check:', {
                isValid,
                success: response.success,
                hasData: !!response.data
            });

            if (isMounted.current) {
                console.log('Updating session state:', {
                    newSessionActive: isValid,
                    previousSessionActive: currentSessionState
                });
                setSessionActive(isValid);
                setLastChecked(now);
                setAccountInfo(response.data);
                setIsAuth(true);
            }
            return isValid;
        } catch (err) {
            console.error('Error checking session:', err);
            if (isMounted.current) {
                setSessionActive(false);
                setIsAuth(false);
            }
            return false;
        }
    }, [sessionActive, lastChecked]);

    // Fetch data
    const fetchData = useCallback(async (force = false) => {
        if (!isMounted.current) return;

        const now = Date.now();
        if (!force && now - lastFetchTime.current < FETCH_INTERVAL) {
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Only fetch if we have a valid session
            if (await checkSession()) {
                const [holdingsRes, positionsRes, ordersRes] = await Promise.all([
                    makeApiCallWithRetry(() => getHoldings(), 'Failed to fetch holdings'),
                    makeApiCallWithRetry(() => getPositions(), 'Failed to fetch positions'),
                    makeApiCallWithRetry(() => getOrders(), 'Failed to fetch orders')
                ]);

                if (isMounted.current) {
                    if (holdingsRes) setHoldings(holdingsRes.data || []);
                    if (positionsRes) setPositions(positionsRes.data || []);
                    if (ordersRes) setOrders(ordersRes.data || []);
                }
            }

            lastFetchTime.current = now;
        } catch (err) {
            console.error('Error fetching data:', err);
            if (isMounted.current) {
                setError(err.message);
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, [checkSession]);

    // Initial setup effect
    useEffect(() => {
        isMounted.current = true;

        const initializeApp = async () => {
            if (isInitialLoadDone.current || !isMounted.current) return;

            const token = localStorage.getItem('zerodha_access_token');
            console.log('Initializing app with token:', !!token);

            if (token) {
                setIsAuth(true);
                const isSessionValid = await checkSession(true);
                console.log('Initial session check result:', isSessionValid);

                if (isSessionValid && isMounted.current) {
                    await fetchData(true);
                    setIsAutoSync(isMarketHours());
                    isInitialLoadDone.current = true;
                }
            }
        };

        initializeApp();

        return () => {
            isMounted.current = false;
            if (sessionCheckTimeoutRef.current) {
                clearTimeout(sessionCheckTimeoutRef.current);
            }
        };
    }, []);

    // Auto-sync effect
    useEffect(() => {
        if (!isAutoSync || !isMarketHours()) return;

        const syncData = async () => {
            if (!isMounted.current) return;
            await fetchData();
        };

        const intervalId = setInterval(syncData, AUTO_SYNC_INTERVAL);
        return () => clearInterval(intervalId);
    }, [isAutoSync, fetchData]);

    const handleLogout = useCallback(async () => {
        try {
            await logout();
            localStorage.removeItem('zerodha_access_token');
            localStorage.removeItem('zerodha_public_token');
            if (isMounted.current) {
                setIsAuth(false);
                setSessionActive(false);
                setAccountInfo(null);
                setHoldings([]);
                setPositions([]);
                setOrders([]);
                setError(null);
                setIsAutoSync(false);
                isInitialLoadDone.current = false;
            }
        } catch (err) {
            console.error('Error during logout:', err);
            if (isMounted.current) {
                setError(err.message);
            }
        }
    }, []);

    const value = {
        isAuth,
        sessionActive: Boolean(sessionActive),
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