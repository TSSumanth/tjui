import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getHoldings, getPositions, getOrders, getAccountInfo } from '../services/zerodha/api';
import { isAuthenticated, logout } from '../services/zerodha/authentication';
import { getOrderPairs, updateOrderPairStatus, updateOrderPair } from '../services/zerodha/oco';
import { getOrderById, cancelZerodhaOrder, placeOrder } from '../services/zerodha/api';
import { updateOaoOrderPair } from '../services/zerodha/oao';

const ZerodhaContext = createContext();
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds
const SESSION_CHECK_INTERVAL = 2000; // 2 seconds
const FETCH_INTERVAL = 60000; // 60 seconds

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
    const [ocoPairs, setOcoPairs] = useState([]);
    const [ocoStatusMap, setOcoStatusMap] = useState({});

    const isInitialLoadDone = useRef(false);
    const lastFetchTime = useRef(0);
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
            // Check if we have a valid token
            const token = localStorage.getItem('zerodha_access_token');
            if (!token) {
                if (isMounted.current) {
                    setSessionActive(false);
                    setIsAuth(false);
                    setLastChecked(now);
                }
                return false;
            }

            // Try to fetch account info to validate token
            try {
                const accountRes = await getAccountInfo();
                const isValid = accountRes && accountRes.success;

                if (isMounted.current) {
                    setSessionActive(isValid);
                    setIsAuth(isValid);
                    setLastChecked(now);
                    if (isValid && accountRes.data) {
                        setAccountInfo(accountRes.data);
                    }
                }
                return isValid;
            } catch (err) {
                console.error('Error validating session:', err);
                if (isMounted.current) {
                    setSessionActive(false);
                    setIsAuth(false);
                    setLastChecked(now);
                }
                return false;
            }
        } catch (err) {
            console.error('Error checking session:', err);
            if (isMounted.current) {
                setSessionActive(false);
                setIsAuth(false);
                setLastChecked(now);
            }
            return false;
        }
    }, [sessionActive, lastChecked]);

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
                        // After holdings are fetched successfully, fetch positions
                        await fetchPositions();
                    }
                } catch (err) {
                    console.error('Error fetching holdings:', err);
                } finally {
                    if (isMounted.current) {
                        setLoadingStates(prev => ({ ...prev, holdings: false }));
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
    }, [checkSession, fetchPositions]);

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

    // Initial setup effect
    useEffect(() => {
        isMounted.current = true;

        const initializeApp = async () => {
            if (isInitialLoadDone.current || !isMounted.current) return;

            setLoading(true);
            const isSessionValid = await checkSession(true);
            console.log('Initial session check result:', isSessionValid);

            if (isSessionValid && isMounted.current) {
                await fetchData(true);
                setIsAutoSync(isMarketHours());
            }

            isInitialLoadDone.current = true;
            if (isMounted.current) {
                setLoading(false);
            }
        };

        initializeApp();

        return () => {
            isMounted.current = false;
            if (sessionCheckTimeoutRef.current) {
                clearTimeout(sessionCheckTimeoutRef.current);
            }
        };
    }, [checkSession, fetchData]);

    // Auto-sync effect - single interval for holdings which triggers positions
    useEffect(() => {
        if (!isAutoSync || !isMarketHours()) return;

        const syncInterval = setInterval(fetchData, FETCH_INTERVAL);

        return () => {
            clearInterval(syncInterval);
        };
    }, [isAutoSync, fetchData]);

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

    // Global OCO monitoring effect
    useEffect(() => {
        let intervalId;
        let isUnmounted = false;
        const fetchOrderPairStatuses = async (activeOnly = true) => {
            try {
                const pairsData = await getOrderPairs();
                if (isUnmounted) return;
                setOcoPairs(pairsData);
                // Only process active pairs for polling
                const pairsToProcess = activeOnly ? pairsData.filter(pair => pair.status !== 'completed') : pairsData;
                // Start with the existing status map to preserve completed pairs' statuses
                const statusMap = { ...ocoStatusMap };
                await Promise.all(pairsToProcess.map(async (pair) => {
                    if (pair.status !== 'completed') {
                        // Only fetch from Zerodha if not done and status is OPEN
                        const order1StatusLocal = pair.order1_details?.orderstatus?.toUpperCase();
                        const order2StatusLocal = pair.order2_details?.orderstatus?.toUpperCase();
                        const isOrder1Open = order1StatusLocal === 'OPEN';
                        const isOrder2Open = order2StatusLocal === 'OPEN';
                        const isOrder1Done = order1StatusLocal === 'COMPLETE' || order1StatusLocal === 'CANCELLED';
                        const isOrder2Done = order2StatusLocal === 'COMPLETE' || order2StatusLocal === 'CANCELLED';
                        let order1Status = order1StatusLocal;
                        let order2Status = order2StatusLocal;
                        let order1DetailsUpdated = false;
                        let order2DetailsUpdated = false;

                        // Only fetch order1 status if it's OPEN
                        if (isOrder1Open && pair.order1_id) {
                            try {
                                const resp1 = await getOrderById(pair.order1_id);
                                if (resp1.success && Array.isArray(resp1.data) && resp1.data.length > 0) {
                                    order1Status = resp1.data[resp1.data.length - 1].status?.toUpperCase();
                                    statusMap[pair.order1_id] = order1Status;
                                    if (order1Status !== order1StatusLocal) {
                                        order1DetailsUpdated = true;
                                    }
                                }
                            } catch (error) { console.log(error) }
                        } else {
                            statusMap[pair.order1_id] = order1StatusLocal;
                        }

                        // Skip order2 status check if it's WAITINGFORORDER1
                        if (pair.order2_id && pair.order2_id !== 'WAITINGFORORDER1') {
                            // Only fetch order2 status if it's OPEN
                            if (isOrder2Open && (pair.type !== 'OAO' || order1Status === 'COMPLETE')) {
                                try {
                                    const resp2 = await getOrderById(pair.order2_id);
                                    if (resp2.success && Array.isArray(resp2.data) && resp2.data.length > 0) {
                                        order2Status = resp2.data[resp2.data.length - 1].status?.toUpperCase();
                                        statusMap[pair.order2_id] = order2Status;
                                        if (order2Status !== order2StatusLocal) {
                                            order2DetailsUpdated = true;
                                        }
                                    }
                                } catch (error) { console.log(error) }
                            } else {
                                statusMap[pair.order2_id] = order2StatusLocal;
                            }
                        } else if (pair.order2_id === 'WAITINGFORORDER1') {
                            statusMap[pair.order2_id] = 'WAITINGFORORDER1';
                        }

                        // If status changed, update backend
                        if (order1DetailsUpdated || order2DetailsUpdated) {
                            const newOrder1Details = order1DetailsUpdated ? { ...pair.order1_details, orderstatus: order1Status } : pair.order1_details;
                            const newOrder2Details = order2DetailsUpdated ? { ...pair.order2_details, orderstatus: order2Status } : pair.order2_details;
                            await updateOrderPair(pair.id, { order1_details: newOrder1Details, order2_details: newOrder2Details });
                        }

                        if (pair.type === 'OAO') {
                            if (order1Status === 'CANCELLED') {
                                // Order 1 is cancelled, mark the pair as completed
                                await updateOrderPair(pair.id, { status: 'COMPLETED' });
                            } else if (order1Status === 'COMPLETE' && pair.order2_id === 'WAITINGFORORDER1') {
                                // Order 1 is complete, create Order 2 (only once)
                                try {
                                    const data = await placeOrder(pair.order2_details);
                                    if (data.success && data.order_id) {
                                        // PATCH backend with order2_id after first attempt
                                        await updateOrderPair(pair.id, { order2_id: data.order_id });
                                    } else {
                                        // PATCH backend with a special error status and order2_details
                                        await updateOrderPair(pair.id, {
                                            order2_id: 'FAILED',
                                            order2_details: {
                                                ...pair.order2_details,
                                                orderstatus: 'FAILED',
                                                error: data.error || 'Unknown error from Zerodha'
                                            }
                                        });
                                    }
                                } catch (error) {
                                    // PATCH backend with a special error status and order2_details
                                    await updateOrderPair(pair.id, {
                                        order2_id: 'FAILED',
                                        order2_details: {
                                            ...pair.order2_details,
                                            orderstatus: 'FAILED',
                                            error: error.message || 'Unknown error from Zerodha'
                                        }
                                    });
                                }
                            } else if (order1Status === 'COMPLETE' && order2Status === 'COMPLETE') {
                                // Both orders are complete
                                await updateOrderPair(pair.id, { status: 'COMPLETED' });
                            }
                        }

                        if (pair.type === 'OCO') {
                            const normStatus1 = (order1Status || '').toUpperCase();
                            const normStatus2 = (order2Status || '').toUpperCase();
                            const isOrder1Open = normStatus1 === 'OPEN';
                            const isOrder2Open = normStatus2 === 'OPEN';

                            // If one order is COMPLETE and the other is CANCELLED, mark as completed
                            if ((normStatus1 === 'COMPLETE' && normStatus2 === 'CANCELLED') ||
                                (normStatus1 === 'CANCELLED' && normStatus2 === 'COMPLETE')) {
                                await updateOrderPair(pair.id, { status: 'COMPLETED' });
                            }
                            // If neither order is OPEN, mark as completed (handles legacy/inconsistent pairs)
                            else if (!isOrder1Open && !isOrder2Open) {
                                await updateOrderPair(pair.id, { status: 'COMPLETED' });
                            }
                            // If one order is COMPLETE and other is OPEN, cancel the open order
                            else if (normStatus1 === 'COMPLETE' && isOrder2Open) {
                                await cancelZerodhaOrder(pair.order2_id);
                                const newOrder2Details = { ...pair.order2_details, orderstatus: 'CANCELLED' };
                                await updateOrderPair(pair.id, { status: 'COMPLETED', order2_details: newOrder2Details });
                            }
                            else if (normStatus2 === 'COMPLETE' && isOrder1Open) {
                                await cancelZerodhaOrder(pair.order1_id);
                                const newOrder1Details = { ...pair.order1_details, orderstatus: 'CANCELLED' };
                                await updateOrderPair(pair.id, { status: 'COMPLETED', order1_details: newOrder1Details });
                            }
                            // If both orders are COMPLETE, mark as completed
                            else if (normStatus1 === 'COMPLETE' && normStatus2 === 'COMPLETE') {
                                await updateOrderPair(pair.id, { status: 'COMPLETED' });
                            }
                            // If both orders are CANCELLED, mark as completed
                            else if (normStatus1.startsWith('CANCELLED') && normStatus2.startsWith('CANCELLED')) {
                                await updateOrderPair(pair.id, { status: 'COMPLETED' });
                            }
                        }
                    }
                }));
            } catch { /* intentionally empty */ }
        };
        if (sessionActive && isMarketHours()) {
            fetchOrderPairStatuses(true);
            intervalId = setInterval(() => fetchOrderPairStatuses(true), 15000);
        }
        return () => {
            isUnmounted = true;
            if (intervalId) clearInterval(intervalId);
        };
    }, [sessionActive, isMarketHours()]);

    // Manual refresh for OCO pairs (fetch all pairs, including completed)
    const refreshOcoPairs = useCallback(async () => {
        // Don't clear the status map to preserve completed pair statuses
        const pairsData = await getOrderPairs();
        setOcoPairs(pairsData);
        const statusMap = { ...ocoStatusMap }; // Start with existing statuses

        // Process all pairs to get their current status
        await Promise.all(pairsData.map(async (pair) => {
            const order1StatusLocal = pair.order1_details?.orderstatus?.toUpperCase();
            const order2StatusLocal = pair.order2_details?.orderstatus?.toUpperCase();
            const isOrder1Open = order1StatusLocal === 'OPEN';
            const isOrder2Open = order2StatusLocal === 'OPEN';

            // For order1, only fetch if it's OPEN
            if (isOrder1Open && pair.order1_id) {
                try {
                    const resp1 = await getOrderById(pair.order1_id);
                    if (resp1.success && Array.isArray(resp1.data) && resp1.data.length > 0) {
                        const status = resp1.data[resp1.data.length - 1].status?.toUpperCase();
                        statusMap[pair.order1_id] = status;
                    }
                } catch { /* intentionally empty */ }
            } else {
                statusMap[pair.order1_id] = order1StatusLocal;
            }

            // For order2, only fetch if it's OPEN and not WAITINGFORORDER1
            if (pair.order2_id && pair.order2_id !== 'WAITINGFORORDER1') {
                if (isOrder2Open) {
                    try {
                        const resp2 = await getOrderById(pair.order2_id);
                        if (resp2.success && Array.isArray(resp2.data) && resp2.data.length > 0) {
                            const status = resp2.data[resp2.data.length - 1].status?.toUpperCase();
                            statusMap[pair.order2_id] = status;
                        }
                    } catch { /* intentionally empty */ }
                } else {
                    statusMap[pair.order2_id] = order2StatusLocal;
                }
            } else if (pair.order2_id === 'WAITINGFORORDER1') {
                statusMap[pair.order2_id] = 'WAITINGFORORDER1';
            }
        }));
        setOcoStatusMap(statusMap);
    }, [ocoStatusMap]);

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
        fetchPositions,
        ltpMap,
        ocoPairs,
        ocoStatusMap,
        refreshOcoPairs
    };

    return (
        <ZerodhaContext.Provider value={value}>
            {children}
        </ZerodhaContext.Provider>
    );
}; 