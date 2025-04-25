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
    Snackbar,
    Alert as MuiAlert,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField
} from '@mui/material';
import { useZerodha } from '../../context/ZerodhaContext';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatters';
import { placeOrder, createClosePositionOrder } from '../../services/zerodha/api';

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
    // Early return for non-option symbols
    if (!tradingsymbol || !tradingsymbol.endsWith('CE') && !tradingsymbol.endsWith('PE')) {
        return null;
    }

    // Cache the regex pattern
    const optionPattern = /([A-Z]+)(\d{2}[A-Z]+)(\d+)(CE|PE)/;

    try {
        const match = tradingsymbol.match(optionPattern);
        if (!match) return null;

        return {
            symbol: match[1],
            expiry: match[2],
            strike: parseFloat(match[3]),
            type: match[4]
        };
    } catch (error) {
        console.warn('Error parsing option details:', error);
        return null;
    }
};

const calculateBreakeven = (positions) => {
    // Early return if futures positions are present
    const hasFutures = positions.some(p => p.tradingsymbol.endsWith('FUT'));
    if (hasFutures) return null;

    // Early return if no option positions
    const optionPositions = positions.filter(p => p.tradingsymbol.endsWith('CE') || p.tradingsymbol.endsWith('PE'));
    if (optionPositions.length === 0) return null;

    // Calculate net premium first
    const totalNetPremium = optionPositions.reduce((sum, position) => {
        const quantity = Math.abs(position.quantity);
        return sum + (position.quantity > 0 ?
            -position.average_price * quantity :
            position.average_price * quantity);
    }, 0);

    // If all positions are closed or squared off, return early
    if (optionPositions.every(p => p.quantity === 0)) {
        return {
            breakevenPoints: [],
            netPremium: totalNetPremium,
            perLotPremium: totalNetPremium
        };
    }

    // Get current underlying price
    const currentPrice = positions[0].last_price;
    if (!currentPrice) return null;

    // Pre-process option details
    const optionDetails = optionPositions.map(position => {
        const details = extractOptionDetails(position.tradingsymbol);
        if (!details) return null;

        return {
            ...details,
            quantity: Math.abs(position.quantity),
            isLong: position.quantity > 0,
            averagePrice: position.average_price
        };
    }).filter(Boolean);

    if (optionDetails.length === 0) return null;

    // Find min and max strike prices
    const strikes = optionDetails.map(d => d.strike);
    const minStrike = Math.min(...strikes);
    const maxStrike = Math.max(...strikes);
    const range = maxStrike - minStrike;

    // Create sample points with wider range
    const samplePoints = [];
    const startPrice = Math.max(0, minStrike - range * 1.0); // Increased range significantly
    const endPrice = maxStrike + range * 1.0; // Increased range significantly
    const step = range / 100; // More sample points for accuracy

    // Calculate P&L at each price point
    for (let price = startPrice; price <= endPrice; price += step) {
        const pnl = optionDetails.reduce((total, option) => {
            let optionValue = 0;
            if (option.type === 'CE') {
                optionValue = Math.max(0, price - option.strike);
            } else {
                optionValue = Math.max(0, option.strike - price);
            }

            const pnl = option.isLong ?
                (optionValue - option.averagePrice) * option.quantity :
                (option.averagePrice - optionValue) * option.quantity;

            return total + pnl;
        }, 0);

        samplePoints.push({ price, pnl });
    }

    // Find breakeven points with improved logic
    const breakevenPoints = [];
    let lastSign = Math.sign(samplePoints[0].pnl);

    for (let i = 1; i < samplePoints.length; i++) {
        const currentSign = Math.sign(samplePoints[i].pnl);

        if (currentSign !== lastSign) {
            const prev = samplePoints[i - 1];
            const curr = samplePoints[i];

            // Linear interpolation to find exact breakeven point
            const ratio = Math.abs(prev.pnl) / (Math.abs(prev.pnl) + Math.abs(curr.pnl));
            const breakeven = prev.price + (curr.price - prev.price) * ratio;
            breakevenPoints.push(Math.round(breakeven * 100) / 100);

            lastSign = currentSign;
        }
    }

    // Sort and ensure we have both upper and lower breakeven points
    const sortedBreakevenPoints = breakevenPoints.sort((a, b) => a - b);

    // If we only have one breakeven point, we need to find the other one
    if (sortedBreakevenPoints.length === 1) {
        const singlePoint = sortedBreakevenPoints[0];
        const totalPnL = optionDetails.reduce((sum, option) => {
            const pnl = option.isLong ?
                -option.averagePrice * option.quantity :
                option.averagePrice * option.quantity;
            return sum + pnl;
        }, 0);

        // If total P&L is positive, we need a lower breakeven
        // If total P&L is negative, we need an upper breakeven
        if (totalPnL > 0) {
            sortedBreakevenPoints.unshift(0); // Add lower breakeven at 0
        } else {
            sortedBreakevenPoints.push(maxStrike * 2); // Add upper breakeven at 2x max strike
        }
    }

    return {
        breakevenPoints: sortedBreakevenPoints,
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

const PositionTable = ({ positions, underlying, onOpenOrderDialog, loadingPositions }) => {
    const [expanded, setExpanded] = useState(true);

    // Memoize breakeven calculation
    const breakeven = React.useMemo(() => {
        return calculateBreakeven(positions);
    }, [positions]);

    // Memoize position processing
    const { openPositions, closedPositions, dayPnL, totalPnL } = React.useMemo(() => {
        const result = positions.reduce((acc, position) => {
            const isSquaredOff = position.quantity === 0 &&
                (position.day_buy_quantity > 0 || position.day_sell_quantity > 0);

            const hasOvernightPosition = position.overnight_quantity !== 0;
            const isOvernightSquaredOff = hasOvernightPosition && (
                (position.overnight_quantity > 0 && position.day_sell_quantity === position.overnight_quantity) ||
                (position.overnight_quantity < 0 && position.day_buy_quantity === Math.abs(position.overnight_quantity))
            );

            const isClosed = isSquaredOff || isOvernightSquaredOff;

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

            // Calculate P&L
            if (position.is_closed) {
                acc.totalPnL += Number(position.pnl) || 0;
            } else if (position.day_m2m !== undefined && position.day_m2m !== null) {
                acc.dayPnL += Number(position.day_m2m);
            } else {
                // Calculate day P&L based on position type
                const lastPrice = Number(position.last_price) || 0;
                const closePrice = Number(position.close_price) || lastPrice;
                const quantity = Number(position.quantity) || 0;
                const positionType = getPositionType(position.tradingsymbol);

                if (positionType === 'Future' || positionType === 'Option') {
                    acc.dayPnL += quantity * (lastPrice - closePrice);
                } else {
                    const isLong = position.buy_quantity > position.sell_quantity;
                    acc.dayPnL += quantity * (lastPrice - closePrice) * (isLong ? 1 : -1);
                }
            }

            return acc;
        }, { openPositions: [], closedPositions: [], dayPnL: 0, totalPnL: 0 });

        return result;
    }, [positions]);

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
                <StyledTableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {position.tradingsymbol}
                        {position.is_closed && (
                            <Chip
                                label="Closed"
                                size="small"
                                sx={{
                                    height: '20px',
                                    fontSize: '0.75rem',
                                    bgcolor: 'grey.200',
                                    color: 'text.secondary',
                                    '& .MuiChip-label': { px: 1 }
                                }}
                            />
                        )}
                    </Box>
                </StyledTableCell>
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
                <StyledTableCell align="right">
                    {position.is_closed ? (
                        <Typography
                            variant="body2"
                            sx={{
                                color: 'text.secondary',
                                fontStyle: 'italic'
                            }}
                        >
                            Squared Off
                        </Typography>
                    ) : (
                        <Button
                            variant="contained"
                            color="error"
                            size="small"
                            onClick={() => onOpenOrderDialog(position)}
                            disabled={loadingPositions[position.tradingsymbol]}
                        >
                            {loadingPositions[position.tradingsymbol] ? (
                                <CircularProgress size={20} color="inherit" />
                            ) : (
                                'Close'
                            )}
                        </Button>
                    )}
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
                            <Box sx={{
                                color: 'text.secondary',
                                fontFamily: 'monospace',
                                whiteSpace: 'nowrap'
                            }}>
                                Current: {formatCurrency(breakeven.currentPrice)}
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
                                color: dayPnL >= 0 ? 'success.main' : 'error.main',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            Day: {formatCurrency(dayPnL)}
                        </Box>
                        <Box
                            sx={{
                                fontFamily: 'monospace',
                                color: totalPnL >= 0 ? 'success.main' : 'error.main',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            Total: {formatCurrency(totalPnL)}
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
                                <StyledTableCell align="right">Action</StyledTableCell>
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
    const [orderDialog, setOrderDialog] = useState({
        open: false,
        position: null,
        quantity: '',
        price: '',
        underlying: ''
    });
    const [loadingPositions, setLoadingPositions] = useState({});
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Ref to track if dialog should stay open
    const dialogShouldStayOpen = React.useRef(false);

    // Track previous positions for comparison
    const previousPositions = React.useRef(positions);

    // Process positions data
    const { dayPositions, netPositions } = React.useMemo(() => {
        if (!positions || !positions.day || !positions.net) {
            return { dayPositions: [], netPositions: [] };
        }

        // Check if this is a position update
        if (previousPositions.current !== positions && orderDialog.open) {
            console.log('Positions updated while dialog is open');
            dialogShouldStayOpen.current = true;
        }
        previousPositions.current = positions;

        return {
            dayPositions: positions.day,
            netPositions: positions.net
        };
    }, [positions]);

    // Effect to handle position updates while dialog is open
    React.useEffect(() => {
        if (!dialogShouldStayOpen.current) return;

        console.log('Handling position update with dialog open');
        const currentPosition = orderDialog.position;
        if (!currentPosition) return;

        const allPositions = [...(positions?.net || []), ...(positions?.day || [])];
        const updatedPosition = allPositions.find(p => p.tradingsymbol === currentPosition.tradingsymbol);

        if (updatedPosition) {
            console.log('Updating dialog with new position data');
            setOrderDialog(prev => ({
                ...prev,
                position: updatedPosition,
                // Preserve user input if it exists
                quantity: prev.quantity || Math.abs(updatedPosition.quantity).toString(),
                price: prev.price || updatedPosition.last_price?.toString() || ''
            }));
        }

        dialogShouldStayOpen.current = false;
    }, [positions]);

    const handleOpenOrderDialog = (position, underlying) => {
        console.log('Opening order dialog for:', position.tradingsymbol);
        dialogShouldStayOpen.current = true;
        setOrderDialog({
            open: true,
            position,
            underlying,
            quantity: Math.abs(position.quantity).toString(),
            price: position.last_price?.toString() || ''
        });
    };

    const handleCloseOrderDialog = () => {
        console.log('Explicitly closing order dialog');
        dialogShouldStayOpen.current = false;
        setOrderDialog({
            open: false,
            position: null,
            quantity: '',
            price: '',
            underlying: ''
        });
    };

    const handleQuantityChange = (event) => {
        const value = event.target.value;
        if (value === '' || /^\d*$/.test(value)) {
            setOrderDialog(prev => ({
                ...prev,
                quantity: value
            }));
        }
    };

    const handlePriceChange = (event) => {
        const value = event.target.value;
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setOrderDialog(prev => ({
                ...prev,
                price: value
            }));
        }
    };

    const handleClosePosition = async () => {
        if (!orderDialog.position) return;

        const { position, quantity, price } = orderDialog;
        const tradingsymbol = position.tradingsymbol;

        setLoadingPositions(prev => ({ ...prev, [tradingsymbol]: true }));
        try {
            const orderParams = {
                ...createClosePositionOrder(position),
                quantity: parseInt(quantity, 10),
                order_type: price ? 'LIMIT' : 'MARKET',
                ...(price && { price: parseFloat(price) })
            };

            const response = await placeOrder(orderParams);
            if (response.success) {
                setSnackbar({
                    open: true,
                    message: `Successfully placed order for ${tradingsymbol}`,
                    severity: 'success'
                });
                dialogShouldStayOpen.current = false;
                handleCloseOrderDialog();
            } else {
                throw new Error(response.message || 'Failed to place order');
            }
        } catch (error) {
            console.error('Error closing position:', error);
            setSnackbar({
                open: true,
                message: error.message || 'Failed to place order',
                severity: 'error'
            });
        } finally {
            setLoadingPositions(prev => ({ ...prev, [tradingsymbol]: false }));
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

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
                    onOpenOrderDialog={(position) => handleOpenOrderDialog(position, underlying)}
                    loadingPositions={loadingPositions}
                />
            ))}

            <Dialog
                open={orderDialog.open}
                onClose={(event, reason) => {
                    console.log('Dialog onClose triggered:', reason);
                    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
                        console.log('Preventing automatic dialog close');
                        return;
                    }
                    if (!dialogShouldStayOpen.current) {
                        handleCloseOrderDialog();
                    } else {
                        console.log('Dialog kept open due to position update');
                    }
                }}
                maxWidth="sm"
                fullWidth
                disableEscapeKeyDown
                keepMounted
                sx={{
                    '& .MuiDialog-paper': {
                        minHeight: '300px'
                    }
                }}
            >
                <DialogTitle>
                    Close Position - {orderDialog.underlying}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            {orderDialog.position?.tradingsymbol}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            {orderDialog.position?.quantity > 0 ? 'SELL' : 'BUY'} {orderDialog.position?.product}
                        </Typography>
                        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                            <TextField
                                label="Quantity"
                                type="text"
                                value={orderDialog.quantity}
                                onChange={handleQuantityChange}
                                fullWidth
                                sx={{ mb: 2 }}
                                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                            />
                            <TextField
                                label="Price (Optional)"
                                type="text"
                                value={orderDialog.price}
                                onChange={handlePriceChange}
                                fullWidth
                                sx={{ mb: 2 }}
                                helperText="Leave empty for market order"
                                inputProps={{ inputMode: 'decimal', pattern: '[0-9]*\\.?[0-9]*' }}
                            />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            {orderDialog.price ? 'Limit Order' : 'Market Order'}
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseOrderDialog}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleClosePosition}
                        variant="contained"
                        color="primary"
                        disabled={!orderDialog.quantity || loadingPositions[orderDialog.position?.tradingsymbol]}
                    >
                        {loadingPositions[orderDialog.position?.tradingsymbol] ? (
                            <CircularProgress size={24} color="inherit" />
                        ) : (
                            'Place Order'
                        )}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <MuiAlert
                    elevation={6}
                    variant="filled"
                    severity={snackbar.severity}
                    onClose={handleCloseSnackbar}
                >
                    {snackbar.message}
                </MuiAlert>
            </Snackbar>
        </Box>
    );
};

export default Positions; 