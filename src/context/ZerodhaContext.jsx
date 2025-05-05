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

    // Check if it's a weekday (Monday-Friday) and between 9:15 AM and 3:30 PM
    return day !== 0 && day !== 6 && currentTime >= 915 && currentTime <= 1530;
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
    const [loadingStates, setLoadingStates] = useState({
        holdings: false,
        positions: false,
        orders: false
    });
    const [holdings, setHoldings] = useState([]);
    const [positions, setPositions] = useState([]);
    const [orders, setOrders] = useState([]);
    const [isAutoSync, setIsAutoSync] = useState(false);
    const [error, setError] = useState(null);
    const [ltpMap, setLtpMap] = useState({});

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
            // Instead of calling account API, just check if we have a valid token
            const token = localStorage.getItem('zerodha_access_token');
            const isValid = Boolean(token);

            if (isMounted.current) {
                setSessionActive(isValid);
                setLastChecked(now);
                setIsAuth(isValid);
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
            if (force) {
                setLoading(true);
            }
            setError(null);

            // Only fetch if we have a valid session
            if (await checkSession()) {
                // If force is true, also fetch account info
                if (force) {
                    try {
                        const accountRes = await makeApiCallWithRetry(() => getAccountInfo(), 'Failed to fetch account info');
                        if (accountRes && accountRes.success) {
                            setAccountInfo(accountRes.data);
                        }
                    } catch (err) {
                        console.error('Error fetching account info:', err);
                    }
                }

                // Set individual loading states
                setLoadingStates(prev => ({
                    holdings: true,
                    positions: true,
                    orders: false
                }));

                try {
                    const holdingsRes = await makeApiCallWithRetry(() => getHoldings(), 'Failed to fetch holdings');
                    if (holdingsRes && isMounted.current) {
                        setHoldings((holdingsRes.data || []).map(h => ({ ...h })));
                    }
                } catch (err) {
                    console.error('Error fetching holdings:', err);
                } finally {
                    if (isMounted.current) {
                        setLoadingStates(prev => ({ ...prev, holdings: false }));
                    }
                }

                try {
                    const positionsRes = await makeApiCallWithRetry(() => getPositions(), 'Failed to fetch positions');
                    if (positionsRes && isMounted.current) {
                        setPositions(positionsRes.data || []);
                    }
                } catch (err) {
                    console.error('Error fetching positions:', err);
                } finally {
                    if (isMounted.current) {
                        setLoadingStates(prev => ({ ...prev, positions: false }));
                    }
                }
            }

            lastFetchTime.current = now;
        } catch (err) {
            console.error('Error fetching data:', err);
            if (isMounted.current) {
                setError(err.message);
            }
        } finally {
            if (isMounted.current && force) {
                setLoading(false);
            }
        }
    }, [checkSession]);

    // Fetch orders separately
    const fetchOrders = useCallback(async () => {
        if (!isMounted.current) return;

        try {
            setLoadingStates(prev => ({ ...prev, orders: true }));
            const ordersRes = await makeApiCallWithRetry(() => getOrders(), 'Failed to fetch orders');
            if (ordersRes && isMounted.current) {
                setOrders(ordersRes.data || []);
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
            if (isMounted.current) {
                setError(err.message);
            }
        } finally {
            if (isMounted.current) {
                setLoadingStates(prev => ({ ...prev, orders: false }));
            }
        }
    }, []);

    // Fetch holdings separately
    const fetchHoldings = useCallback(async () => {
        if (!isMounted.current) return;
        try {
            setLoadingStates(prev => ({ ...prev, holdings: true }));
            const holdingsRes = await makeApiCallWithRetry(() => getHoldings(), 'Failed to fetch holdings');
            if (holdingsRes && isMounted.current) {
                setHoldings((holdingsRes.data || []).map(h => ({ ...h })));
            }
        } catch (err) {
            console.error('Error fetching holdings:', err);
        } finally {
            if (isMounted.current) {
                setLoadingStates(prev => ({ ...prev, holdings: false }));
            }
        }
    }, []);

    // Fetch positions separately
    const fetchPositions = useCallback(async () => {
        if (!isMounted.current) return;
        try {
            setLoadingStates(prev => ({ ...prev, positions: true }));
            const positionsRes = await makeApiCallWithRetry(() => getPositions(), 'Failed to fetch positions');
            if (positionsRes && isMounted.current) {
                setPositions(positionsRes.data || []);
            }
        } catch (err) {
            console.error('Error fetching positions:', err);
        } finally {
            if (isMounted.current) {
                setLoadingStates(prev => ({ ...prev, positions: false }));
            }
        }
    }, []);

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
                    // Fetch account info only during initial load
                    try {
                        const accountRes = await makeApiCallWithRetry(() => getAccountInfo(), 'Failed to fetch account info');
                        if (accountRes && accountRes.success) {
                            setAccountInfo(accountRes.data);
                        }
                    } catch (err) {
                        console.error('Error fetching account info:', err);
                    }

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

    // Auto-sync effect - separate intervals for holdings and positions
    useEffect(() => {
        if (!isAutoSync || !isMarketHours()) return;

        const holdingsInterval = setInterval(fetchHoldings, 5000);
        const positionsInterval = setInterval(fetchPositions, 20000);

        return () => {
            clearInterval(holdingsInterval);
            clearInterval(positionsInterval);
        };
    }, [isAutoSync, fetchHoldings, fetchPositions]);

    // Market hours check effect
    useEffect(() => {
        if (!sessionActive) return;

        const checkMarketHours = () => {
            const shouldAutoSync = isMarketHours();
            if (shouldAutoSync !== isAutoSync) {
                setIsAutoSync(shouldAutoSync);
            }
        };

        // Check immediately
        checkMarketHours();

        // Check every minute
        const intervalId = setInterval(checkMarketHours, 60000);
        return () => clearInterval(intervalId);
    }, [sessionActive, isAutoSync]);

    // Update ltpMap whenever holdings or positions change
    useEffect(() => {
        const newLtpMap = {};
        (holdings || []).forEach(h => {
            if (h.tradingsymbol && h.last_price !== undefined) {
                newLtpMap[h.tradingsymbol] = h.last_price;
            }
        });
        // If positions is an array
        if (Array.isArray(positions)) {
            positions.forEach(p => {
                if (p.tradingsymbol && p.last_price !== undefined) {
                    newLtpMap[p.tradingsymbol] = p.last_price;
                }
            });
        }
        // If positions is an object with arrays (e.g., { net: [], day: [] })
        else if (positions && typeof positions === 'object') {
            Object.values(positions).forEach(arr => {
                if (Array.isArray(arr)) {
                    arr.forEach(p => {
                        if (p.tradingsymbol && p.last_price !== undefined) {
                            newLtpMap[p.tradingsymbol] = p.last_price;
                        }
                    });
                }
            });
        }
        setLtpMap(newLtpMap);
    }, [holdings, positions]);

    // Remove any automatic polling for orders
    useEffect(() => {
        // Only fetch orders on initial mount if we have a valid session
        if (isInitialLoadDone.current) return;

        const initialFetch = async () => {
            if (await checkSession()) {
                await fetchOrders();
                isInitialLoadDone.current = true;
            }
        };

        initialFetch();
    }, [checkSession, fetchOrders]);

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
        loadingStates,
        error,
        checkSession,
        fetchData,
        fetchOrders,
        handleLogout,
        isAutoSync,
        setIsAutoSync,
        holdings,
        positions,
        orders,
        fetchHoldings,
        fetchPositions,
        ltpMap
    };

    return (
        <ZerodhaContext.Provider value={value}>
            {children}
        </ZerodhaContext.Provider>
    );
}; 