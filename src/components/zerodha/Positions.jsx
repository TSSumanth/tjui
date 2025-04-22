import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    CircularProgress,
    Alert,
    Box,
    Chip,
    IconButton,
    Button
} from '@mui/material';
import { useZerodha } from '../../context/ZerodhaContext';
import { ExpandLess, ExpandMore } from '@mui/icons-material';

// Utility functions
const getUnderlyingSymbol = (tradingsymbol) => {
    if (!tradingsymbol) return '';
    const symbol = tradingsymbol.toUpperCase();
    const match = symbol.match(/([A-Z]+)/);
    return match ? match[1] : symbol;
};

const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
        return '₹0.00';
    }
    return `₹${Number(value).toFixed(2)}`;
};

const formatPercentage = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
        return '0.00%';
    }
    return `${Number(value).toFixed(2)}%`;
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

const calculateChangePercentage = (position) => {
    const { last_price, close_price } = position;
    if (!last_price || !close_price || close_price === 0) return 0;
    return ((last_price - close_price) / close_price) * 100;
};

const calculatePositionsSummary = (positions) => {
    let totalPnL = 0;
    let dayPnL = 0;

    positions.forEach(position => {
        const lastPrice = Number(position.last_price) || 0;
        const closePrice = Number(position.close_price) || lastPrice;
        const quantity = Number(position.quantity) || 0;
        const isLong = position.buy_quantity > 0;

        console.log('Position calculation:', {
            symbol: position.tradingsymbol,
            lastPrice,
            closePrice,
            quantity,
            isLong,
            rawData: position
        });

        // Calculate day P&L
        if (isLong) {
            dayPnL += (lastPrice - closePrice) * quantity;
        } else {
            dayPnL += (closePrice - lastPrice) * quantity;
        }

        // Use the pnl field provided by Zerodha for total P&L
        totalPnL += Number(position.pnl) || 0;
    });

    console.log('Positions summary:', {
        totalPnL,
        dayPnL,
        positionsCount: positions.length
    });

    return {
        totalPnL,
        dayPnL
    };
};

