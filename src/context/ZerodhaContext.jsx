import React, { createContext, useContext, useState, useEffect } from 'react';
import { getPositions, getHoldings } from '../services/zerodha/api';
import { getAccessToken } from '../services/zerodha/authentication';

const ZerodhaContext = createContext();

export const useZerodha = () => {
    const context = useContext(ZerodhaContext);
    if (!context) {
        throw new Error('useZerodha must be used within a ZerodhaProvider');
    }
    return context;
};

export const ZerodhaProvider = ({ children }) => {
    const [positions, setPositions] = useState([]);
    const [holdings, setHoldings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pnl, setPnL] = useState({
        dayPnL: 0,
        overallPnL: 0
    });

    const calculatePnL = (positionsData, holdingsData) => {
        console.log('Calculating P&L with:', { positionsData, holdingsData }); // Debug log

        let dayPnL = 0;
        let overallPnL = 0;

        // Calculate positions P&L
        positionsData.forEach(position => {
            // For day's P&L, use day_m2m directly from the API
            const dayPnlValue = Number(position.day_m2m) || 0;

            // For overall P&L, use pnl directly from the API
            const pnlValue = Number(position.pnl) || 0;

            dayPnL += dayPnlValue;
            overallPnL += pnlValue;

            console.log('Position P&L:', {
                symbol: position.tradingsymbol,
                pnl: pnlValue,
                dayPnl: dayPnlValue
            });
        });

        // Calculate holdings P&L
        holdingsData.forEach(holding => {
            // For holdings, use day_change for day's P&L
            const dayChange = Number(holding.day_change) || 0;
            // For overall P&L, use pnl directly from the API
            const totalChange = Number(holding.pnl) || 0;

            dayPnL += dayChange;
            overallPnL += totalChange;

            console.log('Holding P&L:', {
                symbol: holding.tradingsymbol,
                dayChange,
                totalChange
            });
        });

        console.log('Final P&L:', { dayPnL, overallPnL }); // Debug log
        return { dayPnL, overallPnL };
    };

    const fetchData = async () => {
        try {
            const accessToken = getAccessToken();
            if (!accessToken) {
                setError('Please log in to view data');
                setLoading(false);
                return;
            }

            console.log('Fetching Zerodha data...'); // Debug log
            const [positionsResponse, holdingsResponse] = await Promise.all([
                getPositions(),
                getHoldings()
            ]);

            // Process positions
            const positionsData = positionsResponse?.data?.data || [];
            console.log('Positions data:', positionsData); // Debug log
            setPositions(positionsData);

            // Process holdings
            const holdingsData = holdingsResponse?.data?.data || [];
            console.log('Holdings data:', holdingsData); // Debug log
            setHoldings(holdingsData);

            // Calculate and set P&L
            const pnlData = calculatePnL(positionsData, holdingsData);
            setPnL(pnlData);

            setLoading(false);
            setError(null);
        } catch (err) {
            console.error('Error fetching Zerodha data:', err);
            setError('Failed to fetch data');
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log('ZerodhaProvider mounted, fetching initial data...'); // Debug log
        fetchData();
        const interval = setInterval(fetchData, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, []);

    const value = {
        positions,
        holdings,
        loading,
        error,
        pnl,
        refreshData: fetchData
    };

    return (
        <ZerodhaContext.Provider value={value}>
            {children}
        </ZerodhaContext.Provider>
    );
}; 