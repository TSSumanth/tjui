import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Container, Stack, Grid, Button, Tooltip, Paper, useTheme, alpha, CircularProgress, Snackbar, Alert } from '@mui/material';
import { useZerodha } from '../context/ZerodhaContext';
import { getAccountInfo, getPositions, getHoldings, getInstruments } from '../services/zerodha/api';
import Holdings from '../components/zerodha/Holdings';
import Positions from '../components/zerodha/Positions';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import useScrollToTop from '../hooks/useScrollToTop';
import { Link } from 'react-router-dom';
import LinkIcon from '@mui/icons-material/Link';
import ZerodhaSubHeader from '../components/zerodha/ZerodhaSubHeader';
import { getPortfolioValue, createPortfolioValue, updatePortfolioValue } from '../services/portfolioValue';
import { isMarketHours } from '../services/zerodha/utils';

const formatCurrency = (value) => {
    if (typeof value !== 'number' || isNaN(value)) {
        return '₹0.00';
    }
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value).replace('₹', '₹');
};

const getPositionType = (tradingsymbol) => {
    if (!tradingsymbol) return 'Stock';
    const symbol = tradingsymbol.toUpperCase();
    if (symbol.endsWith('FUT')) {
        return 'Future';
    } else if (symbol.endsWith('CE') || symbol.endsWith('PE')) {
        return 'Option';
    }
    return 'Stock';
};

