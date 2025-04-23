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
    const [isAuth, setIsAuth] = useState(false);
    const [sessionActive, setSessionActive] = useState(false);
    const [accountInfo, setAccountInfo] = useState(null);
    const [lastChecked, setLastChecked] = useState(0);
    const [loading, setLoading] = useState(false);
    const [holdings, setHoldings] = useState([]);
    const [positions, setPositions] = useState([]);
    const [orders, setOrders] = useState([]);
    const [isAutoSync, setIsAutoSync] = useState(false);

    const checkSession = useCallback(async (forceCheck = false) => {
        const now = Date.now();
        // Only check if more than 2 seconds have passed since last check or if force check
        if (!forceCheck && now - lastChecked < 2000) {
            return;
        }

        try {
            setLoading(true);
            const response = await getAccountInfo();
            if (response.success) {
                setAccountInfo(response.data);
                setSessionActive(true);
                setIsAuth(true);
            } else {
                setSessionActive(false);
                setAccountInfo(null);
                if (!isAuth) {
                    setIsAuth(false);
                }
            }
            setLastChecked(now);
        } catch (err) {
            console.error('Error checking session:', err);
            setSessionActive(false);
            setAccountInfo(null);
        } finally {
            setLoading(false);
        }
    }, [isAuth, lastChecked]);

    const fetchData = useCallback(async () => {
        if (!isAuth || !sessionActive) {
            return;
        }

        try {
            setLoading(true);
            const [accountResponse, holdingsResponse, positionsResponse, ordersResponse] = await Promise.all([
                getAccountInfo(),
                getHoldings(),
                getPositions(),
                getOrders()
            ]);

            if (accountResponse.success) {
                setAccountInfo(accountResponse.data);
            }

            setHoldings(holdingsResponse.data || []);
            setPositions(positionsResponse.data || []);
            setOrders(ordersResponse.data || []);
        } catch (err) {
            console.error('Error fetching data:', err);
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
        } catch (err) {
            console.error('Error during logout:', err);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('zerodha_access_token');
        if (token) {
            setIsAuth(true);
            checkSession(true);
        }
    }, []);

    // Effect for auto-sync during market hours
    useEffect(() => {
        let interval;
        let isInitialLoad = true;

        const checkAndFetch = async () => {
            if (!isAuth) return;

            // Only check session if it's been more than 5 minutes or it's initial load
            const now = Date.now();
            const timeSinceLastCheck = now - lastChecked;
            const shouldCheckSession = isInitialLoad || timeSinceLastCheck >= 300000;

            let isSessionValid = sessionActive;
            if (shouldCheckSession) {
                isSessionValid = await checkSession();
            }

            if (!isSessionValid) return;

            const isMarketOpen = isMarketHours();

            if (isInitialLoad) {
                await fetchData();
                isInitialLoad = false;
                setIsAutoSync(isMarketOpen);
            } else if (isAutoSync && isMarketOpen) {
                await fetchData();
            } else {
                setIsAutoSync(false);
            }
        };

        if (isAuth) {
            checkAndFetch();
            interval = setInterval(() => {
                const isMarketOpen = isMarketHours();
                if (!isMarketOpen) {
                    setIsAutoSync(false);
                    return;
                }
                if (isAutoSync) {
                    checkAndFetch();
                }
            }, 60000);
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isAuth, fetchData, checkSession, isAutoSync, sessionActive, lastChecked]);

    const value = {
        isAuth,
        sessionActive,
        accountInfo,
        loading,
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