const PositionTable = ({ positions, underlying }) => {
    const [expanded, setExpanded] = useState(true);

    // Process and group positions
    const { openPositions, closedPositions } = React.useMemo(() => {
        return positions.reduce((acc, position) => {
            // Determine if position is actually closed
            const isSquaredOff = position.quantity === 0 &&
                (position.day_buy_quantity > 0 || position.day_sell_quantity > 0);

            // For overnight positions
            const hasOvernightPosition = position.overnight_quantity !== 0;
            const isOvernightSquaredOff = hasOvernightPosition && (
                (position.overnight_quantity > 0 && position.day_sell_quantity === position.overnight_quantity) ||
                (position.overnight_quantity < 0 && position.day_buy_quantity === Math.abs(position.overnight_quantity))
            );

            // Final closed status
            const isClosed = isSquaredOff || isOvernightSquaredOff;

            // Add position to appropriate array
            if (isClosed) {
                acc.closedPositions.push({
                    ...position,
                    is_closed: true,
                    closing_price: position.last_price,
                    closed_quantity: hasOvernightPosition ?
                        Math.abs(position.overnight_quantity) :
                        Math.max(position.day_buy_quantity, position.day_sell_quantity)
                });
            } else if (position.quantity !== 0) {
                acc.openPositions.push({
                    ...position,
                    is_closed: false
                });
            }

            return acc;
        }, { openPositions: [], closedPositions: [] });
    }, [positions]);

    // Calculate day's P&L for this underlying
    const calculateDayPnL = () => {
        return positions.reduce((total, position) => {
            const lastPrice = Number(position.last_price) || 0;
            const closePrice = Number(position.close_price) || lastPrice;
            const quantity = position.is_closed ? position.closed_quantity : Number(position.quantity) || 0;
            const positionType = getPositionType(position.tradingsymbol);

            // If position is closed, use the total P&L
            if (position.is_closed) {
                return total + (Number(position.pnl) || 0);
            }

            // For futures
            if (positionType === 'Future') {
                if (quantity > 0) {  // Long futures
                    return total + ((lastPrice - closePrice) * quantity);
                } else {  // Short futures
                    return total + ((closePrice - lastPrice) * Math.abs(quantity));
                }
            }

            // For options and other instruments
            const isLong = position.buy_quantity > position.sell_quantity;
            return total + ((lastPrice - closePrice) * quantity * (isLong ? 1 : -1));
        }, 0);
    };

    // Calculate total P&L for this underlying
    const calculateTotalPnL = () => {
        return positions.reduce((total, position) => {
            return total + (Number(position.pnl) || 0);
        }, 0);
    };

    const renderPositionRow = (position) => {
        const lastPrice = Number(position.last_price) || 0;
        const closePrice = Number(position.close_price) || lastPrice;
        const quantity = position.is_closed ? position.closed_quantity : Number(position.quantity) || 0;
        const isNegativeQuantity = quantity < 0;
        const positionType = getPositionType(position.tradingsymbol);

        // For closed positions, show total P&L in Day's P&L column
        let dayPnL;
        if (position.is_closed) {
            dayPnL = Number(position.pnl) || 0;
        } else {
            // For futures, calculate based on position direction (quantity)
            if (positionType === 'Future') {
                if (quantity > 0) {  // Long futures
                    dayPnL = (lastPrice - closePrice) * quantity;
                } else {  // Short futures
                    dayPnL = (closePrice - lastPrice) * Math.abs(quantity);
                }
            } else {
                // For options and other instruments
                const isLong = position.buy_quantity > position.sell_quantity;
                dayPnL = ((lastPrice - closePrice) * quantity * (isLong ? 1 : -1));
            }
        }

        // Total P&L remains as is
        const totalPnL = Number(position.pnl) || 0;

        console.log('Position calculation:', {
            symbol: position.tradingsymbol,
            type: positionType,
            quantity,
            lastPrice,
            closePrice,
            dayPnL,
            totalPnL
        });

        return (
            <TableRow
                key={position.tradingsymbol + (position.is_closed ? '-closed' : '')}
                sx={{
                    backgroundColor: position.is_closed ? '#f8f9fa' : 'white',
                    '&:hover': {
                        backgroundColor: position.is_closed ? '#f0f1f2' : '#f5f5f5'
                    },
                    '&:last-child td': {
                        borderBottom: 0
                    }
                }}
            >
                <TableCell sx={{ fontSize: '0.875rem' }}>
                    {position.tradingsymbol}
                    {position.is_closed && (
                        <Chip
                            label="Closed"
                            size="small"
                            sx={{
                                ml: 1,
                                backgroundColor: '#e0e0e0',
                                fontSize: '0.75rem',
                                height: '20px'
                            }}
                        />
                    )}
                </TableCell>
                <TableCell>
                    <Chip
                        label={getPositionType(position.tradingsymbol)}
                        size="small"
                        sx={{
                            backgroundColor: getPositionType(position.tradingsymbol) === 'Future' ? '#e3f2fd' : '#f3e5f5',
                            color: getPositionType(position.tradingsymbol) === 'Future' ? '#1976d2' : '#9c27b0',
                            fontSize: '0.75rem',
                            height: '24px'
                        }}
                    />
                </TableCell>
                <TableCell
                    align="right"
                    sx={{
                        color: isNegativeQuantity ? 'error.main' : 'inherit',
                        fontSize: '0.875rem',
                        fontFamily: 'monospace'
                    }}
                >
                    {quantity}
                </TableCell>
                <TableCell
                    align="right"
                    sx={{
                        fontSize: '0.875rem',
                        fontFamily: 'monospace'
                    }}
                >
                    {formatCurrency(position.average_price)}
                </TableCell>
                <TableCell
                    align="right"
                    sx={{
                        fontSize: '0.875rem',
                        fontFamily: 'monospace'
                    }}
                >
                    {formatCurrency(position.is_closed ? position.closing_price : position.last_price)}
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
                        color: totalPnL >= 0 ? 'success.main' : 'error.main',
                        fontWeight: 'bold',
                        fontSize: '0.875rem',
                        fontFamily: 'monospace'
                    }}
                >
                    {formatCurrency(totalPnL)}
                </TableCell>
                <TableCell
                    align="right"
                    sx={{
                        color: position.pnl >= 0 ? 'success.main' : 'error.main',
                        fontWeight: 'bold',
                        fontSize: '0.875rem',
                        fontFamily: 'monospace'
                    }}
                >
                    {formatPercentage(calculateChangePercentage(position))}
                </TableCell>
            </TableRow>
        );
    };

    return (
        <Box sx={{ mb: 3 }}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 1,
                    cursor: 'pointer'
                }}
                onClick={() => setExpanded(!expanded)}
            >
                <Typography variant="h6">
                    {underlying}
                    <Typography component="span" variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
                        ({openPositions.length} Open, {closedPositions.length} Closed)
                    </Typography>
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="subtitle1" color={calculateDayPnL() >= 0 ? 'success.main' : 'error.main'}>
                        Day: {formatCurrency(calculateDayPnL())}
                    </Typography>
                    <Typography variant="subtitle1" color={calculateTotalPnL() >= 0 ? 'success.main' : 'error.main'}>
                        Total: {formatCurrency(calculateTotalPnL())}
                    </Typography>
                    <IconButton size="small">
                        {expanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                </Box>
            </Box>

            {expanded && (
                <TableContainer component={Paper} elevation={0}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Symbol</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Position Type</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Quantity</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Avg. Price</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>LTP</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Day's P&L</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Total P&L</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Change %</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {/* Render open positions first */}
                            {openPositions.map(renderPositionRow)}
                            {/* Then render closed positions */}
                            {closedPositions.map(renderPositionRow)}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
};

const Positions = () => {
    const { positions, loading, error } = useZerodha();

    // Process positions data
    const { dayPositions, netPositions } = React.useMemo(() => {
        if (!positions || !positions.day || !positions.net) {
            return { dayPositions: [], netPositions: [] };
        }
        return {
            dayPositions: positions.day,
            netPositions: positions.net
        };
    }, [positions]);

    // Group positions by underlying
    const groupedPositions = React.useMemo(() => {
        const groups = {};

        // Process net positions
        netPositions.forEach(position => {
            const underlying = getUnderlyingSymbol(position.tradingsymbol);
            if (!groups[underlying]) {
                groups[underlying] = {
                    openPositions: [],
                    closedPositions: []
                };
            }

            // Check if position is closed
            const isSquaredOff = position.quantity === 0 &&
                (position.day_buy_quantity > 0 || position.day_sell_quantity > 0);

            // For overnight positions
            const hasOvernightPosition = position.overnight_quantity !== 0;
            const isOvernightSquaredOff = hasOvernightPosition && (
                (position.overnight_quantity > 0 && position.day_sell_quantity === position.overnight_quantity) ||
                (position.overnight_quantity < 0 && position.day_buy_quantity === Math.abs(position.overnight_quantity))
            );

            if (isSquaredOff || isOvernightSquaredOff) {
                groups[underlying].closedPositions.push({
                    ...position,
                    is_closed: true,
                    closing_price: position.last_price,
                    closed_quantity: hasOvernightPosition ?
                        Math.abs(position.overnight_quantity) :
                        Math.max(position.day_buy_quantity, position.day_sell_quantity)
                });
            } else if (position.quantity !== 0) {
                groups[underlying].openPositions.push({
                    ...position,
                    is_closed: false
                });
            }
        });

        // Process day positions
        dayPositions.forEach(position => {
            const underlying = getUnderlyingSymbol(position.tradingsymbol);
            if (!groups[underlying]) {
                groups[underlying] = {
                    openPositions: [],
                    closedPositions: []
                };
            }

            // Only add day positions that aren't already tracked in net positions
            const existingNetPosition = netPositions.find(p => p.tradingsymbol === position.tradingsymbol);
            if (!existingNetPosition && position.quantity !== 0) {
                groups[underlying].openPositions.push({
                    ...position,
                    is_closed: false
                });
            }
        });

        return groups;
    }, [dayPositions, netPositions]);

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

    if (!positions || (!positions.day?.length && !positions.net?.length)) {
        return (
            <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h5" component="h2" gutterBottom>
                    Positions
                </Typography>
                <Typography variant="body1" color="textSecondary" align="center">
                    No positions available.
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
                    Positions
                </Typography>
            </Box>

            {Object.entries(groupedPositions).map(([underlying, { openPositions, closedPositions }]) => (
                <PositionTable
                    key={underlying}
                    positions={[...openPositions, ...closedPositions]}
                    underlying={underlying}
                />
            ))}
        </Box>
    );
};

export default Positions; 