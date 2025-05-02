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
    Box,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    LinearProgress,
    Skeleton
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
    const symbol = tradingsymbol.toUpperCase().trim();
    if (symbol.endsWith('FUT')) {
        return 'Future';
    } else if (/^[A-Z]+\d{2}[A-Z]+\d+(CE|PE)$/.test(symbol)) {
        // Matches typical option format: SYMBOL+DATE+STRIKE+CE/PE
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

const PositionTable = ({ positions, underlying, onOpenOrderDialog, loadingPositions, prevPositions }) => {
    // Initialize expanded state to true by default
    const [expanded, setExpanded] = useState(true);
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const { ltpMap } = useZerodha();

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

    // Handle smooth updates
    React.useEffect(() => {
        if (prevPositions && positions) {
            setIsUpdating(true);
            const timer = setTimeout(() => {
                setIsUpdating(false);
            }, 300); // Short animation duration
            return () => clearTimeout(timer);
        }
    }, [positions, prevPositions]);

    const handleMenuClick = (event, position) => {
        event.stopPropagation();
        setMenuAnchorEl(event.currentTarget);
        setSelectedPosition(position);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
        setSelectedPosition(null);
    };

    const handleMenuKeyDown = (event) => {
        if (event.key === 'Escape') {
            handleMenuClose();
        }
    };

    const handleClosePosition = () => {
        if (!selectedPosition) {
            return;
        }

        onOpenOrderDialog(menuAnchorEl, selectedPosition, underlying, false, false);
        handleMenuClose();
    };

    const handleAddMore = () => {
        if (!selectedPosition) {
            return;
        }

        onOpenOrderDialog(menuAnchorEl, selectedPosition, underlying, true, false);
        handleMenuClose();
    };

    const handleStopLoss = () => {
        if (!selectedPosition) {
            return;
        }

        onOpenOrderDialog(menuAnchorEl, selectedPosition, underlying, false, true);
        handleMenuClose();
    };

    const renderPositionRow = (position) => {
        const lastPrice = Number(position.last_price) || 0;
        const closePrice = Number(position.close_price) || lastPrice;
        const quantity = Number(position.quantity) || 0;
        const isNegativeQuantity = quantity < 0;
        const positionType = getPositionType(position.tradingsymbol);
        const isClosed = quantity === 0 || position.is_closed;

        // For closed positions, show total P&L in Day's P&L column
        let dayPnL;
        if (isClosed) {
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
                key={position.tradingsymbol + (isClosed ? '-closed' : '')}
                sx={{
                    bgcolor: isClosed ? 'grey.50' : 'background.paper',
                    '&:hover': {
                        bgcolor: isClosed ? 'grey.100' : 'grey.50'
                    },
                    transition: isUpdating ? 'background-color 0.3s ease' : 'none'
                }}
            >
                <StyledTableCell>
                    {position.tradingsymbol}
                    {isClosed && (
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
                        color: quantity < 0 ? 'error.main' : 'inherit',
                        transition: isUpdating ? 'color 0.3s ease' : 'none'
                    }}
                >
                    {quantity}
                </StyledTableCell>
                <StyledTableCell align="right">
                    {formatCurrency(position.average_price)}
                </StyledTableCell>
                <StyledTableCell align="right">
                    {formatCurrency(isClosed ? position.closing_price : position.last_price)}
                </StyledTableCell>
                <StyledTableCell
                    align="right"
                    sx={{
                        color: dayPnL >= 0 ? 'success.main' : 'error.main',
                        transition: isUpdating ? 'color 0.3s ease' : 'none'
                    }}
                >
                    {formatCurrency(dayPnL)}
                </StyledTableCell>
                <StyledTableCell
                    align="right"
                    sx={{
                        color: totalPnL >= 0 ? 'success.main' : 'error.main',
                        transition: isUpdating ? 'color 0.3s ease' : 'none'
                    }}
                >
                    {formatCurrency(totalPnL)}
                </StyledTableCell>
                <StyledTableCell
                    align="right"
                    sx={{
                        color: totalPnL >= 0 ? 'success.main' : 'error.main',
                        transition: isUpdating ? 'color 0.3s ease' : 'none'
                    }}
                >
                    {formatPercentage(calculateChangePercentage(position))}
                </StyledTableCell>
                <StyledTableCell align="right">
                    {isClosed ? (
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
                                aria-label={`Actions for ${position.tradingsymbol}`}
                                aria-haspopup="true"
                                aria-controls={Boolean(menuAnchorEl) && selectedPosition?.tradingsymbol === position.tradingsymbol ? `position-menu-${position.tradingsymbol}` : undefined}
                            >
                                <MoreVert fontSize="small" />
                            </IconButton>
                            <Menu
                                id={`position-menu-${position.tradingsymbol}`}
                                anchorEl={menuAnchorEl}
                                open={Boolean(menuAnchorEl) && selectedPosition?.tradingsymbol === position.tradingsymbol}
                                onClose={handleMenuClose}
                                onKeyDown={handleMenuKeyDown}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'right',
                                }}
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                MenuListProps={{
                                    'aria-labelledby': `position-menu-${position.tradingsymbol}`,
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
                    },
                    transition: isUpdating ? 'background-color 0.3s ease' : 'none'
                }}
                onClick={() => setExpanded(!expanded)}
            >
                {/* Header content */}
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
                    <Box sx={{ minWidth: '150px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography
                            variant="h6"
                            sx={{
                                color: 'text.primary',
                                fontWeight: 500
                            }}
                        >
                            {underlying}
                        </Typography>
                        {ltpMap && ltpMap[underlying] !== undefined && (
                            <Typography
                                variant="body2"
                                sx={{
                                    color: 'primary.main',
                                    fontFamily: 'monospace',
                                    fontWeight: 600,
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'primary.main',
                                    ml: 1
                                }}
                            >
                                LTP: {formatCurrency(ltpMap[underlying])}
                            </Typography>
                        )}
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
                                whiteSpace: 'nowrap',
                                transition: isUpdating ? 'background-color 0.3s ease' : 'none'
                            }}>
                                {calculateBreakeven(positions).breakevenPoints.length > 0
                                    ? `Breakeven: ↓${formatCurrency(calculateBreakeven(positions).breakevenPoints[0])} / ↑${formatCurrency(calculateBreakeven(positions).breakevenPoints[1])}`
                                    : 'Unable to show BE'}
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
                                whiteSpace: 'nowrap',
                                transition: isUpdating ? 'color 0.3s ease' : 'none'
                            }}
                        >
                            Day: {formatCurrency(dayPnL)}
                        </Box>
                        <Box
                            sx={{
                                fontFamily: 'monospace',
                                color: totalPnL >= 0 ? 'success.main' : 'error.main',
                                whiteSpace: 'nowrap',
                                transition: isUpdating ? 'color 0.3s ease' : 'none'
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

            {expanded && positions.length > 0 && (
                <TableContainer
                    component={Paper}
                    elevation={0}
                    sx={{
                        mt: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        transition: isUpdating ? 'border-color 0.3s ease' : 'none'
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
                            {positions.map(position => renderPositionRow(position))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
};

const Positions = () => {
    const { positions, loadingStates } = useZerodha();
    const [prevPositions, setPrevPositions] = React.useState(null);
    const [isInitialLoad, setIsInitialLoad] = React.useState(true);
    const [orderDialogAnchorEl, setOrderDialogAnchorEl] = React.useState(null);
    const [selectedPosition, setSelectedPosition] = React.useState(null);
    const [selectedUnderlying, setSelectedUnderlying] = React.useState(null);
    const [isAddingMore, setIsAddingMore] = React.useState(false);
    const [isStopLoss, setIsStopLoss] = React.useState(false);
    const [quantity, setQuantity] = React.useState('');
    const [price, setPrice] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    // Track initial load
    React.useEffect(() => {
        if (positions && positions.net && positions.net.length > 0) {
            setIsInitialLoad(false);
        }
    }, [positions]);

    // Update previous positions when positions change
    React.useEffect(() => {
        if (positions) {
            setPrevPositions(positions);
        }
    }, [positions]);

    const getTransactionType = (position, isAdding, isStopLoss) => {
        const isShortPosition = position.quantity < 0;

        if (isStopLoss) {
            // For short positions, stop-loss is a BUY order
            // For long positions, stop-loss is a SELL order
            return isShortPosition ? 'BUY' : 'SELL';
        }

        if (isAdding) {
            // When adding to position, use same direction as current position
            return isShortPosition ? 'SELL' : 'BUY';
        }

        // When closing position, use opposite direction of current position
        return isShortPosition ? 'BUY' : 'SELL';
    };

    const handleOpenOrderDialog = (anchorEl, position, underlying, isAdding, isStopLossOrder) => {
        setOrderDialogAnchorEl(anchorEl);
        setSelectedPosition(position);
        setSelectedUnderlying(underlying);
        setIsAddingMore(isAdding);
        setIsStopLoss(isStopLossOrder);
        setQuantity(Math.abs(position.quantity).toString());
        setPrice(position.last_price.toString());
    };

    const handleCloseOrderDialog = () => {
        setOrderDialogAnchorEl(null);
        setSelectedPosition(null);
        setSelectedUnderlying(null);
        setIsAddingMore(false);
        setIsStopLoss(false);
        setQuantity('');
        setPrice('');
        setLoading(false);
    };

    const handleQuantityChange = (e) => {
        setQuantity(e.target.value);
    };

    const handlePriceChange = (e) => {
        setPrice(e.target.value);
    };

    const handleSubmit = async (orderType, triggerPrice) => {
        if (!selectedPosition) return;

        setLoading(true);
        try {
            const transactionType = getTransactionType(selectedPosition, isAddingMore, isStopLoss);
            const isShortPosition = selectedPosition.quantity < 0;

            // Validate trigger price for stop-loss orders
            if (isStopLoss) {
                const lastPrice = parseFloat(selectedPosition.last_price);
                const triggerPriceNum = parseFloat(triggerPrice);

                if (transactionType === 'SELL' && triggerPriceNum >= lastPrice) {
                    throw new Error('For SELL stop-loss orders, trigger price must be lower than the last traded price');
                }
                if (transactionType === 'BUY' && triggerPriceNum <= lastPrice) {
                    throw new Error('For BUY stop-loss orders, trigger price must be higher than the last traded price');
                }
            }

            const order = {
                tradingsymbol: selectedPosition.tradingsymbol,
                exchange: selectedPosition.exchange,
                transaction_type: transactionType,
                order_type: orderType,
                quantity: parseInt(quantity),
                price: parseFloat(price),
                product: selectedPosition.product,
                trigger_price: triggerPrice ? parseFloat(triggerPrice) : undefined
            };

            await placeOrder(order);
            handleCloseOrderDialog();
        } catch (error) {
            alert(error.message || 'Failed to place order');
        } finally {
            setLoading(false);
        }
    };

    // Only show loading state on initial load
    if (isInitialLoad && loadingStates.positions) {
        return (
            <Box>
                <Box sx={{ width: '100%', mb: 2 }}>
                    <LinearProgress />
                </Box>
                {[1, 2, 3].map((i) => (
                    <Box key={i} sx={{ mb: 1 }}>
                        <Skeleton variant="rectangular" height={40} />
                    </Box>
                ))}
            </Box>
        );
    }

    if (!positions || !positions.net || positions.net.length === 0) {
        return (
            <Typography variant="body1" color="text.secondary" align="center" py={4}>
                No positions found
            </Typography>
        );
    }

    // Combine net and day positions, removing duplicates
    const allPositions = [...(positions.net || []), ...(positions.day || [])].filter(
        (position, index, self) => index === self.findIndex((p) => p.tradingsymbol === position.tradingsymbol)
    );

    // Group positions by underlying
    const groupedPositions = allPositions.reduce((acc, position) => {
        const underlying = getUnderlyingSymbol(position.tradingsymbol);
        if (!acc[underlying]) {
            acc[underlying] = [];
        }
        acc[underlying].push(position);
        return acc;
    }, {});

    return (
        <Box>
            {Object.entries(groupedPositions).map(([underlying, positions]) => (
                <PositionTable
                    key={underlying}
                    positions={positions}
                    underlying={underlying}
                    onOpenOrderDialog={handleOpenOrderDialog}
                    loadingPositions={{}}
                    prevPositions={prevPositions}
                />
            ))}

            {selectedPosition && (
                <OrderPopup
                    open={Boolean(orderDialogAnchorEl)}
                    onClose={handleCloseOrderDialog}
                    position={selectedPosition}
                    quantity={quantity}
                    price={price}
                    underlying={selectedUnderlying}
                    isAdding={isAddingMore}
                    isStopLoss={isStopLoss}
                    onQuantityChange={handleQuantityChange}
                    onPriceChange={handlePriceChange}
                    onSubmit={handleSubmit}
                    loading={loading}
                    transactionType={getTransactionType(selectedPosition, isAddingMore, isStopLoss)}
                />
            )}
        </Box>
    );
};

export default Positions; 