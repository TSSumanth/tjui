import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getHoldings, getPositions, getOrders, getAccountInfo } from '../services/zerodha/api';
import { getOrderPairs, getActivePairs, updateOrderPair, getCompletedOrderPairs } from '../services/pairedorders/oco';
import { getOrderById, cancelZerodhaOrder, placeOrder } from '../services/zerodha/api';
import { updateAccountSummary, updateMutualFunds, updateEquityMargins } from '../services/accountSummary';
import { disconnectWebSocket, setWebSocketAccessToken } from '../services/zerodha/webhook';
import { isMarketHours, isTokenExpired } from '../services/zerodha/utils';

const ZerodhaContext = createContext();
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds
const FETCH_INTERVAL = 60000; // 60 seconds
const SESSION_CACHE_DURATION = 30000; // 30 seconds



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
    const [activeOrderPairs, setActiveOrderPairs] = useState([]);
    const [completedOrderPairs, setCompletedOrderPairs] = useState([]);
    const [orderPairStatusMap, setOrderPairStatusMap] = useState({});

    const isInitialLoadDone = useRef(false);
    const lastFetchTime = useRef(0);
    const retryCount = useRef(0);
    const isMounted = useRef(true);
    const isUnmounted = useRef(false);
    const sessionCheckTimeoutRef = useRef(null);
    const sessionCheckInterval = useRef(null);
    const lastSessionCheck = useRef(0);
    const sessionCheckPromise = useRef(null);

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

    // Check session status with caching and debouncing
    const checkSession = useCallback(async (force = false) => {
        if (!isMounted.current) return false;

        const now = Date.now();

        // If not forced and we've checked recently, return cached result
        if (!force && now - lastSessionCheck.current < SESSION_CACHE_DURATION) {
            return Boolean(sessionActive);
        }

        // If there's an ongoing check, return its promise
        if (sessionCheckPromise.current) {
            return sessionCheckPromise.current;
        }

        // Create new check promise
        sessionCheckPromise.current = (async () => {
            try {
                // Check if we have a valid token
                const token = localStorage.getItem('zerodha_access_token');
                const tokenTimestamp = localStorage.getItem('zerodha_token_timestamp');

                if (!token) {
                    if (isMounted.current) {
                        setSessionActive(false);
                        setIsAuth(false);
                        setLastChecked(now);
                    }
                    return false;
                }

                // Check if token is expired based on Zerodha's rules
                const isValid = !isTokenExpired(parseInt(tokenTimestamp));

                if (!isValid) {
                    // Token is expired, clean up
                    localStorage.removeItem('zerodha_access_token');
                    localStorage.removeItem('zerodha_public_token');
                    localStorage.removeItem('zerodha_token_timestamp');

                    // Disconnect websocket if needed
                    try {
                        await disconnectWebSocket();
                    } catch (error) {
                        console.error('Error disconnecting websocket:', error);
                    }

                    // Reset context state
                    if (isMounted.current) {
                        setSessionActive(false);
                        setIsAuth(false);
                        setLastChecked(now);
                        setAccountInfo(null);
                        setHoldings([]);
                        setPositions([]);
                        setOrders([]);
                        setError('Session expired. Please login again.');
                        setIsAutoSync(false);
                    }

                    // Redirect to login page
                    window.location.href = '/zerodha/login';
                    return false;
                }

                if (isMounted.current) {
                    setSessionActive(isValid);
                    setIsAuth(isValid);
                    setLastChecked(now);
                }
                return isValid;
            } catch (err) {
                console.error('Error checking session:', err);
                if (isMounted.current) {
                    setSessionActive(false);
                    setIsAuth(false);
                    setLastChecked(now);
                }
                return false;
            } finally {
                lastSessionCheck.current = now;
                sessionCheckPromise.current = null;
            }
        })();

        return sessionCheckPromise.current;
    }, [sessionActive]);

    // Fetch positions separately
    const fetchPositions = useCallback(async () => {
        console.log('fetchPositions');
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

    // Fetch positions separately
    const fetchHoldings = useCallback(async () => {
        console.log('fetchHoldings');
        if (!isMounted.current) return;
        try {
            setLoadingStates(prev => ({ ...prev, holdings: true }));
            const holdingsRes = await makeApiCallWithRetry(() => getHoldings(), 'Failed to fetch holdings');
            if (holdingsRes && isMounted.current) {
                setHoldings(holdingsRes.data || []);
            }
        } catch (err) {
            console.error('Error fetching holdings:', err);
        } finally {
            if (isMounted.current) {
                setLoadingStates(prev => ({ ...prev, holdings: false }));
            }
        }
    }, []);

    // Fetch data
    const fetchData = useCallback(async (force = false) => {
        if (!isMounted.current) return;
        console.log('fetchData: fetching holdings and Postions: force - ', force);
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

                // Set individual loading states
                setLoadingStates(prev => ({
                    holdings: true,
                    positions: true,
                    orders: false
                }));

                try {
                    await fetchHoldings();
                    await fetchPositions();
                } catch (err) {
                    console.error('Error fetching data:', err);
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
        isUnmounted.current = false;
        isInitialLoadDone.current = false; // Reset on mount

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
            isUnmounted.current = true;
            isInitialLoadDone.current = false; // Reset on unmount
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

    // Add these helper functions before fetchOrderPairStatuses
    const handleOcoPairStatus = async (pair, order1Status, order2Status, statusMap) => {
        try {
            const normStatus1 = (order1Status || '').toUpperCase();
            const normStatus2 = (order2Status || '').toUpperCase();
            const isOrder1Open = normStatus1 === 'OPEN';
            const isOrder2Open = normStatus2 === 'OPEN';

            // Case 1: One order complete, other cancelled
            if ((normStatus1 === 'COMPLETE' && normStatus2 === 'CANCELLED') ||
                (normStatus1 === 'CANCELLED' && normStatus2 === 'COMPLETE')) {
                await updateOrderPair(pair.id, { status: 'COMPLETED' });
                return true;
            }
            // Case 2: Neither order is open
            else if (!isOrder1Open && !isOrder2Open) {
                await updateOrderPair(pair.id, { status: 'COMPLETED' });
                return true;
            }
            // Case 3: Order1 complete, Order2 open
            else if (normStatus1 === 'COMPLETE' && isOrder2Open) {
                await cancelZerodhaOrder(pair.order2_id);
                const newOrder2Details = { ...pair.order2_details, orderstatus: 'CANCELLED' };
                await updateOrderPair(pair.id, {
                    status: 'COMPLETED',
                    order2_details: newOrder2Details
                });
                return true;
            }
            // Case 4: Order2 complete, Order1 open
            else if (normStatus2 === 'COMPLETE' && isOrder1Open) {
                await cancelZerodhaOrder(pair.order1_id);
                const newOrder1Details = { ...pair.order1_details, orderstatus: 'CANCELLED' };
                await updateOrderPair(pair.id, {
                    status: 'COMPLETED',
                    order1_details: newOrder1Details
                });
                return true;
            }
            // Case 5: Both orders complete
            else if (normStatus1 === 'COMPLETE' && normStatus2 === 'COMPLETE') {
                await updateOrderPair(pair.id, { status: 'COMPLETED' });
                return true;
            }
            // Case 6: Both orders cancelled
            else if (normStatus1.startsWith('CANCELLED') && normStatus2.startsWith('CANCELLED')) {
                await updateOrderPair(pair.id, { status: 'COMPLETED' });
                return true;
            }
            return false;
        } catch (error) {
            console.error(`Error handling OCO pair ${pair.id}:`, error);
            throw error; // Propagate error for proper handling
        }
    };

    const handleOaoPairStatus = async (pair, order1Status, order2Status) => {
        try {
            // Case 1: Order1 cancelled
            if (order1Status === 'CANCELLED') {
                await updateOrderPair(pair.id, { status: 'COMPLETED' });
                return true;
            }
            // Case 2: Order1 complete and Order2 waiting
            else if (order1Status === 'COMPLETE' && pair.order2_id === 'WAITINGFORORDER1') {
                try {
                    const data = await placeOrder(pair.order2_details);
                    if (data.success && data.order_id) {
                        await updateOrderPair(pair.id, { order2_id: data.order_id });
                    } else {
                        await updateOrderPair(pair.id, {
                            order2_id: 'FAILED',
                            order2_details: {
                                ...pair.order2_details,
                                orderstatus: 'FAILED',
                                error: data.error || 'Unknown error from Zerodha'
                            }
                        });
                    }
                    return true;
                } catch (error) {
                    await updateOrderPair(pair.id, {
                        order2_id: 'FAILED',
                        order2_details: {
                            ...pair.order2_details,
                            orderstatus: 'FAILED',
                            error: error.message || 'Unknown error from Zerodha'
                        }
                    });
                    throw error; // Propagate error for proper handling
                }
            }
            // Case 3: Both orders complete
            else if (order1Status === 'COMPLETE' && order2Status === 'COMPLETE') {
                await updateOrderPair(pair.id, { status: 'COMPLETED' });
                return true;
            }
            return false;
        } catch (error) {
            console.error(`Error handling OAO pair ${pair.id}:`, error);
            throw error; // Propagate error for proper handling
        }
    };

    // Global Order Pair monitoring effect
    useEffect(() => {
        let intervalId;
        const fetchOrderPairStatuses = async () => {
            try {
                const pairsData = await getOrderPairs('active');
                if (isUnmounted.current) return;
                setActiveOrderPairs(pairsData);

                const statusMap = { ...orderPairStatusMap };
                const errors = [];

                await Promise.all(pairsData.map(async (pair) => {
                    if (pair.status === 'completed') return;

                    try {
                        // Get local statuses
                        const order1StatusLocal = pair.order1_details?.orderstatus?.toUpperCase();
                        const order2StatusLocal = pair.order2_details?.orderstatus?.toUpperCase();
                        const isOrder1Open = order1StatusLocal === 'OPEN';
                        const isOrder2Open = order2StatusLocal === 'OPEN';

                        let order1Status = order1StatusLocal;
                        let order2Status = order2StatusLocal;
                        let order1DetailsUpdated = false;
                        let order2DetailsUpdated = false;

                        // Fetch order1 status if OPEN
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
                            } catch (error) {
                                console.error(`Error fetching order1 status for pair ${pair.id}:`, error);
                                errors.push({ pairId: pair.id, orderId: pair.order1_id, error });
                            }
                        } else {
                            statusMap[pair.order1_id] = order1StatusLocal;
                        }

                        // Handle order2 status
                        if (pair.order2_id && pair.order2_id !== 'WAITINGFORORDER1') {
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
                                } catch (error) {
                                    console.error(`Error fetching order2 status for pair ${pair.id}:`, error);
                                    errors.push({ pairId: pair.id, orderId: pair.order2_id, error });
                                }
                            } else {
                                statusMap[pair.order2_id] = order2StatusLocal;
                            }
                        } else if (pair.order2_id === 'WAITINGFORORDER1') {
                            statusMap[pair.order2_id] = 'WAITINGFORORDER1';
                        }

                        // Update backend if status changed
                        if (order1DetailsUpdated || order2DetailsUpdated) {
                            const newOrder1Details = order1DetailsUpdated ?
                                { ...pair.order1_details, orderstatus: order1Status } : pair.order1_details;
                            const newOrder2Details = order2DetailsUpdated ?
                                { ...pair.order2_details, orderstatus: order2Status } : pair.order2_details;
                            await updateOrderPair(pair.id, {
                                order1_details: newOrder1Details,
                                order2_details: newOrder2Details
                            });
                        }

                        // Handle pair type specific logic
                        if (pair.type === 'OCO') {
                            await handleOcoPairStatus(pair, order1Status, order2Status, statusMap);
                        } else if (pair.type === 'OAO') {
                            await handleOaoPairStatus(pair, order1Status, order2Status);
                        }
                    } catch (error) {
                        console.error(`Error processing pair ${pair.id}:`, error);
                        errors.push({ pairId: pair.id, error });
                    }
                }));

                // Log any errors that occurred during processing
                if (errors.length > 0) {
                    console.error('Errors occurred while processing order pairs:', errors);
                }

                setOrderPairStatusMap(statusMap);
            } catch (error) {
                console.error('Error in fetchOrderPairStatuses:', error);
                setError('Failed to fetch order pair statuses. Please try again.');
            }
        };

        if (sessionActive && isMarketHours()) {
            fetchOrderPairStatuses();
            intervalId = setInterval(fetchOrderPairStatuses, 15000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [sessionActive, isMarketHours()]);

    // Load completed orders only once on mount
    useEffect(() => {
        const loadCompletedOrders = async () => {
            if (isInitialLoadDone.current) return;
            try {
                const completedPairs = await getCompletedOrderPairs();
                setCompletedOrderPairs(completedPairs);
                isInitialLoadDone.current = true;
            } catch (error) {
                console.error('Error loading completed orders:', error);
            }
        };
        loadCompletedOrders();
    }, []);

    // Manual refresh for OCO pairs
    const refreshActiveOrderPairs = useCallback(async () => {
        const pairsData = await getActivePairs();
        setActiveOrderPairs(pairsData);
        const statusMap = { ...orderPairStatusMap };
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
        setOrderPairStatusMap(statusMap);
    }, [orderPairStatusMap]);

    // Function to refresh completed orders
    const refreshCompletedOrders = useCallback(async () => {
        const completedPairs = await getCompletedOrderPairs();
        setCompletedOrderPairs(completedPairs);
    }, []);

    const handleLogout = useCallback(async () => {
        try {
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

            // Clear tokens and redirect
            localStorage.removeItem('zerodha_access_token');
            localStorage.removeItem('zerodha_public_token');

            // Disconnect websocket if needed
            try {
                await disconnectWebSocket();
            } catch (error) {
                console.error('Error disconnecting websocket:', error);
            }

            // Redirect to login page
            window.location.href = '/zerodha/login';
        } catch (err) {
            console.error('Error during logout:', err);
            if (isMounted.current) {
                setError(err.message);
            }
        }
    }, []);

    const handleUpdateAccountDetails = async () => {
        try {
            const res = await makeApiCallWithRetry(() => getAccountInfo(), 'Failed to get Account Info');
            console.log('Account Info:', res);
            if (!res.success) {
                console.error('Failed to get Account Info after login, please login again');
                return false;
            }
            await updateAccountSummary(res.data.clientId, res.data.name, res.data.email);
            await updateEquityMargins(res.data.clientId, res.data.margins.equity);
            await updateMutualFunds(res.data.clientId, res.data.mutualFunds);
            return true;
        } catch (error) {
            console.error('Error updating account details:', error);
            return false;
        }
    }

    const handleLoginSuccess = (async (data) => {
        if (data.access_token && data.public_token) {
            // Set tokens in localStorage
            localStorage.setItem('zerodha_access_token', data.access_token);
            localStorage.setItem('zerodha_public_token', data.public_token);
            localStorage.setItem('zerodha_token_timestamp', Date.now().toString());
            setWebSocketAccessToken(data.access_token, data.public_token);
            // Update account details
            let res = await handleUpdateAccountDetails();
            if (!res) {
                console.error('Failed to update account details, please try again');
                return false;
            } else {
                console.log('Account details updated successfully');
                // Update context state
                setSessionActive(true);
                setIsAuth(true);
                setLastChecked(Date.now());

                // Navigate to account page
                window.location.href = '/zerodha/account';
            }

            // Clear any existing intervals
            if (sessionCheckInterval.current) {
                clearInterval(sessionCheckInterval.current);
                sessionCheckInterval.current = null;
            }
        }
    });

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
        handleLoginSuccess,
        isAutoSync,
        setIsAutoSync,
        holdings,
        positions,
        orders,
        fetchPositions,
        ltpMap,
        activeOrderPairs,
        completedOrderPairs,
        orderPairStatusMap,
        refreshActiveOrderPairs,
        refreshCompletedOrders
    };

    return (
        <ZerodhaContext.Provider value={value}>
            {children}
        </ZerodhaContext.Provider>
    );
}; 