const Portfolio = () => {
    const theme = useTheme();
    const { loading, isAuth, sessionActive, checkSession } = useZerodha();
    const [holdings, setHoldings] = useState([]);
    const [positions, setPositions] = useState({ net: [] });
    const [localLoading, setLocalLoading] = useState(true);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
    const [hasShownSessionError, setHasShownSessionError] = useState(false);
    const [portfolioSummary, setPortfolioSummary] = useState({
        holdingsPnL: 0,
        holdingsDayPnL: 0,
        positionsTotalPnL: 0,
        positionsDayPnL: 0,
        activePositionsCount: 0,
        totalPnL: 0,
        totalDayPnL: 0,
        positionsTotalValue: 0,
        totalEquityHoldingsValue: 0,
        longOptionsNotional: 0,
        shortOptionsPnL: 0,
        futuresPnL: 0
    });
    const pollIntervalRef = useRef(null);
    const [positionDetails, setPositionDetails] = useState({});
    const [isDetailsLoading, setIsDetailsLoading] = useState(true);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Scroll to top when component mounts
    useScrollToTop();

    const calculatePortfolioSummary = (holdingsData, positionsData) => {
        if (!holdingsData || !positionsData) {
            console.log('No data available for calculation:', { holdingsData, positionsData });
            return;
        }

        console.log('Calculating portfolio summary with:', { holdingsData, positionsData });

        // Process positions data
        const processedPositions = positionsData.net || [];
        const uniquePositions = processedPositions.filter((position, index, self) =>
            index === self.findIndex((p) => p.tradingsymbol === position.tradingsymbol)
        );

        console.log('Processed positions:', uniquePositions);

        // Calculate positions P&L
        let positionsTotalPnL = 0;
        let positionsDayPnL = 0;
        let activePositionsCount = 0;
        let positionsTotalValue = 0;
        let longOptionsNotional = 0;
        let shortOptionsPnL = 0;
        let futuresPnL = 0;

        uniquePositions.forEach((position) => {
            const posType = getPositionType(position.tradingsymbol);
            if (posType === 'Future' || posType === 'Option') {
                if (position.quantity !== 0) {
                    activePositionsCount++;
                }
                positionsTotalPnL += Number(position.pnl) || 0;
                positionsDayPnL += Number(position.m2m) || 0;

                if (posType === 'Option' && position.quantity > 0) {
                    const notionalValue = Number(position.quantity) * Number(position.last_price || 0);
                    longOptionsNotional += notionalValue;
                    positionsTotalValue += notionalValue;
                } else if (posType === 'Option' && position.quantity < 0) {
                    const pnl = Number(position.pnl) || 0;
                    shortOptionsPnL += pnl;
                    positionsTotalValue += pnl;
                } else if (posType === 'Future') {
                    const pnl = Number(position.pnl) || 0;
                    futuresPnL += pnl;
                    positionsTotalValue += pnl;
                }
            }
        });

        console.log('Positions calculations:', {
            positionsTotalPnL,
            positionsDayPnL,
            activePositionsCount,
            positionsTotalValue,
            longOptionsNotional,
            shortOptionsPnL,
            futuresPnL
        });

        // Calculate holdings P&L
        let holdingsPnL = 0;
        let holdingsDayPnL = 0;
        let totalEquityHoldingsValue = 0;

        holdingsData.forEach(holding => {
            const quantity = Number(holding.quantity) || 0;
            const lastPrice = Number(holding.last_price) || 0;
            const closePrice = Number(holding.close_price) || lastPrice;
            const avgPrice = Number(holding.average_price) || 0;

            const dayPnL = (lastPrice - closePrice) * quantity;
            const totalPnL = (lastPrice - avgPrice) * quantity;
            const value = quantity * lastPrice;

            holdingsDayPnL += dayPnL;
            holdingsPnL += totalPnL;
            totalEquityHoldingsValue += value;
        });

        console.log('Holdings calculations:', {
            holdingsPnL,
            holdingsDayPnL,
            totalEquityHoldingsValue
        });

        // Calculate total portfolio P&L
        const totalPnL = holdingsPnL + positionsTotalPnL;
        const totalDayPnL = holdingsDayPnL + positionsDayPnL;

        const summary = {
            holdingsPnL,
            holdingsDayPnL,
            positionsTotalPnL,
            positionsDayPnL,
            activePositionsCount,
            totalPnL,
            totalDayPnL,
            positionsTotalValue,
            totalEquityHoldingsValue,
            longOptionsNotional,
            shortOptionsPnL,
            futuresPnL
        };

        console.log('Final portfolio summary:', summary);
        setPortfolioSummary(summary);
    };

    // Helper function to get missing symbols
    const getMissingSymbols = (positionsData) => {
        if (!positionsData || !positionsData.net || !Array.isArray(positionsData.net)) {
            return [];
        }

        const allPositions = [...(positionsData.net || []), ...(positionsData.day || [])];
        const uniqueSymbols = [...new Set(allPositions.map(p => p.tradingsymbol))];
        return uniqueSymbols.filter(symbol => !positionDetails[symbol]);
    };

    // Add function to fetch instrument details
    const fetchPositionDetails = async (positionsData, log = "From Portfolio Page") => {
        try {
            const missingSymbols = getMissingSymbols(positionsData);
            if (missingSymbols.length === 0) {
                setIsDetailsLoading(false);
                return;
            }

            const newPositionDetails = {};
            let hasAllDetails = true;
            let retryCount = 0;
            const maxRetries = 3;

            for (const symbol of missingSymbols) {
                let success = false;
                while (!success && retryCount < maxRetries) {
                    try {
                        const response = await getInstruments({
                            search: symbol,
                            log: log
                        });

                        if (response && response.data) {
                            newPositionDetails[symbol] = response.data;
                            success = true;
                        } else {
                            console.warn(`No data received for ${symbol}, attempt ${retryCount + 1}`);
                            retryCount++;
                            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
                        }
                    } catch (error) {
                        console.error(`Error fetching details for ${symbol}, attempt ${retryCount + 1}:`, error);
                        retryCount++;
                        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
                    }
                }

                if (!success) {
                    console.error(`Failed to fetch details for ${symbol} after ${maxRetries} attempts`);
                    hasAllDetails = false;
                }
            }

            // Even if we don't have all details, update with what we have
            setPositionDetails(prevDetails => ({
                ...prevDetails,
                ...newPositionDetails
            }));

            // Set loading to false and show notification if we couldn't fetch all details
            if (!hasAllDetails) {
                setNotification({
                    open: true,
                    message: 'Some instrument details could not be fetched. Please try refreshing.',
                    severity: 'warning'
                });
            }

            // Only set loading to false if we have at least some details
            if (Object.keys(newPositionDetails).length > 0) {
                setIsDetailsLoading(false);
            } else {
                console.warn('No position details were fetched successfully');
                setIsDetailsLoading(false); // Still set to false to prevent infinite loading
            }
        } catch (error) {
            console.error('Error in fetchPositionDetails:', error);
            setIsDetailsLoading(false);
            setNotification({
                open: true,
                message: 'Error fetching instrument details. Please try refreshing.',
                severity: 'error'
            });
        }
    };

    // Update polling to fetch instrument details
    const startPolling = async () => {
        // Clear any existing interval first
        if (window.portfolioPollingInterval) {
            console.log('Clearing existing polling interval');
            clearInterval(window.portfolioPollingInterval);
            window.portfolioPollingInterval = null;
        }

        const poll = async () => {
            // Only poll during market hours
            if (!isMarketHours()) {
                if (window.portfolioPollingInterval) {
                    console.log('Stopping polling - market closed');
                    clearInterval(window.portfolioPollingInterval);
                    window.portfolioPollingInterval = null;
                }
                return;
            }

            try {
                console.log('Polling positions and holdings...');
                // Fetch both positions and holdings
                const [positionsRes, holdingsRes] = await Promise.all([
                    getPositions(),
                    getHoldings()
                ]);

                if (positionsRes?.data) {
                    setPositions(positionsRes.data);

                    // Only fetch instrument details if we have missing symbols
                    const missingSymbols = getMissingSymbols(positionsRes.data);
                    if (missingSymbols.length > 0) {
                        await fetchPositionDetails(positionsRes.data, "1");
                    }
                }

                if (holdingsRes?.data) {
                    setHoldings(holdingsRes.data);
                }

                // Update portfolio summary with new data
                if (positionsRes?.data || holdingsRes?.data) {
                    calculatePortfolioSummary(
                        holdingsRes?.data || holdings,
                        positionsRes?.data || positions
                    );
                }
            } catch (error) {
                console.error('Error polling data:', error);
            }
        };

        // Initial poll
        await poll();

        // Set up interval for subsequent polls - now every 30 seconds
        console.log('Starting new polling interval');
        window.portfolioPollingInterval = setInterval(poll, 30000);
    };

    // Monitor market hours
    useEffect(() => {
        console.log('Setting up market hours monitoring');

        const checkAndUpdatePolling = () => {
            if (isMarketHours()) {
                if (!window.portfolioPollingInterval) {
                    console.log('Market open, starting polling');
                    startPolling();
                }
            } else {
                if (window.portfolioPollingInterval) {
                    console.log('Market closed, stopping polling');
                    clearInterval(window.portfolioPollingInterval);
                    window.portfolioPollingInterval = null;
                }
            }
        };

        // Check immediately
        checkAndUpdatePolling();

        // Set up interval to check market hours
        const checkInterval = setInterval(checkAndUpdatePolling, 30000);

        return () => {
            console.log('Cleaning up market hours monitoring');
            clearInterval(checkInterval);
            if (window.portfolioPollingInterval) {
                console.log('Clearing polling interval on cleanup');
                clearInterval(window.portfolioPollingInterval);
                window.portfolioPollingInterval = null;
            }
        };
    }, []);

    // Initialize data and start polling
    useEffect(() => {
        console.log('Initializing Portfolio component');

        const initialize = async () => {
            try {
                setLocalLoading(true);
                const isSessionValid = await checkSession();
                console.log('Session validation result:', isSessionValid);

                if (!isSessionValid) {
                    console.log('Session is not valid');
                    setHoldings([]);
                    setPositions({ net: [] });
                    setPositionDetails({});
                    // Reset summary to initial state without calculating
                    setPortfolioSummary({
                        holdingsPnL: 0,
                        holdingsDayPnL: 0,
                        positionsTotalPnL: 0,
                        positionsDayPnL: 0,
                        activePositionsCount: 0,
                        totalPnL: 0,
                        totalDayPnL: 0,
                        positionsTotalValue: 0,
                        totalEquityHoldingsValue: 0,
                        longOptionsNotional: 0,
                        shortOptionsPnL: 0,
                        futuresPnL: 0
                    });

                    setNotification({
                        open: true,
                        message: 'Session expired. Please refresh the page or reconnect.',
                        severity: 'error'
                    });
                    setHasShownSessionError(true);
                    setLocalLoading(false);
                    setIsInitialLoad(false);
                    return;
                }

                console.log('Session is valid, fetching data...');
                setHasShownSessionError(false);

                const [holdingsRes, positionsRes] = await Promise.all([
                    getHoldings(),
                    getPositions()
                ]);

                if (holdingsRes?.data) {
                    setHoldings(holdingsRes.data);
                }
                if (positionsRes?.data) {
                    setPositions(positionsRes.data);
                    // Fetch instrument details only during initial load
                    await fetchPositionDetails(positionsRes.data, "3");
                }

                if (holdingsRes?.data || positionsRes?.data) {
                    calculatePortfolioSummary(
                        holdingsRes?.data || [],
                        positionsRes?.data || { net: [] }
                    );
                }

                if (isMarketHours()) {
                    await startPolling();
                }
            } catch (err) {
                console.error('Error initializing data:', err);
                setNotification({
                    open: true,
                    message: 'Failed to fetch portfolio data. Please try again.',
                    severity: 'error'
                });
                setHoldings([]);
                setPositions({ net: [] });
                setPositionDetails({});
                setPortfolioSummary({
                    holdingsPnL: 0,
                    holdingsDayPnL: 0,
                    positionsTotalPnL: 0,
                    positionsDayPnL: 0,
                    activePositionsCount: 0,
                    totalPnL: 0,
                    totalDayPnL: 0,
                    positionsTotalValue: 0,
                    totalEquityHoldingsValue: 0,
                    longOptionsNotional: 0,
                    shortOptionsPnL: 0,
                    futuresPnL: 0
                });
            } finally {
                setLocalLoading(false);
                setIsInitialLoad(false);
            }
        };
        initialize();

        return () => {
            console.log('Cleaning up Portfolio component');
            if (window.portfolioPollingInterval) {
                console.log('Clearing polling interval on component cleanup');
                clearInterval(window.portfolioPollingInterval);
                window.portfolioPollingInterval = null;
            }
        };
    }, []);

    const handleCloseNotification = () => {
        setNotification(prev => ({ ...prev, open: false }));
    };

    // Manual refresh handler for portfolio value
    const handlePortfolioValueRefresh = async () => {
        console.log('handlePortfolioValueRefresh');
        let accountInfo = await getAccountInfo();
        if (
            accountInfo.data &&
            accountInfo.data.clientId &&
            accountInfo.data.name &&
            accountInfo.data.margins?.equity?.net !== undefined &&
            portfolioSummary.totalEquityHoldingsValue !== undefined &&
            portfolioSummary.positionsTotalValue !== undefined
        ) {
            const equity_account_balance = Number(accountInfo.data.margins.equity.net) || 0;
            const equity_holdings_value = Number(portfolioSummary.totalEquityHoldingsValue) || 0;
            const equity_positions_value = Number(portfolioSummary.positionsTotalValue) || 0;
            const total_account_value = equity_account_balance + equity_holdings_value + equity_positions_value;

            try {
                const res = await getPortfolioValue({ account_id: accountInfo.data.clientId });
                if (res.success && res.data) {
                    await updatePortfolioValue({
                        id: res.data.id,
                        account_id: accountInfo.data.clientId,
                        account_member_name: accountInfo.data.name,
                        equity_account_balance,
                        equity_holdings_value,
                        equity_positions_value,
                        total_account_value
                    });
                    setNotification({
                        open: true,
                        message: 'Portfolio value updated successfully',
                        severity: 'success'
                    });
                } else {
                    await createPortfolioValue({
                        account_member_name: accountInfo.data.name,
                        account_id: accountInfo.data.clientId,
                        equity_account_balance,
                        equity_holdings_value,
                        equity_positions_value,
                        total_account_value
                    });
                    setNotification({
                        open: true,
                        message: 'New portfolio value created successfully',
                        severity: 'success'
                    });
                }
            } catch (err) {
                console.error('Error updating portfolio value:', err);
                setNotification({
                    open: true,
                    message: 'Failed to update portfolio value. Please try again.',
                    severity: 'error'
                });
            }
        } else {
            setNotification({
                open: true,
                message: 'Unable to update portfolio value. Missing required data.',
                severity: 'error'
            });
        }
    };

    // Show loading state while initializing
    if (isInitialLoad || localLoading || loading) {
        return (
            <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
                <ZerodhaSubHeader />
                <Container maxWidth="lg">
                    <Box sx={{
                        mt: 8,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'column',
                        gap: 2
                    }}>
                        <CircularProgress />
                        <Typography variant="body1" color="text.secondary">
                            Loading portfolio data...
                        </Typography>
                    </Box>
                </Container>
            </Box>
        );
    }

    // Show connect screen if not authenticated or session inactive
    if (!isAuth || !sessionActive) {
        return (
            <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
                <ZerodhaSubHeader />
                <Container maxWidth="md" sx={{ mt: 8 }}>
                    <Paper sx={{
                        p: 4,
                        textAlign: 'center',
                        borderRadius: 2,
                        boxShadow: theme.shadows[2],
                        background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.primary.main, 0.1)})`
                    }}>
                        <AccountBalanceIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                        <Typography variant="h5" gutterBottom>
                            Please authenticate with Zerodha
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                            Connect your Zerodha account to view your portfolio and trading information
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            startIcon={<LinkIcon />}
                            component={Link}
                            to="/zerodha/account"
                        >
                            Connect to Zerodha
                        </Button>
                    </Paper>
                </Container>
            </Box>
        );
    }

    // Show portfolio when authenticated and session is active
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
            <ZerodhaSubHeader />
            <Container maxWidth={false} sx={{ mt: 4, px: { xs: 2, sm: 3, md: 4 } }}>
                {/* Auto-sync status and refresh buttons */}
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    mb: 3,
                    gap: 2,
                    alignItems: 'center'
                }}>
                    <Typography
                        variant="body2"
                        color={isMarketHours() ? "success.main" : "text.secondary"}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            fontStyle: 'italic'
                        }}
                    >
                        <InfoIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
                        {isMarketHours()
                            ? "Auto-syncing every 5 seconds during market hours"
                            : "Auto-sync paused (outside market hours)"
                        }
                    </Typography>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={startPolling}
                        disabled={loading}
                        size="small"
                        sx={{
                            borderRadius: 1.5,
                            textTransform: 'none',
                            px: 1.5,
                            py: 0.5
                        }}
                    >
                        {loading ? 'Refreshing...' : 'Refresh Data'}
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<AccountBalanceIcon />}
                        onClick={handlePortfolioValueRefresh}
                        size="small"
                        sx={{
                            borderRadius: 1.5,
                            textTransform: 'none',
                            px: 1.5,
                            py: 0.5
                        }}
                    >
                        Update Portfolio Value
                    </Button>
                </Box>

                {/* Cards Grid */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{
                            p: 2,
                            height: '100%',
                            borderRadius: 2,
                            boxShadow: theme.shadows[2],
                            background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.02)}, ${alpha(theme.palette.success.main, 0.05)})`,
                            border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                            transition: 'transform 0.2s ease-in-out',
                            '&:hover': {
                                transform: 'translateY(-2px)'
                            }
                        }}>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    mb: 1
                                }}>
                                    Equity Holdings
                                    <Tooltip title="Your long-term equity investments">
                                        <InfoIcon fontSize="small" sx={{ ml: 0.5, fontSize: '0.875rem', color: 'text.secondary' }} />
                                    </Tooltip>
                                </Typography>
                                <Typography variant="h6" sx={{
                                    color: 'text.primary',
                                    fontWeight: 600,
                                    mb: 1.5
                                }}>
                                    {holdings?.length || 0} Stocks
                                </Typography>
                                <Stack direction="row" spacing={2}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Total Value
                                        </Typography>
                                        <Typography variant="body1" sx={{
                                            color: 'primary.main',
                                            fontWeight: 500,
                                            fontFamily: 'monospace'
                                        }}>
                                            {formatCurrency(portfolioSummary.totalEquityHoldingsValue)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Today's Change
                                        </Typography>
                                        <Typography variant="body1" sx={{
                                            color: portfolioSummary.holdingsDayPnL >= 0 ? 'success.main' : 'error.main',
                                            fontWeight: 500,
                                            fontFamily: 'monospace'
                                        }}>
                                            {formatCurrency(portfolioSummary.holdingsDayPnL)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Overall P&L
                                        </Typography>
                                        <Typography variant="body1" sx={{
                                            color: portfolioSummary.holdingsPnL >= 0 ? 'success.main' : 'error.main',
                                            fontWeight: 500,
                                            fontFamily: 'monospace'
                                        }}>
                                            {formatCurrency(portfolioSummary.holdingsPnL)}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{
                            p: 2,
                            height: '100%',
                            borderRadius: 2,
                            boxShadow: theme.shadows[2],
                            background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.02)}, ${alpha(theme.palette.warning.main, 0.05)})`,
                            border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                            transition: 'transform 0.2s ease-in-out',
                            '&:hover': {
                                transform: 'translateY(-2px)'
                            }
                        }}>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    mb: 1
                                }}>
                                    F&O Positions
                                    <Tooltip title="Your futures and options positions">
                                        <InfoIcon fontSize="small" sx={{ ml: 0.5, fontSize: '0.875rem', color: 'text.secondary' }} />
                                    </Tooltip>
                                </Typography>
                                <Typography variant="h6" sx={{
                                    color: 'text.primary',
                                    fontWeight: 600,
                                    mb: 1.5
                                }}>
                                    {portfolioSummary.activePositionsCount} Positions
                                </Typography>
                                <Stack direction="row" spacing={2}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                            Total Value
                                            <Tooltip title="Total = Long Options Notional + Short Options P&L + Futures P&L">
                                                <InfoIcon fontSize="small" sx={{ ml: 0.5, fontSize: '0.875rem', color: 'text.secondary' }} />
                                            </Tooltip>
                                        </Typography>
                                        <Typography variant="body1" sx={{
                                            color: 'primary.main',
                                            fontWeight: 500,
                                            fontFamily: 'monospace'
                                        }}>
                                            {formatCurrency(portfolioSummary.positionsTotalValue)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Today's Change
                                        </Typography>
                                        <Typography variant="body1" sx={{
                                            color: portfolioSummary.positionsDayPnL >= 0 ? 'success.main' : 'error.main',
                                            fontWeight: 500,
                                            fontFamily: 'monospace'
                                        }}>
                                            {formatCurrency(portfolioSummary.positionsDayPnL)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Overall P&L
                                        </Typography>
                                        <Typography variant="body1" sx={{
                                            color: portfolioSummary.positionsTotalPnL >= 0 ? 'success.main' : 'error.main',
                                            fontWeight: 500,
                                            fontFamily: 'monospace'
                                        }}>
                                            {formatCurrency(portfolioSummary.positionsTotalPnL)}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{
                            p: 2,
                            height: '100%',
                            borderRadius: 2,
                            boxShadow: theme.shadows[2],
                            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)}, ${alpha(theme.palette.primary.main, 0.05)})`,
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                            transition: 'transform 0.2s ease-in-out',
                            '&:hover': {
                                transform: 'translateY(-2px)'
                            }
                        }}>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    mb: 1
                                }}>
                                    Total Portfolio
                                    <Tooltip title="Your total portfolio value and performance">
                                        <InfoIcon fontSize="small" sx={{ ml: 0.5, fontSize: '0.875rem', color: 'text.secondary' }} />
                                    </Tooltip>
                                </Typography>
                                <Typography variant="h6" sx={{
                                    color: 'text.primary',
                                    fontWeight: 600,
                                    mb: 1.5
                                }}>
                                    Portfolio Summary
                                </Typography>
                                <Stack direction="row" spacing={2}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                            Total Portfolio Value
                                            <Tooltip title="Total Portfolio Value = Equity Holdings Value + F&O Positions Value">
                                                <InfoIcon fontSize="small" sx={{ ml: 0.5, fontSize: '0.875rem', color: 'text.secondary' }} />
                                            </Tooltip>
                                        </Typography>
                                        <Typography variant="body1" sx={{
                                            color: 'primary.main',
                                            fontWeight: 500,
                                            fontFamily: 'monospace'
                                        }}>
                                            {formatCurrency(portfolioSummary.totalEquityHoldingsValue + portfolioSummary.positionsTotalValue)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Today's Change
                                        </Typography>
                                        <Typography variant="body1" sx={{
                                            color: portfolioSummary.totalDayPnL >= 0 ? 'success.main' : 'error.main',
                                            fontWeight: 500,
                                            fontFamily: 'monospace'
                                        }}>
                                            {formatCurrency(portfolioSummary.totalDayPnL)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Overall P&L
                                        </Typography>
                                        <Typography variant="body1" sx={{
                                            color: portfolioSummary.totalPnL >= 0 ? 'success.main' : 'error.main',
                                            fontWeight: 500,
                                            fontFamily: 'monospace'
                                        }}>
                                            {formatCurrency(portfolioSummary.totalPnL)}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Holdings Section */}
                <Box mb={4}>
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Typography variant="h5" gutterBottom color="text.primary" sx={{ mb: 3 }}>
                            Holdings
                        </Typography>
                        <Holdings holdings={holdings} isSilentUpdate={!localLoading} />
                    </Paper>
                </Box>

                {/* Positions Section */}
                <Box mb={4}>
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                            <Typography variant="h5" color="text.primary">
                                Positions
                            </Typography>
                            <Stack direction="row" spacing={3} sx={{ alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Tooltip title="Calculated using open quantity and LTP">
                                        <span>Long Options Notional Value:</span>
                                    </Tooltip>
                                    <span style={{ fontFamily: 'monospace', color: portfolioSummary.longOptionsNotional >= 0 ? '#388e3c' : '#d32f2f' }}>{formatCurrency(portfolioSummary.longOptionsNotional)}</span>
                                </Typography>
                                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Tooltip title="Shows Overall P/L of short options">
                                        <span>Short Opt. P/L:</span>
                                    </Tooltip>
                                    <span style={{ fontFamily: 'monospace', color: portfolioSummary.shortOptionsPnL >= 0 ? '#388e3c' : '#d32f2f' }}>{formatCurrency(portfolioSummary.shortOptionsPnL)}</span>
                                </Typography>
                                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Tooltip title="Shows Overall P/L of Futures">
                                        <span>Futures P/L:</span>
                                    </Tooltip>
                                    <span style={{ fontFamily: 'monospace', color: portfolioSummary.futuresPnL >= 0 ? '#388e3c' : '#d32f2f' }}>{formatCurrency(portfolioSummary.futuresPnL)}</span>
                                </Typography>
                            </Stack>
                        </Box>
                        <Positions
                            positions={positions}
                            positionDetails={positionDetails}
                            isDetailsLoading={isDetailsLoading}
                        />
                    </Paper>
                </Box>
            </Container>
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleCloseNotification}
                    severity={notification.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Portfolio;