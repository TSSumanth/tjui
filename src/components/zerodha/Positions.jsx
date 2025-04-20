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
    Stack,
    IconButton
} from '@mui/material';
import { useZerodha } from '../../context/ZerodhaContext';
import { ExpandLess, ExpandMore } from '@mui/icons-material';

// Utility functions
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

const PositionTable = ({ positions, underlying }) => {
    const [expanded, setExpanded] = useState(true);

    // Calculate total P&L for this underlying
    const calculateTotalPnL = () => {
        return positions.reduce((total, position) => {
            const pnl = Number(position.pnl) || 0;
            return total + pnl;
        }, 0);
    };

    // Calculate day's P&L for this underlying
    const calculateDayPnL = () => {
        return positions.reduce((total, position) => {
            const dayPnl = Number(position.day_m2m) || 0;
            return total + dayPnl;
        }, 0);
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
                            {positions.map((position) => {
                                const isNegativeQuantity = position.quantity < 0;

                                return (
                                    <TableRow
                                        key={position.tradingsymbol}
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
                                        <TableCell sx={{ fontSize: '0.875rem' }}>{position.tradingsymbol}</TableCell>
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
                                            {position.quantity}
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
                                            {formatCurrency(position.last_price)}
                                        </TableCell>
                                        <TableCell
                                            align="right"
                                            sx={{
                                                color: position.day_m2m >= 0 ? 'success.main' : 'error.main',
                                                fontWeight: 'bold',
                                                fontSize: '0.875rem',
                                                fontFamily: 'monospace'
                                            }}
                                        >
                                            {formatCurrency(position.day_m2m)}
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
                                            {formatCurrency(position.pnl)}
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
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
};

const Positions = () => {
    const { positions, loading, error } = useZerodha();

    const getUnderlyingSymbol = (tradingsymbol) => {
        if (!tradingsymbol) return '';

        const symbol = tradingsymbol.toUpperCase();
        const match = symbol.match(/([A-Z]+)/);
        return match ? match[1] : symbol;
    };

    // Group positions by underlying symbol and sort by position type
    const groupedPositions = React.useMemo(() => {
        const groups = {};
        positions.forEach(position => {
            const underlying = getUnderlyingSymbol(position.tradingsymbol);
            if (!groups[underlying]) {
                groups[underlying] = [];
            }
            groups[underlying].push(position);
        });

        // Sort positions within each group
        Object.values(groups).forEach(group => {
            group.sort((a, b) => {
                const typeA = getPositionType(a.tradingsymbol);
                const typeB = getPositionType(b.tradingsymbol);
                if (typeA === typeB) {
                    return a.tradingsymbol.localeCompare(b.tradingsymbol);
                }
                const typeOrder = { Future: 1, Option: 2, Stock: 3 };
                return typeOrder[typeA] - typeOrder[typeB];
            });
        });

        return groups;
    }, [positions]);

    // Calculate overall total P&L
    const totalPnL = positions.reduce((sum, pos) => {
        const pnl = Number(pos.pnl) || 0;
        return sum + (isNaN(pnl) ? 0 : pnl);
    }, 0);

    const dayPnL = positions.reduce((sum, pos) => {
        const dayPnl = Number(pos.day_m2m) || 0;
        return sum + (isNaN(dayPnl) ? 0 : dayPnl);
    }, 0);

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

    if (!positions || !positions.length) {
        return (
            <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h5" component="h2" gutterBottom>
                    Open Positions
                </Typography>
                <Typography variant="body1" color="textSecondary" align="center">
                    No data available. Click &#39;Get Positions&#39; to load data.
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
                    Open Positions
                </Typography>
            </Box>

            {Object.entries(groupedPositions).map(([underlying, positions]) => (
                <PositionTable
                    key={underlying}
                    positions={positions}
                    underlying={underlying}
                />
            ))}
        </Box>
    );
};

export default Positions; 