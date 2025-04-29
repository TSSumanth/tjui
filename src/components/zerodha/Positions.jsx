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
    TextField,
    Menu,
    MenuItem,
    Popper,
    ClickAwayListener,
    Grow,
    FormControl,
    InputLabel,
    Select
} from '@mui/material';
import { useZerodha } from '../../context/ZerodhaContext';
import { ExpandLess, ExpandMore, MoreVert, Close } from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatters';
import { placeOrder, createClosePositionOrder } from '../../services/zerodha/api';
import OrderPopup from './OrderPopup';

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

    // Find CE and PE positions
    const cePosition = optionPositions.find(pos => pos.tradingsymbol.endsWith('CE'));
    const pePosition = optionPositions.find(pos => pos.tradingsymbol.endsWith('PE'));

    // Calculate total premium paid across all positions
    const totalPremium = optionPositions.reduce((sum, pos) => {
        const quantity = parseInt(pos.quantity) || 0;
        const premium = parseFloat(pos.average_price) || 0;
        const positionPremium = pos.quantity > 0 ? premium * quantity : -premium * quantity;
        return sum + positionPremium;
    }, 0);

    let upsideBreakeven = null;
    let downsideBreakeven = null;

    if (cePosition) {
        const optionDetails = extractOptionDetails(cePosition.tradingsymbol);
        if (optionDetails) {
            const ceStrike = optionDetails.strike;
            const ceQuantity = parseInt(cePosition.quantity) || 0;
            if (ceQuantity > 0) {
                // For CE: Strike Price + (Total Premium / CE Quantity)
                upsideBreakeven = ceStrike + (totalPremium / ceQuantity);
            }
        }
    }

    if (pePosition) {
        const optionDetails = extractOptionDetails(pePosition.tradingsymbol);
        if (optionDetails) {
            const peStrike = optionDetails.strike;
            const peQuantity = parseInt(pePosition.quantity) || 0;
            if (peQuantity > 0) {
                // For PE: Strike Price - (Total Premium / PE Quantity)
                downsideBreakeven = peStrike - (totalPremium / peQuantity);
            }
        }
    }

    // Only return breakeven points if we have valid calculations
    const breakevenPoints = [downsideBreakeven, upsideBreakeven].filter(point => point !== null && !isNaN(point));
    if (breakevenPoints.length === 0) {
        return {
            breakevenPoints: [],
            netPremium: totalPremium,
            perLotPremium: totalPremium,
            currentPrice: positions[0]?.last_price
        };
    }

    return {
        breakevenPoints: breakevenPoints.sort((a, b) => a - b),
        netPremium: totalPremium,
        perLotPremium: totalPremium,
        currentPrice: positions[0]?.last_price
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
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const [selectedPosition, setSelectedPosition] = useState(null);

    // Calculate P&L values
    const { dayPnL, totalPnL } = React.useMemo(() => {
        return positions.reduce((acc, position) => {
            // Day P&L calculation
            if (position.day_m2m !== undefined && position.day_m2m !== null) {
                acc.dayPnL += Number(position.day_m2m);
            } else {
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

            // Total P&L calculation
            acc.totalPnL += Number(position.pnl) || 0;

            return acc;
        }, { dayPnL: 0, totalPnL: 0 });
    }, [positions]);

    const handleMenuClick = (event, position) => {
        event.stopPropagation();
        setMenuAnchorEl(event.currentTarget);
        setSelectedPosition(position);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
        setSelectedPosition(null);
    };

    const handleClosePosition = () => {
        if (!selectedPosition) {
            console.warn('No position selected for closing');
            return;
        }

        console.log('Closing position:', selectedPosition);
        const menuButton = menuAnchorEl;
        handleMenuClose();
        onOpenOrderDialog(menuButton, selectedPosition, underlying, false, false);
    };

    const handleAddMore = () => {
        if (!selectedPosition) {
            console.warn('No position selected for adding');
            return;
        }

        console.log('Adding to position:', selectedPosition);
        const menuButton = menuAnchorEl;
        handleMenuClose();
        onOpenOrderDialog(menuButton, selectedPosition, underlying, true, false);
    };

    const handleStopLoss = () => {
        if (!selectedPosition) {
            console.warn('No position selected for stop loss');
            return;
        }

        console.log('Setting stop loss for position:', selectedPosition);
        const menuButton = menuAnchorEl;
        handleMenuClose();
        onOpenOrderDialog(menuButton, selectedPosition, underlying, false, true);
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
                        <>
                            <IconButton
                                size="small"
                                onClick={(e) => handleMenuClick(e, position)}
                                disabled={loadingPositions[position.tradingsymbol]}
                            >
                                <MoreVert fontSize="small" />
                            </IconButton>
                            <Menu
                                anchorEl={menuAnchorEl}
                                open={Boolean(menuAnchorEl) && selectedPosition?.tradingsymbol === position.tradingsymbol}
                                onClose={handleMenuClose}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'right',
                                }}
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                            >
                                <MenuItem onClick={handleClosePosition}>
                                    <Typography variant="body2">Close Position</Typography>
                                </MenuItem>
                                <MenuItem onClick={handleAddMore}>
                                    <Typography variant="body2">Add More</Typography>
                                </MenuItem>
                                <MenuItem onClick={handleStopLoss}>
                                    <Typography variant="body2">Stop Loss Order</Typography>
                                </MenuItem>
                            </Menu>
                        </>
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
                    {calculateBreakeven(positions) && (
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
                                {calculateBreakeven(positions).breakevenPoints.length > 0
                                    ? `Breakeven: ↓${formatCurrency(calculateBreakeven(positions).breakevenPoints[0])} / ↑${formatCurrency(calculateBreakeven(positions).breakevenPoints[1])}`
                                    : 'Unable to show BE'}
                            </Box>
                            <Box sx={{
                                color: 'text.secondary',
                                fontFamily: 'monospace',
                                whiteSpace: 'nowrap'
                            }}>
                                Net Premium: {formatCurrency(calculateBreakeven(positions).netPremium)}
                            </Box>
                            <Box sx={{
                                color: 'text.secondary',
                                fontFamily: 'monospace',
                                whiteSpace: 'nowrap'
                            }}>
                                Current: {formatCurrency(calculateBreakeven(positions).currentPrice)}
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
                            {positions.map(renderPositionRow)}
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
        anchorEl: null,
        position: null,
        quantity: '',
        price: '',
        underlying: '',
        isAdding: false
    });
    const [loadingPositions, setLoadingPositions] = useState({});
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Refs for dialog state management
    const dialogStateRef = React.useRef(null);
    const lastPositionRef = React.useRef(null);
    const isDialogOpenRef = React.useRef(false);
    const positionUpdateCount = React.useRef(0);

    // Process positions data with memoization
    const { dayPositions, netPositions } = React.useMemo(() => {
        console.log('Positions memo update:', {
            hasPositions: !!positions,
            hasDay: !!positions?.day,
            hasNet: !!positions?.net,
            dialogOpen: isDialogOpenRef.current,
            dialogState: dialogStateRef.current,
            lastPosition: lastPositionRef.current
        });

        if (!positions || !positions.day || !positions.net) {
            return { dayPositions: [], netPositions: [] };
        }

        return {
            dayPositions: positions.day,
            netPositions: positions.net
        };
    }, [positions]);

    // Effect to sync dialog state with refs
    React.useEffect(() => {
        if (orderDialog.open !== isDialogOpenRef.current) {
            console.log('Dialog state changed:', {
                newState: orderDialog.open,
                oldState: isDialogOpenRef.current,
                hasDialogState: !!dialogStateRef.current,
                hasLastPosition: !!lastPositionRef.current
            });
            isDialogOpenRef.current = orderDialog.open;
        }
    }, [orderDialog.open]);

    const handleOpenOrderDialog = (anchorEl, position, underlying, isAdding = false, isStopLoss = false) => {
        console.log('Opening order dialog with data:', {
            tradingsymbol: position?.tradingsymbol,
            quantity: position?.quantity,
            position,
            underlying,
            isAdding,
            isStopLoss
        });

        // Enhanced validation
        if (!position) {
            console.error('Position object is null or undefined');
            return;
        }

        if (!position.tradingsymbol) {
            console.error('Invalid position data: missing tradingsymbol', position);
            return;
        }

        if (typeof position.quantity === 'undefined' || position.quantity === null) {
            console.error('Invalid position data: missing or invalid quantity', position);
            return;
        }

        // Ensure quantity is a number
        const quantity = Math.abs(Number(position.quantity));
        if (isNaN(quantity)) {
            console.error('Invalid position data: quantity is not a valid number', position);
            return;
        }

        // Determine transaction type based on action
        const isLong = position.quantity > 0;
        let transactionType;
        if (isAdding) {
            // For adding, use same direction as current position
            transactionType = isLong ? 'BUY' : 'SELL';
        } else if (isStopLoss) {
            // For stop loss, use opposite direction
            transactionType = isLong ? 'SELL' : 'BUY';
        } else {
            // For closing, use opposite direction
            transactionType = isLong ? 'SELL' : 'BUY';
        }

        const dialogState = {
            open: true,
            anchorEl,
            position,
            quantity: quantity.toString(),
            price: position.last_price?.toString() || '',
            underlying,
            isAdding: Boolean(isAdding),
            isStopLoss: Boolean(isStopLoss),
            transactionType
        };

        console.log('Setting dialog state:', dialogState);

        setOrderDialog(dialogState);
        dialogStateRef.current = dialogState;
        lastPositionRef.current = position;
        isDialogOpenRef.current = true;
    };

    // Effect to handle position updates
    React.useEffect(() => {
        if (!positions || !orderDialog.open || !orderDialog.position?.tradingsymbol) return;

        const currentPosition = orderDialog.position;
        const allPositions = [...(positions?.net || []), ...(positions?.day || [])];
        const updatedPosition = allPositions.find(p => p.tradingsymbol === currentPosition.tradingsymbol);

        console.log('Position update check:', {
            dialogOpen: orderDialog.open,
            currentSymbol: currentPosition.tradingsymbol,
            foundUpdatedPosition: !!updatedPosition,
            updatedPosition
        });

        if (updatedPosition) {
            setOrderDialog(prev => ({
                ...prev,
                position: {
                    ...updatedPosition,
                    average_price: currentPosition.average_price || updatedPosition.average_price,
                    quantity: currentPosition.quantity || updatedPosition.quantity,
                    product: currentPosition.product || updatedPosition.product,
                    exchange: currentPosition.exchange || updatedPosition.exchange
                }
            }));
        }
    }, [positions]);

    const handleCloseOrderDialog = () => {
        console.log('Closing order dialog');
        dialogStateRef.current = null;
        lastPositionRef.current = null;
        isDialogOpenRef.current = false;
        setOrderDialog(prev => ({
            ...prev,
            open: false,
            anchorEl: null,
            position: null,
            quantity: '',
            price: '',
            underlying: '',
            isAdding: false
        }));
    };

    const handleClosePosition = async (orderType = 'MARKET', triggerPrice = '') => {
        if (!orderDialog.position) return;

        const { position, quantity, price, isAdding } = orderDialog;
        const tradingsymbol = position.tradingsymbol;

        // Check if we're in market hours
        const now = new Date();
        const day = now.getDay();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const currentTime = hours * 100 + minutes;
        const isMarketOpen = day !== 0 && day !== 6 && currentTime >= 915 && currentTime <= 1530;

        if (!isMarketOpen) {
            setSnackbar({
                open: true,
                message: 'Markets are closed. Trading hours are Monday to Friday, 9:15 AM to 3:30 PM IST.',
                severity: 'warning'
            });
            return;
        }

        setLoadingPositions(prev => ({ ...prev, [tradingsymbol]: true }));
        try {
            let orderParams;
            if (isAdding) {
                orderParams = {
                    tradingsymbol: position.tradingsymbol,
                    exchange: position.exchange,
                    transaction_type: position.quantity > 0 ? 'BUY' : 'SELL',
                    order_type: orderType,
                    quantity: parseInt(quantity, 10),
                    product: position.product,
                    validity: 'DAY',
                    ...(price && { price: parseFloat(price) }),
                    ...(triggerPrice && { trigger_price: parseFloat(triggerPrice) })
                };
            } else {
                orderParams = {
                    ...createClosePositionOrder(position),
                    quantity: parseInt(quantity, 10),
                    order_type: orderType,
                    ...(price && { price: parseFloat(price) }),
                    ...(triggerPrice && { trigger_price: parseFloat(triggerPrice) })
                };
            }

            const response = await placeOrder(orderParams);
            if (response.success) {
                setSnackbar({
                    open: true,
                    message: `Successfully placed ${isAdding ? 'add' : 'close'} order for ${tradingsymbol}`,
                    severity: 'success'
                });
                dialogStateRef.current = null;
                lastPositionRef.current = null;
                isDialogOpenRef.current = false;
                handleCloseOrderDialog();
            } else {
                throw new Error(response.message || 'Failed to place order');
            }
        } catch (error) {
            console.error('Error handling position:', error);
            setSnackbar({
                open: true,
                message: error.message || 'Failed to place order',
                severity: 'error'
            });
        } finally {
            setLoadingPositions(prev => ({ ...prev, [tradingsymbol]: false }));
        }
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

    // Memoize the position table to prevent unnecessary re-renders
    const positionTables = React.useMemo(() => {
        return Object.entries(groupedPositions).map(([underlying, { openPositions, closedPositions }]) => (
            <PositionTable
                key={underlying}
                positions={[...openPositions, ...closedPositions]}
                underlying={underlying}
                onOpenOrderDialog={handleOpenOrderDialog}
                loadingPositions={loadingPositions}
            />
        ));
    }, [groupedPositions, loadingPositions]);

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

            {positionTables}

            {orderDialog.open && !!orderDialog.position?.tradingsymbol && (
                <OrderPopup
                    open={orderDialog.open}
                    anchorEl={orderDialog.anchorEl}
                    onClose={handleCloseOrderDialog}
                    position={orderDialog.position}
                    quantity={orderDialog.quantity}
                    price={orderDialog.price}
                    underlying={orderDialog.underlying}
                    isAdding={orderDialog.isAdding}
                    onQuantityChange={(e) => setOrderDialog(prev => ({ ...prev, quantity: e.target.value }))}
                    onPriceChange={(e) => setOrderDialog(prev => ({ ...prev, price: e.target.value }))}
                    onSubmit={handleClosePosition}
                    loading={loadingPositions[orderDialog.position?.tradingsymbol]}
                    isStopLoss={orderDialog.isStopLoss}
                />
            )}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <MuiAlert
                    elevation={6}
                    variant="filled"
                    severity={snackbar.severity}
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                >
                    {snackbar.message}
                </MuiAlert>
            </Snackbar>
        </Box>
    );
};

export default Positions; 