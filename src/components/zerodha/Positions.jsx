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
    Skeleton,
    Card,
    Grid,
    Button
} from '@mui/material';
import { useZerodha } from '../../context/ZerodhaContext';
import { ExpandLess, ExpandMore, MoreVert, Close } from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatters';
import { placeOrder, getInstruments } from '../../services/zerodha/api';
import OrderPopup from './OrderPopup';
import moment from 'moment-business-days';
import { getManualPl, createManualPl, updateManualPl } from '../../services/manualPl';
import { getStrategies } from '../../services/strategies';
import StrategyIcon from '@mui/icons-material/AutoGraph';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import CalculateIcon from '@mui/icons-material/Calculate';
import EditNoteIcon from '@mui/icons-material/EditNote';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TodayIcon from '@mui/icons-material/Today';
import SummarizeIcon from '@mui/icons-material/Summarize';
import Tooltip from '@mui/material/Tooltip';
import Popover from '@mui/material/Popover';

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

const calculateIntrinsicValue = (option, ltpMap) => {
    const details = extractOptionDetails(option.tradingsymbol);
    if (!details) return 0;
    const stockLTP = ltpMap[details.symbol];
    if (!stockLTP) return 0;
    if (details.type === 'CE') {
        return Math.max(stockLTP - details.strike, 0);
    } else if (details.type === 'PE') {
        return Math.max(details.strike - stockLTP, 0);
    }
    return 0;
};

const calculateTimeValue = (option, ltpMap) => {
    const intrinsic = calculateIntrinsicValue(option, ltpMap);
    const optionLTP = Number(option.last_price) || 0;
    return Math.max(optionLTP - intrinsic, 0);
};

