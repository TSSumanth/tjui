import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper,
    Chip,
    CircularProgress,
    Alert,
    Divider,
    LinearProgress,
    Grid,
    Card,
    CardContent
} from '@mui/material';
import { getLast6MonthsPerformance, getCurrentMonthPerformance } from '../services/monthlyPerformance';
import { getStockTrades, getOptionTrades } from '../services/trades';
import { fetchLTPs } from '../services/zerodha/api';
import { getOpenStrategies } from '../services/strategies';
import { getAlgoStrategies } from '../services/algoStrategies';
import { getReportByDateRange } from '../services/profitlossreport';

function Home() {
    const [monthlyHistory, setMonthlyHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Open trades state
    const [openTrades, setOpenTrades] = useState([]);
    const [tradesLoading, setTradesLoading] = useState(true);
    const [tradesError, setTradesError] = useState(null);
    const [ltpData, setLtpData] = useState({});
    
    // New features state
    const [currentMonthData, setCurrentMonthData] = useState(null);
    const [winRateStats, setWinRateStats] = useState({ total: 0, profitable: 0, winRate: 0 });
    const [activeStrategies, setActiveStrategies] = useState([]);
    const [strategiesLoading, setStrategiesLoading] = useState(true);
    
    // P/L Report state
    const [plReportData, setPlReportData] = useState([]);
    const [plReportLoading, setPlReportLoading] = useState(true);
    const [plReportError, setPlReportError] = useState(null);

    useEffect(() => {
        const fetchMonthlyHistory = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await getLast6MonthsPerformance();
                if (response.success) {
                    setMonthlyHistory(response.data || []);
                } else {
                    setError('Failed to fetch monthly performance data');
                }
            } catch (err) {
                console.error('Error fetching monthly history:', err);
                setError('Failed to load monthly performance history');
            } finally {
                setLoading(false);
            }
        };

        fetchMonthlyHistory();
    }, []);

    // Fetch open trades and LTP data
    useEffect(() => {
        const fetchOpenTrades = async () => {
            try {
                setTradesLoading(true);
                setTradesError(null);

                // Fetch both stock and option trades
                const [stockTrades, optionTrades] = await Promise.all([
                    getStockTrades({ status: 'OPEN' }),
                    getOptionTrades({ status: 'OPEN' })
                ]);

                // Combine all open trades
                const allTrades = [...stockTrades, ...optionTrades];
                setOpenTrades(allTrades);

                // Prepare instruments for LTP fetching
                const instruments = allTrades
                    .filter(trade => {
                        // For option trades, use asset field
                        if (trade.asset) {
                            return true; // We'll handle exchange mapping in the LTP call
                        }
                        // For stock trades, use exchange and tradingsymbol
                        return trade.exchange && trade.tradingsymbol;
                    })
                    .map(trade => {
                        if (trade.asset) {
                            // For option trades, assume NFO exchange and use asset as tradingsymbol
                            return {
                                exchange: 'NFO',
                                tradingsymbol: trade.asset
                            };
                        } else {
                            // For stock trades
                            return {
                                exchange: trade.exchange,
                                tradingsymbol: trade.tradingsymbol
                            };
                        }
                    });

                if (instruments.length > 0) {
                    try {
                        const ltpMap = await fetchLTPs(instruments);
                        setLtpData(ltpMap);
                    } catch (ltpError) {
                        console.error('Error fetching LTP data:', ltpError);
                        // Don't fail the entire operation if LTP fails
                    }
                }
            } catch (err) {
                console.error('Error fetching open trades:', err);
                setTradesError('Failed to load open trades');
            } finally {
                setTradesLoading(false);
            }
        };

        fetchOpenTrades();
    }, []);

    // Fetch current month data and win rate statistics
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch current month performance data
                const currentMonthResponse = await getCurrentMonthPerformance();
                if (currentMonthResponse.success) {
                    setCurrentMonthData(currentMonthResponse.data);
                }

                // Fetch closed trades to calculate win rate
                const [closedStockTrades, closedOptionTrades] = await Promise.all([
                    getStockTrades({ status: 'CLOSED' }),
                    getOptionTrades({ status: 'CLOSED' })
                ]);

                const allClosedTrades = [...closedStockTrades, ...closedOptionTrades];
                const profitableTrades = allClosedTrades.filter(trade => {
                    const returnValue = parseFloat(trade.overallreturn || 0);
                    return returnValue > 0;
                });

                const winRate = allClosedTrades.length > 0 
                    ? (profitableTrades.length / allClosedTrades.length) * 100 
                    : 0;

                setWinRateStats({
                    total: allClosedTrades.length,
                    profitable: profitableTrades.length,
                    winRate: winRate
                });
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            }
        };

        fetchDashboardData();
    }, []);

    // Fetch active strategies
    useEffect(() => {
        const fetchActiveStrategies = async () => {
            try {
                setStrategiesLoading(true);
                
                // Fetch both regular and algo strategies
                const [regularStrategies, algoStrategies] = await Promise.all([
                    getOpenStrategies(),
                    getAlgoStrategies({ status: 'ACTIVE' })
                ]);

                // Combine and format strategies
                const allStrategies = [
                    ...regularStrategies.map(s => ({ ...s, type: 'Regular' })),
                    ...algoStrategies.map(s => ({ ...s, type: 'Algo' }))
                ];

                setActiveStrategies(allStrategies);
            } catch (err) {
                console.error('Error fetching active strategies:', err);
            } finally {
                setStrategiesLoading(false);
            }
        };

        fetchActiveStrategies();
    }, []);

    // Fetch P/L Report for last 7 days (to get 5 trading days excluding weekends)
    useEffect(() => {
        const fetchPLReport = async () => {
            try {
                setPlReportLoading(true);
                setPlReportError(null);
                
                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(endDate.getDate() - 7);
                
                // Format dates for API
                const formatDate = (date) => date.toISOString().split('T')[0];
                
                const response = await getReportByDateRange(
                    formatDate(startDate), 
                    formatDate(endDate)
                );
                
                setPlReportData(response || []);
            } catch (err) {
                console.error('Error fetching P/L report:', err);
                setPlReportError('Failed to load P/L report data');
            } finally {
                setPlReportLoading(false);
            }
        };

        fetchPLReport();
    }, []);

    const formatCurrency = (value) => {
        return `₹${parseFloat(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const getVarianceColor = (expected, actual) => {
        const variance = expected - actual;
        if (variance <= 0) return 'success';
        if (variance <= expected * 0.1) return 'warning';
        return 'error';
    };

    const calculatePL = (trade) => {
        // Handle option trades (different data structure)
        if (trade.asset) {
            const currentPrice = ltpData[trade.asset] || parseFloat(trade.ltp || 0);
            const entryPrice = parseFloat(trade.entryprice || 0);
            const quantity = parseFloat(trade.quantity || 0);
            
            if (trade.tradetype === 'LONG') {
                return (currentPrice - entryPrice) * quantity;
            } else if (trade.tradetype === 'SHORT') {
                return (entryPrice - currentPrice) * quantity;
            }
        } else {
            // Handle stock trades (original logic)
            const currentPrice = ltpData[trade.tradingsymbol] || trade.currentprice || 0;
            const buyPrice = parseFloat(trade.buyprice || 0);
            const sellPrice = parseFloat(trade.sellprice || 0);
            const quantity = parseFloat(trade.quantity || 0);
            
            if (trade.transactiontype === 'BUY') {
                return (currentPrice - buyPrice) * quantity;
            } else if (trade.transactiontype === 'SELL') {
                return (sellPrice - currentPrice) * quantity;
            }
        }
        return 0;
    };

    const getPLColor = (pl) => {
        if (pl > 0) return 'success';
        if (pl < 0) return 'error';
        return 'default';
    };

    const formatInstrumentName = (trade) => {
        // Handle option trades
        if (trade.asset) {
            return trade.asset;
        }
        // Handle stock trades
        if (trade.instrumentname) {
            return trade.instrumentname;
        }
        // Fallback to tradingsymbol if instrumentname is not available
        return trade.tradingsymbol || 'Unknown';
    };

    return (
        <div>
            <Box sx={{ p: 3 }}>
                {/* Dashboard Overview Cards */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    {/* Monthly Target Progress */}
                    <Grid item xs={12} md={4}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="h6" gutterBottom>
                                    Monthly Target Progress
                                </Typography>
                                {currentMonthData && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        {currentMonthData.month_name} {new Date().getFullYear()}
                                    </Typography>
                                )}
                                {currentMonthData ? (
                                    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Expected: {formatCurrency(currentMonthData.expected_return)}
                                            </Typography>
                                            <Typography 
                                                variant="body2" 
                                                color={currentMonthData.actual_return < 0 ? "error" : "text.secondary"}
                                            >
                                                Actual: {formatCurrency(currentMonthData.actual_return)}
                                            </Typography>
                                        </Box>
                                        <LinearProgress 
                                            variant="determinate" 
                                            value={currentMonthData.expected_return > 0 
                                                ? Math.min((currentMonthData.actual_return / currentMonthData.expected_return) * 100, 100)
                                                : 0
                                            }
                                            sx={{ 
                                                height: 8, 
                                                borderRadius: 4,
                                                backgroundColor: 'rgba(0,0,0,0.1)',
                                                '& .MuiLinearProgress-bar': {
                                                    backgroundColor: currentMonthData.actual_return < 0 
                                                        ? '#f44336'  // Red for negative actual return (losses)
                                                        : currentMonthData.actual_return >= currentMonthData.expected_return 
                                                            ? '#4caf50'  // Green for meeting/exceeding target
                                                            : currentMonthData.actual_return >= currentMonthData.expected_return * 0.5 
                                                                ? '#ff9800'  // Orange for partial progress
                                                                : '#f44336'  // Red for poor performance
                                                }
                                            }}
                                        />
                                        <Typography 
                                            variant="caption" 
                                            color={currentMonthData.actual_return < 0 ? "error" : "text.secondary"} 
                                            sx={{ mt: 1, display: 'block' }}
                                        >
                                            {currentMonthData.expected_return > 0 
                                                ? currentMonthData.actual_return < 0 
                                                    ? `Loss: ${formatCurrency(Math.abs(currentMonthData.actual_return))}`
                                                    : `${((currentMonthData.actual_return / currentMonthData.expected_return) * 100).toFixed(1)}% of target achieved`
                                                : 'No target set'
                                            }
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Loading monthly data...
                            </Typography>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Win Rate Statistics */}
                    <Grid item xs={12} md={4}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="h6" gutterBottom>
                                    Win Rate Statistics
                                </Typography>
                                <Box sx={{ textAlign: 'center', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold' }}>
                                        {winRateStats.winRate.toFixed(1)}%
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {winRateStats.profitable} of {winRateStats.total} trades profitable
                                    </Typography>
                                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-around' }}>
                                        <Chip 
                                            label={`${winRateStats.profitable} Wins`} 
                                            color="success" 
                                            size="small" 
                                        />
                                        <Chip 
                                            label={`${winRateStats.total - winRateStats.profitable} Losses`} 
                                            color="error" 
                                            size="small" 
                                        />
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Today's Active Strategies */}
                    <Grid item xs={12} md={4}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="h6" gutterBottom>
                                    Active Strategies ({activeStrategies.length})
                                </Typography>
                                {strategiesLoading ? (
                                    <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <CircularProgress size={24} />
                                    </Box>
                                ) : activeStrategies.length === 0 ? (
                                    <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            No active strategies
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Box sx={{ flexGrow: 1, maxHeight: 120, overflow: 'auto' }}>
                                        {activeStrategies.slice(0, 5).map((strategy, index) => (
                                            <Box key={strategy.id || index} sx={{ mb: 1 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {strategy.strategyname || strategy.name || 'Unnamed Strategy'}
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                                    <Chip 
                                                        label={strategy.type} 
                                                        size="small" 
                                                        color="primary" 
                                                        variant="outlined"
                                                    />
                                                    {strategy.status && (
                                                        <Chip 
                                                            label={strategy.status} 
                                                            size="small" 
                                                            color={strategy.status === 'ACTIVE' ? 'success' : 'default'}
                                                            variant="outlined"
                                                        />
                                                    )}
                                                </Box>
                                            </Box>
                                        ))}
                                        {activeStrategies.length > 5 && (
                                            <Typography variant="caption" color="text.secondary">
                                                +{activeStrategies.length - 5} more strategies
                            </Typography>
                                        )}
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />
                
                {/* Monthly Performance History Table */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                        Monthly Performance History (Last 6 Months)
                    </Typography>
                    
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : error ? (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    ) : (
                        <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Month</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Expected</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Actual</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Variance</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Balance</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {monthlyHistory.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                                No monthly performance data available
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        monthlyHistory.map((month) => {
                                            const variance = month.expected_return - month.actual_return;
                                            return (
                                                <TableRow key={`${month.year}-${month.month}`} hover>
                                                    <TableCell sx={{ fontSize: '0.75rem' }}>
                                                        <Chip 
                                                            label={`${month.month_name} ${month.year}`}
                                                            size="small"
                                                            color="primary"
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                                                        {formatCurrency(month.expected_return)}
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                                                        <Chip
                                                            label={formatCurrency(month.actual_return)}
                                                            size="small"
                                                            color={month.actual_return >= month.expected_return ? "success" : "warning"}
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                                                        <Chip
                                                            label={formatCurrency(variance)}
                                                            size="small"
                                                            color={getVarianceColor(month.expected_return, month.actual_return)}
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                                                        {formatCurrency(month.account_balance)}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Last 5 Trading Days P/L Report */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                        Last 5 Trading Days P/L Report
                    </Typography>
                    
                    {plReportLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : plReportError ? (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {plReportError}
                        </Alert>
                    ) : (
                        <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Date</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Stocks Realized</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Stocks Unrealized</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>F&O Realized</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>F&O Unrealized</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Total P/L</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {plReportData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                                No P/L data available for the last 5 trading days
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        plReportData.map((day, index) => {
                                            return (
                                                <TableRow key={day.date || index} hover>
                                                    <TableCell sx={{ fontSize: '0.75rem' }}>
                                                        <Chip 
                                                            label={day.date || 'N/A'}
                                                            size="small"
                                                            color="primary"
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                                                        <Chip
                                                            label={formatCurrency(day.stocks_realised || 0)}
                                                            size="small"
                                                            color={parseFloat(day.stocks_realised || 0) >= 0 ? "success" : "error"}
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                                                        <Chip
                                                            label={formatCurrency(day.stocks_unrealised || 0)}
                                                            size="small"
                                                            color={parseFloat(day.stocks_unrealised || 0) >= 0 ? "success" : "error"}
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                                                        <Chip
                                                            label={formatCurrency(day.fo_realised || 0)}
                                                            size="small"
                                                            color={parseFloat(day.fo_realised || 0) >= 0 ? "success" : "error"}
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                                                        <Chip
                                                            label={formatCurrency(day.fo_unrealised || 0)}
                                                            size="small"
                                                            color={parseFloat(day.fo_unrealised || 0) >= 0 ? "success" : "error"}
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                                                        <Chip
                                                            label={formatCurrency(day.total_pl || 0)}
                                                            size="small"
                                                            color={parseFloat(day.total_pl || 0) >= 0 ? "success" : "error"}
                                                            variant="filled"
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Open Trades Table */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                        Open Trades ({openTrades.length})
                    </Typography>
                    
                    {tradesLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                            <CircularProgress size={24} />
                                        </Box>
                    ) : tradesError ? (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {tradesError}
                        </Alert>
                    ) : (
                        <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Instrument</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Type</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Buy/Sell Price</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Current Price</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>P/L</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {openTrades.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                                No open trades found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        openTrades.map((trade) => {
                                            // Handle different data structures for option vs stock trades
                                            let currentPrice, pl, buySellPrice, transactionType;
                                            
                                            if (trade.asset) {
                                                // Option trade
                                                currentPrice = ltpData[trade.asset] || parseFloat(trade.ltp || 0);
                                                pl = calculatePL(trade);
                                                buySellPrice = trade.entryprice;
                                                transactionType = trade.tradetype;
                                            } else {
                                                // Stock trade
                                                currentPrice = ltpData[trade.tradingsymbol] || trade.currentprice || 0;
                                                pl = calculatePL(trade);
                                                buySellPrice = trade.transactiontype === 'BUY' ? trade.buyprice : trade.sellprice;
                                                transactionType = trade.transactiontype;
                                            }
                                            
                                            return (
                                                <TableRow key={trade.tradeid} hover>
                                                    <TableCell sx={{ fontSize: '0.75rem' }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                            {formatInstrumentName(trade)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ fontSize: '0.75rem' }}>
                                                        <Chip
                                                            label={transactionType}
                                                            size="small"
                                                            color={
                                                                transactionType === 'BUY' || transactionType === 'LONG' 
                                                                    ? 'success' 
                                                                    : 'error'
                                                            }
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                                                        {formatCurrency(buySellPrice)}
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                                                        {currentPrice > 0 ? formatCurrency(currentPrice) : 'N/A'}
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                                    <Chip
                                                            label={formatCurrency(pl)}
                                        size="small"
                                                            color={getPLColor(pl)}
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Box>
            </Box>
        </div>
    );
}

export default Home;