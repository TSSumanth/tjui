import React, { useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert
} from '@mui/material';
import { useZerodha } from '../../context/ZerodhaContext';
import PropTypes from 'prop-types';

const Holdings = () => {
    const { holdings, loading, error } = useZerodha();

    // Add debug logging
    console.log('Holdings Component:', {
        loading,
        error,
        holdingsData: holdings,
        holdingsCount: holdings?.length
    });

    const formatCurrency = (value) => {
        if (typeof value !== 'number' || isNaN(value)) {
            return '₹0.00';
        }
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };

    const formatPercentage = (value) => {
        if (typeof value !== 'number' || isNaN(value)) {
            return '0.00%';
        }
        return `${value.toFixed(2)}%`;
    };

    const calculateDayPnL = useMemo(() => (holding) => {
        try {
            const lastPrice = Number(holding.last_price) || 0;
            const closePrice = Number(holding.close_price) || lastPrice;
            const quantity = Number(holding.quantity) || 0;
            const dayPnL = (lastPrice - closePrice) * quantity;

            console.log('Day P&L calculation:', {
                symbol: holding.tradingsymbol,
                lastPrice,
                closePrice,
                quantity,
                dayPnL,
                rawData: holding
            });

            return dayPnL;
        } catch (error) {
            console.error('Error calculating day P&L:', error);
            return 0;
        }
    }, []);

    // Calculate total P&L and day P&L
    useMemo(() => {
        holdings.reduce((acc, holding) => {
            const lastPrice = Number(holding.last_price) || 0;
            const avgPrice = Number(holding.average_price) || 0;
            const quantity = Number(holding.quantity) || 0;
            const closePrice = Number(holding.close_price) || lastPrice;

            const pnl = (lastPrice - avgPrice) * quantity;
            const dayChange = (lastPrice - closePrice) * quantity;

            console.log('Holdings calculation:', {
                symbol: holding.tradingsymbol,
                lastPrice,
                closePrice,
                avgPrice,
                quantity,
                pnl,
                dayChange,
                rawData: holding
            });

            return {
                totalPnL: acc.totalPnL + pnl,
                dayPnL: acc.dayPnL + dayChange
            };
        }, { totalPnL: 0, dayPnL: 0 });
    }, [holdings]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
            </Alert>
        );
    }

    if (!holdings?.length) {
        return (
            <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h5" component="h2" gutterBottom>
                    Stock Holdings
                </Typography>
                <Typography variant="body1" color="textSecondary" align="center">
                    No data available. Click Get Holdings to load data.
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
                pb: 2,
                borderBottom: '1px solid #e0e0e0'
            }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 500 }}>
                    Stock Holdings
                </Typography>
            </Box>
            <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Symbol</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Quantity</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Avg. Cost</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>LTP</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Current Value</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Day's P&L</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Total P&L</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Day Change %</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {holdings.map((holding) => {
                            const dayPnL = calculateDayPnL(holding);
                            const currentValue = Number(holding.quantity) * Number(holding.last_price);
                            const dayChangePercentage = Number(holding.day_change_percentage);

                            return (
                                <TableRow
                                    key={holding.tradingsymbol}
                                    sx={{
                                        backgroundColor: 'white',
                                        '&:hover': {
                                            backgroundColor: '#f5f5f5'
                                        },
                                        '&:last-child td': {
                                            borderBottom: 0
                                        }
                                    }}
                                >
                                    <TableCell
                                        component="th"
                                        scope="row"
                                        sx={{ fontSize: '0.875rem' }}
                                    >
                                        {holding.tradingsymbol}
                                    </TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{
                                            fontSize: '0.875rem',
                                            fontFamily: 'monospace'
                                        }}
                                    >
                                        {holding.quantity}
                                    </TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{
                                            fontSize: '0.875rem',
                                            fontFamily: 'monospace'
                                        }}
                                    >
                                        {formatCurrency(Number(holding.average_price))}
                                    </TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{
                                            fontSize: '0.875rem',
                                            fontFamily: 'monospace'
                                        }}
                                    >
                                        {formatCurrency(Number(holding.last_price))}
                                    </TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{
                                            fontSize: '0.875rem',
                                            fontFamily: 'monospace'
                                        }}
                                    >
                                        {formatCurrency(currentValue)}
                                    </TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{
                                            color: dayPnL >= 0 ? 'success.main' : 'error.main',
                                            fontWeight: 'bold',
                                            fontSize: '0.875rem',
                                            fontFamily: 'monospace'
                                        }}
                                    >
                                        {formatCurrency(dayPnL)}
                                    </TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{
                                            color: Number(holding.pnl) >= 0 ? 'success.main' : 'error.main',
                                            fontWeight: 'bold',
                                            fontSize: '0.875rem',
                                            fontFamily: 'monospace'
                                        }}
                                    >
                                        {formatCurrency(Number(holding.pnl))}
                                    </TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{
                                            color: dayChangePercentage >= 0 ? 'success.main' : 'error.main',
                                            fontWeight: 'bold',
                                            fontSize: '0.875rem',
                                            fontFamily: 'monospace'
                                        }}
                                    >
                                        {formatPercentage(dayChangePercentage)}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

Holdings.propTypes = {
    holdings: PropTypes.arrayOf(PropTypes.shape({
        tradingsymbol: PropTypes.string.isRequired,
        quantity: PropTypes.number.isRequired,
        average_price: PropTypes.number.isRequired,
        last_price: PropTypes.number.isRequired,
        pnl: PropTypes.number,
        day_change_percentage: PropTypes.number,
        previous_close: PropTypes.number
    }))
};

export default Holdings; 