const calculateDaysToExpiry = (option) => {
    const details = extractOptionDetails(option.tradingsymbol);
    if (!details || !details.expiry) return '';
    // details.expiry example: 25JUN
    // Parse as DDMMM with current year
    const year = new Date().getFullYear();
    let expiryDate = moment(details.expiry + year, 'DDMMMYYYY');
    // If expiry already passed this year, use next year
    if (expiryDate.isBefore(moment(), 'day')) {
        expiryDate = expiryDate.add(1, 'year');
    }
    const today = moment().startOf('day');
    return today.businessDiff(expiryDate);
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

const PositionTable = ({ positions, underlying, onOpenOrderDialog, loadingPositions, prevPositions, instrumentDetails }) => {
    // Initialize expanded state to true by default
    const [expanded, setExpanded] = useState(true);
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const { ltpMap } = useZerodha();
    const [manualPl, setManualPl] = React.useState('');
    const [manualPlId, setManualPlId] = React.useState(null);
    const [manualPlLoading, setManualPlLoading] = React.useState(false);
    const [manualPlSaving, setManualPlSaving] = React.useState(false);
    const [manualPlError, setManualPlError] = React.useState('');
    const [strategyId, setStrategyId] = useState(null);
    const [strategyLoading, setStrategyLoading] = useState(false);
    const [manualPlAnchorEl, setManualPlAnchorEl] = useState(null);

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

    // Fetch manual P/L on mount or when underlying changes
    React.useEffect(() => {
        let isMounted = true;
        setManualPlLoading(true);
        setManualPlError('');
        getManualPl({ AssetName: underlying })
            .then((data) => {
                if (isMounted) {
                    setManualPl(data.manual_pl ?? 0);
                    setManualPlId(data.id);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setManualPl(0);
                    setManualPlId(null);
                }
            })
            .finally(() => {
                if (isMounted) setManualPlLoading(false);
            });
        return () => { isMounted = false; };
    }, [underlying]);

    React.useEffect(() => {
        let isMounted = true;
        setStrategyLoading(true);
        setStrategyId(null);
        getStrategies({ symbol: underlying, status: 'OPEN' })
            .then((response) => {
                if (isMounted) {
                    if (response && response.length > 0) {
                        setStrategyId(response[0].id);
                    } else {
                        setStrategyId(null);
                    }
                }
            })
            .catch(() => {
                if (isMounted) setStrategyId(null);
            })
            .finally(() => {
                if (isMounted) setStrategyLoading(false);
            });
        return () => { isMounted = false; };
    }, [underlying]);

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

    const handleManualPlChange = (e) => {
        setManualPl(e.target.value);
    };

    const handleManualPlSave = async () => {
        setManualPlSaving(true);
        setManualPlError('');
        try {
            const value = parseFloat(manualPl) || 0;
            if (manualPlId) {
                await updateManualPl({ id: manualPlId, manual_pl: value });
            } else {
                const data = await createManualPl({ AssetName: underlying, manual_pl: value });
                setManualPlId(data.id);
            }
        } catch (err) {
            setManualPlError('Failed to save Manual P/L');
        } finally {
            setManualPlSaving(false);
        }
    };

    const handleViewStrategy = (e) => {
        e.stopPropagation();
        if (strategyId) {
            window.open(`/updatestrategy/${strategyId}`, '_blank');
        }
    };

    const handleManualPlIconClick = (event) => {
        event.stopPropagation();
        setManualPlAnchorEl(event.currentTarget);
    };
    const handleManualPlPopoverClose = () => setManualPlAnchorEl(null);
    const manualPlPopoverOpen = Boolean(manualPlAnchorEl);

    const renderPositionRow = (position) => {
        const lastPrice = Number(position.last_price) || 0;
        const closePrice = Number(position.close_price) || lastPrice;
        const quantity = Number(position.quantity) || 0;
        const isNegativeQuantity = quantity < 0;
        const positionType = getPositionType(position.tradingsymbol);
        const isClosed = quantity === 0 || position.is_closed;
        // Get lot size from instrumentDetails if available
        const details = instrumentDetails && instrumentDetails[position.tradingsymbol];
        const lotSize = details && details.lot_size ? Number(details.lot_size) : null;
        const lots = lotSize ? Math.round(Math.abs(Number(position.quantity)) / lotSize) : null;

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

        const isOption = positionType === 'Option';
        const intrinsicValue = isOption ? calculateIntrinsicValue(position, ltpMap) : '';
        const timeValue = isOption ? calculateTimeValue(position, ltpMap) : '';
        const daysToExpiry = isOption ? calculateDaysToExpiry(position) : '';

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
                    {lots !== null ? lots : '-'}
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
                <StyledTableCell align="right">
                    {isOption ? formatCurrency(intrinsicValue) : ''}
                </StyledTableCell>
                <StyledTableCell align="right">
                    {isOption ? formatCurrency(timeValue) : ''}
                </StyledTableCell>
                <StyledTableCell align="right">
                    {isOption ? daysToExpiry : ''}
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
                    bgcolor: 'background.paper',
                    borderLeft: '4px solid',
                    borderLeftColor: 'primary.main',
                    transition: isUpdating ? 'background-color 0.3s ease' : 'none',
                    py: 2
                }}
            >
                <Grid container spacing={2} alignItems="center" sx={{ py: 2, px: 3 }}>
                    {/* Row 1 */}
                    <Grid item xs={12} md={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="h5" sx={{ fontWeight: 700 }}>{underlying}</Typography>
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', ml: 2 }}>
                                <TrendingUpIcon color="primary" fontSize="small" />
                                <Typography variant="body1" sx={{ fontWeight: 600, ml: 1 }}>
                                    LTP: {ltpMap && ltpMap[underlying] !== undefined ? formatCurrency(ltpMap[underlying]) : '-'}
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <TodayIcon color={dayPnL >= 0 ? 'success' : 'error'} fontSize="small" />
                            <Typography variant="body1" sx={{ fontWeight: 600, ml: 1 }}>
                                Today's Change: <span style={{ color: dayPnL >= 0 ? 'green' : 'red' }}>{formatCurrency(dayPnL)}</span>
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <SummarizeIcon color={totalPnL >= 0 ? 'success' : 'error'} fontSize="small" />
                            <Typography variant="body1" sx={{ fontWeight: 600, ml: 1 }}>
                                Total Open Positions P/L: <span style={{ color: totalPnL >= 0 ? 'green' : 'red' }}>{formatCurrency(totalPnL)}</span>
                            </Typography>
                        </Box>
                    </Grid>

                    {/* Row 2 */}
                    <Grid item xs={12} md={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <CalculateIcon color="info" fontSize="small" />
                            <Typography variant="body1" sx={{ fontWeight: 600, ml: 1 }}>
                                Breakeven: {calculateBreakeven(positions) && calculateBreakeven(positions).breakevenPoints.length > 0
                                    ? `↓${formatCurrency(calculateBreakeven(positions).breakevenPoints[0])} / ↑${formatCurrency(calculateBreakeven(positions).breakevenPoints[1])}`
                                    : 'N/A'}
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid item xs={6} md={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, border: '1px solid', borderRadius: "5px", borderColor: 'black', padding: "5px" }}>
                            <EditNoteIcon color="warning" fontSize="small" />
                            <Typography variant="body1" sx={{ fontWeight: 500, ml: 1 }}>
                                Manual P/L:
                            </Typography>
                            <input
                                type="number"
                                value={manualPl}
                                onChange={handleManualPlChange}
                                style={{ width: 110, height: 36, fontFamily: 'monospace', fontSize: 16, padding: '6px 10px', borderRadius: 8, border: '1.5px solid #bdbdbd', background: '#f8fafc', outline: 'none', marginRight: 8 }}
                                disabled={manualPlLoading || manualPlSaving}
                            />
                            <Button
                                variant="contained"
                                size="medium"
                                onClick={handleManualPlSave}
                                disabled={manualPlLoading || manualPlSaving}
                                sx={{ minWidth: 56, px: 2, borderRadius: 8, fontWeight: 600, fontSize: 15 }}
                            >
                                {manualPlSaving ? 'Saving...' : 'Save'}
                            </Button>
                            {manualPlError && (
                                <Typography variant="caption" color="error" sx={{ ml: 1 }}>{manualPlError}</Typography>
                            )}
                        </Box>
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <AccountBalanceIcon color="secondary" fontSize="small" />
                            <Typography variant="body1" sx={{ fontWeight: 600, ml: 1 }}>
                                Net P/L: {(Number(manualPl || 0) + Number(totalPnL || 0)).toFixed(2)}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Button
                                variant="outlined"
                                onClick={handleViewStrategy}
                                disabled={!strategyId || strategyLoading}
                                sx={{ ml: 1 }}
                            >
                                View Associated Strategy
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
                {/* Move expand/collapse button to bottom right */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', pr: 4, pb: 1 }}>
                    <IconButton size="large" sx={{ color: 'action.active' }} onClick={() => setExpanded(!expanded)}>
                        {expanded ? <ExpandLess fontSize="large" /> : <ExpandMore fontSize="large" />}
                    </IconButton>
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
                                <StyledTableCell align="right">Lots</StyledTableCell>
                                <StyledTableCell align="right">Avg. Price</StyledTableCell>
                                <StyledTableCell align="right">LTP</StyledTableCell>
                                <StyledTableCell align="right">Day's P&L</StyledTableCell>
                                <StyledTableCell align="right">Total P&L</StyledTableCell>
                                <StyledTableCell align="right">Intrinsic Value</StyledTableCell>
                                <StyledTableCell align="right">Time Value</StyledTableCell>
                                <StyledTableCell align="right">Days to Expiry</StyledTableCell>
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
    const [instrumentDetails, setInstrumentDetails] = React.useState({});

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

    // Fetch instrument details for all unique symbols
    React.useEffect(() => {
        const allPositions = [
            ...(positions.net || []),
            ...(positions.day || [])
        ];
        async function fetchInstrumentDetails() {
            const symbols = Array.from(new Set(
                allPositions.map(pos => pos.tradingsymbol)
            ));
            const detailsMap = { ...instrumentDetails };
            await Promise.all(symbols.map(async (symbol) => {
                if (!detailsMap[symbol]) {
                    try {
                        const resp = await getInstruments({ search: symbol });
                        if (resp && resp.success && resp.data && resp.data.length > 0) {
                            detailsMap[symbol] = resp.data[0];
                        }
                    } catch (e) {
                        // catch intentionally left blank
                    }
                }
            }));
            setInstrumentDetails(detailsMap);
        }
        if (allPositions.length > 0) {
            fetchInstrumentDetails();
        }
    }, [positions]);

    // Helper to get days to expiry using instrument details
    const getDaysToExpiry = (position) => {
        const details = instrumentDetails[position.tradingsymbol];
        if (!details || !details.expiry) return '';
        const expiryDate = moment(details.expiry);
        const today = moment().startOf('day');
        return expiryDate.diff(today, 'days');
    };

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
            <Grid container spacing={3}>
                {Object.entries(groupedPositions).map(([underlying, positions]) => (
                    <Grid item xs={12} key={underlying}>
                        <Card elevation={2} sx={{ p: 2 }}>
                            <PositionTable
                                positions={positions}
                                underlying={underlying}
                                onOpenOrderDialog={handleOpenOrderDialog}
                                loadingPositions={{}}
                                prevPositions={prevPositions}
                                instrumentDetails={instrumentDetails}
                            />
                        </Card>
                    </Grid>
                ))}
            </Grid>
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