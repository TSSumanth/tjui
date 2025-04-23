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
    IconButton
} from '@mui/material';
import { useZerodha } from '../../context/ZerodhaContext';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatters';

// Utility functions
const getUnderlyingSymbol = (tradingsymbol) => {
    if (!tradingsymbol) return '';
    const symbol = tradingsymbol.toUpperCase();
    const match = symbol.match(/([A-Z]+)/);
    return match ? match[1] : symbol;
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

const extractOptionDetails = (tradingsymbol) => {
    // Example: RELIANCE25MAY1250CE
    const match = tradingsymbol.match(/([A-Z]+)(\d{2}[A-Z]+)(\d+)(CE|PE)/);
    if (!match) return null;

    return {
        symbol: match[1],
        expiry: match[2],
        strike: parseFloat(match[3]),
        type: match[4]
    };
};

const calculateBreakeven = (positions) => {
    // Filter only option positions
    const optionPositions = positions.filter(p => p.tradingsymbol.match(/(CE|PE)$/));
    if (optionPositions.length === 0) return null;

    // Get current underlying price (using last_price of the first position as reference)
    const currentPrice = positions[0].last_price;

    // Function to calculate total P&L at a given price point
    const calculateTotalPnL = (atPrice) => {
        return optionPositions.reduce((total, position) => {
            const details = extractOptionDetails(position.tradingsymbol);
            if (!details) return total;

            const quantity = Math.abs(position.quantity);
            const isLong = position.quantity > 0;

            let optionValue = 0;
            if (details.type === 'CE') {
                optionValue = Math.max(0, atPrice - details.strike);
            } else { // PE
                optionValue = Math.max(0, details.strike - atPrice);
            }

            // For long positions: Current Value - Cost
            // For short positions: Premium Received - Current Value
            const pnl = isLong ?
                (optionValue - position.average_price) * quantity :
                (position.average_price - optionValue) * quantity;

            return total + pnl;
        }, 0);
    };

    // Sample price points to find approximate breakeven regions
    const samplePoints = [];
    const minStrike = Math.min(...optionPositions.map(p => extractOptionDetails(p.tradingsymbol)?.strike || currentPrice));
    const maxStrike = Math.max(...optionPositions.map(p => extractOptionDetails(p.tradingsymbol)?.strike || currentPrice));
    const range = maxStrike - minStrike;

    // Create price points from 20% below min strike to 20% above max strike
    const startPrice = minStrike * 0.8;
    const endPrice = maxStrike * 1.2;
    const step = range / 100; // 100 sample points

    for (let price = startPrice; price <= endPrice; price += step) {
        const pnl = calculateTotalPnL(price);
        samplePoints.push({ price, pnl });
    }

    // Find where P&L crosses zero
    const breakevenPoints = [];
    for (let i = 1; i < samplePoints.length; i++) {
        const prev = samplePoints[i - 1];
        const curr = samplePoints[i];

        // If P&L crosses zero between these points
        if ((prev.pnl <= 0 && curr.pnl > 0) || (prev.pnl >= 0 && curr.pnl < 0)) {
            // Linear interpolation to find more precise breakeven
            const ratio = Math.abs(prev.pnl) / (Math.abs(prev.pnl) + Math.abs(curr.pnl));
            const breakeven = prev.price + (curr.price - prev.price) * ratio;
            breakevenPoints.push(Math.round(breakeven * 100) / 100);
        }
    }

    // Calculate net premium
    const totalNetPremium = optionPositions.reduce((sum, position) => {
        const quantity = Math.abs(position.quantity);
        return sum + (position.quantity > 0 ?
            -position.average_price * quantity : // Long positions pay premium
            position.average_price * quantity);  // Short positions receive premium
    }, 0);

    console.log('Breakeven calculation:', {
        currentPrice,
        breakevenPoints,
        totalNetPremium,
        samplePoints: samplePoints.filter((_, i) => i % 10 === 0) // Log every 10th point
    });

    return {
        breakevenPoints: breakevenPoints.sort((a, b) => a - b),
        netPremium: totalNetPremium,
        perLotPremium: totalNetPremium
    };
};

const StyledTableCell = ({ children, align = 'left', sx = {}, ...props }) => (
    <TableCell
        align={align}
        sx={{
            fontSize: '0.875rem',
            fontFamily: align === 'right' ? 'monospace' : 'inherit',
            py: 1.5,
            ...sx
        }}
        {...props}
    >
        {children}
    </TableCell>
);

const PositionTable = ({ positions, underlying }) => {
    const [expanded, setExpanded] = useState(true);

    // Calculate breakeven for the position group
    const breakeven = React.useMemo(() => {
        console.log('Calculating breakeven for:', underlying);
        console.log('Positions:', positions);

        const result = calculateBreakeven(positions);
        console.log('Breakeven calculation result:', result);
        return result;
    }, [positions, underlying]);

    // Add debug log for render
    console.log('PositionTable render:', {
        underlying,
        hasBreakeven: !!breakeven,
        breakevenPoints: breakeven?.breakevenPoints,
        netPremium: breakeven?.netPremium
    });

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
            // If position is closed, use the realized P&L
            if (position.is_closed) {
                return total + (Number(position.pnl) || 0);
            }

            // For open positions, use day_m2m if available
            if (position.day_m2m !== undefined && position.day_m2m !== null) {
                return total + Number(position.day_m2m);
            }

            // Fallback calculation if day_m2m is not available
            const lastPrice = Number(position.last_price) || 0;
            const closePrice = Number(position.close_price) || lastPrice;
            const quantity = Number(position.quantity) || 0;
            const positionType = getPositionType(position.tradingsymbol);
            const overnightQuantity = Number(position.overnight_quantity) || 0;
            const dayBuyQty = Number(position.day_buy_quantity) || 0;
            const daySellQty = Number(position.day_sell_quantity) || 0;
            const dayBuyPrice = Number(position.day_buy_price) || 0;
            const daySellPrice = Number(position.day_sell_price) || 0;
            const buyPrice = Number(position.buy_price) || 0;
            const sellPrice = Number(position.sell_price) || 0;

            let dayPnL = 0;

            // Calculate M2M for overnight positions
            if (overnightQuantity !== 0) {
                if (positionType === 'Future') {
                    // For long futures
                    if (overnightQuantity > 0) {
                        dayPnL += overnightQuantity * (lastPrice - closePrice);
                    }
                    // For short futures
                    else {
                        dayPnL += Math.abs(overnightQuantity) * (closePrice - lastPrice);
                    }
                } else if (positionType === 'Option') {
                    // For long options
                    if (overnightQuantity > 0) {
                        dayPnL += overnightQuantity * (lastPrice - closePrice);
                    }
                    // For short options - reversed calculation as profit is inverse of price movement
                    else {
                        dayPnL += Math.abs(overnightQuantity) * (lastPrice - closePrice) * -1;
                    }
                }
            }

            // Add realized P&L from intraday trades
            if (dayBuyQty > 0 || daySellQty > 0) {
                // Calculate realized P&L from completed trades
                const completedQty = Math.min(dayBuyQty, daySellQty);
                if (completedQty > 0) {
                    if (daySellQty >= dayBuyQty) {
                        // Buy then Sell
                        dayPnL += completedQty * (daySellPrice - dayBuyPrice);
                    } else {
                        // Sell then Buy (for short positions)
                        dayPnL += completedQty * (sellPrice - buyPrice);
                    }
                }

                // Calculate unrealized P&L for remaining intraday positions
                const remainingQty = dayBuyQty - daySellQty;
                if (remainingQty !== 0) {
                    if (positionType === 'Option') {
                        if (remainingQty > 0) {
                            // Long intraday option position
                            dayPnL += remainingQty * (lastPrice - dayBuyPrice);
                        } else {
                            // Short intraday option position
                            dayPnL += Math.abs(remainingQty) * (dayBuyPrice - lastPrice);
                        }
                    } else {
                        if (remainingQty > 0) {
                            // Long intraday future position
                            dayPnL += remainingQty * (lastPrice - dayBuyPrice);
                        } else {
                            // Short intraday future position
                            dayPnL += Math.abs(remainingQty) * (daySellPrice - lastPrice);
                        }
                    }
                }
            }

            console.log('Day P&L calculation:', {
                symbol: position.tradingsymbol,
                type: positionType,
                quantity,
                overnightQuantity,
                dayBuyQty,
                daySellQty,
                lastPrice,
                closePrice,
                dayBuyPrice,
                daySellPrice,
                dayPnL,
                day_m2m: position.day_m2m,
                isShortOption: positionType === 'Option' && (overnightQuantity < 0 || quantity < 0)
            });

            return total + dayPnL;
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
                if (positionType === 'Option') {
                    if (quantity > 0) {  // Long options
                        dayPnL = (lastPrice - closePrice) * quantity;
                    } else {  // Short options
                        dayPnL = (closePrice - lastPrice) * Math.abs(quantity);
                    }
                } else {
                    // For stocks and other instruments
                    const isLong = position.buy_quantity > position.sell_quantity;
                    dayPnL = ((lastPrice - closePrice) * quantity * (isLong ? 1 : -1));
                }
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
                    bgcolor: position.is_closed ? 'grey.50' : 'background.paper',
                    '&:hover': {
                        bgcolor: position.is_closed ? 'grey.100' : 'grey.50'
                    }
                }}
            >
                <StyledTableCell>{position.tradingsymbol}</StyledTableCell>
                <StyledTableCell>
                    <Chip
                        label={getPositionType(position.tradingsymbol)}
                        size="small"
                        sx={{
                            bgcolor: 'secondary.50',
                            color: 'secondary.main',
                            fontSize: '0.75rem',
                            height: '24px'
                        }}
                    />
                </StyledTableCell>
                <StyledTableCell
                    align="right"
                    sx={{
                        color: isNegativeQuantity ? 'error.main' : 'inherit'
                    }}
                >
                    {quantity}
                </StyledTableCell>
                <StyledTableCell align="right">
                    {formatCurrency(position.average_price)}
                </StyledTableCell>
                <StyledTableCell align="right">
                    {formatCurrency(position.is_closed ? position.closing_price : position.last_price)}
                </StyledTableCell>
                <StyledTableCell
                    align="right"
                    sx={{
                        color: dayPnL >= 0 ? 'success.main' : 'error.main'
                    }}
                >
                    {formatCurrency(dayPnL)}
                </StyledTableCell>
                <StyledTableCell
                    align="right"
                    sx={{
                        color: totalPnL >= 0 ? 'success.main' : 'error.main'
                    }}
                >
                    {formatCurrency(totalPnL)}
                </StyledTableCell>
                <StyledTableCell
                    align="right"
                    sx={{
                        color: position.pnl >= 0 ? 'success.main' : 'error.main'
                    }}
                >
                    {formatPercentage(calculateChangePercentage(position))}
                </StyledTableCell>
            </TableRow>
        );
    };

    return (
        <Box sx={{ mb: 3 }}>
            <Box
                sx={{
                    cursor: 'pointer',
                    bgcolor: 'background.paper',
                    borderLeft: '4px solid',
                    borderLeftColor: 'primary.main',
                    '&:hover': {
                        bgcolor: 'grey.50'
                    }
                }}
                onClick={() => setExpanded(!expanded)}
            >
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 2,
                    px: 3,
                    gap: 2,
                    flexWrap: 'nowrap'
                }}>
                    {/* Left section - Asset Name */}
                    <Box sx={{ minWidth: '150px', flexShrink: 0 }}>
                        <Typography
                            variant="h6"
                            sx={{
                                color: 'text.primary',
                                fontWeight: 500
                            }}
                        >
                            {underlying}
                        </Typography>
                    </Box>

                    {/* Middle section - Breakeven and Premium Info */}
                    {breakeven && (
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            flex: 1,
                            overflow: 'hidden'
                        }}>
                            <Box sx={{
                                fontFamily: 'monospace',
                                bgcolor: 'grey.50',
                                px: 2,
                                py: 1,
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                                fontWeight: 500,
                                whiteSpace: 'nowrap'
                            }}>
                                {breakeven.breakevenPoints.length > 0
                                    ? `Breakeven: ↓${formatCurrency(breakeven.breakevenPoints[0])} / ↑${formatCurrency(breakeven.breakevenPoints[1])}`
                                    : 'Unable to show BE'}
                            </Box>
                            <Box sx={{
                                color: 'text.secondary',
                                fontFamily: 'monospace',
                                whiteSpace: 'nowrap'
                            }}>
                                Net Premium: {formatCurrency(breakeven.netPremium)}
                            </Box>
                        </Box>
                    )}

                    {/* Right section - P&L Info */}
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        justifyContent: 'flex-end',
                        minWidth: '350px',
                        flexShrink: 0
                    }}>
                        <Box
                            sx={{
                                fontFamily: 'monospace',
                                color: calculateDayPnL() >= 0 ? 'success.main' : 'error.main',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            Day: {formatCurrency(calculateDayPnL())}
                        </Box>
                        <Box
                            sx={{
                                fontFamily: 'monospace',
                                color: calculateTotalPnL() >= 0 ? 'success.main' : 'error.main',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            Total: {formatCurrency(calculateTotalPnL())}
                        </Box>
                        <IconButton
                            size="small"
                            sx={{
                                color: 'action.active',
                                '&:hover': {
                                    bgcolor: 'grey.100'
                                }
                            }}
                        >
                            {expanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                    </Box>
                </Box>
            </Box>

            {expanded && (
                <TableContainer
                    component={Paper}
                    elevation={0}
                    sx={{
                        mt: 1,
                        border: '1px solid',
                        borderColor: 'divider'
                    }}
                >
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                                <StyledTableCell>Symbol</StyledTableCell>
                                <StyledTableCell>Position Type</StyledTableCell>
                                <StyledTableCell align="right">Quantity</StyledTableCell>
                                <StyledTableCell align="right">Avg. Price</StyledTableCell>
                                <StyledTableCell align="right">LTP</StyledTableCell>
                                <StyledTableCell align="right">Day's P&L</StyledTableCell>
                                <StyledTableCell align="right">Total P&L</StyledTableCell>
                                <StyledTableCell align="right">Change %</StyledTableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {openPositions.map(renderPositionRow)}
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
            <Box
                sx={{
                    textAlign: 'center',
                    py: 8,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    border: '1px dashed',
                    borderColor: 'divider'
                }}
            >
                <Typography
                    variant="h6"
                    sx={{
                        color: 'text.secondary',
                        fontWeight: 500,
                        mb: 1
                    }}
                >
                    No Positions
                </Typography>
                <Typography
                    variant="body2"
                    sx={{
                        color: 'text.secondary'
                    }}
                >
                    You don't have any open or closed positions for today.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: '1400px', mx: 'auto', px: 2 }}>
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 4,
                pt: 2,
                pb: 3,
                borderBottom: '1px solid',
                borderColor: 'divider'
            }}>
                <Typography
                    variant="h5"
                    component="h1"
                    sx={{
                        fontWeight: 500,
                        color: 'text.primary',
                        letterSpacing: '-0.5px'
                    }}
                >
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