import React from 'react';
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
    LinearProgress,
    Skeleton,
    IconButton,
    Menu,
    MenuItem
} from '@mui/material';
import { useZerodha } from '../../context/ZerodhaContext';
import { formatCurrency } from '../../utils/formatters';
import { MoreVert } from '@mui/icons-material';
import OrderPopup from './OrderPopup';
import { placeOrder } from '../../services/zerodha/api';

const Holdings = () => {
    const { holdings, loadingStates } = useZerodha();
    const [prevHoldings, setPrevHoldings] = React.useState(null);
    const [isInitialLoad, setIsInitialLoad] = React.useState(true);
    const [isUpdating, setIsUpdating] = React.useState(false);
    const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);
    const [selectedHolding, setSelectedHolding] = React.useState(null);
    const [orderDialogAnchorEl, setOrderDialogAnchorEl] = React.useState(null);
    const [selectedOrderHolding, setSelectedOrderHolding] = React.useState(null);
    const [isAddingMore, setIsAddingMore] = React.useState(false);
    const [quantity, setQuantity] = React.useState('');
    const [price, setPrice] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    // Track initial load
    React.useEffect(() => {
        if (holdings && holdings.length > 0) {
            setIsInitialLoad(false);
        }
    }, [holdings]);

    // Track previous holdings for smooth updates
    React.useEffect(() => {
        if (holdings) {
            setPrevHoldings(holdings);
        }
    }, [holdings]);

    // Handle smooth updates
    React.useEffect(() => {
        if (prevHoldings && holdings) {
            setIsUpdating(true);
            const timer = setTimeout(() => {
                setIsUpdating(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [holdings, prevHoldings]);

    const handleMenuClick = (event, holding) => {
        setMenuAnchorEl(event.currentTarget);
        setSelectedHolding(holding);
    };
    const handleMenuClose = () => {
        setMenuAnchorEl(null);
        setSelectedHolding(null);
    };
    const handleOpenOrderDialog = (anchorEl, holding, isAdding) => {
        setOrderDialogAnchorEl(anchorEl);
        setSelectedOrderHolding(holding);
        setIsAddingMore(isAdding);
        setQuantity(Math.abs(holding.quantity).toString());
        setPrice(holding.last_price.toString());
    };
    const handleCloseOrderDialog = () => {
        setOrderDialogAnchorEl(null);
        setSelectedOrderHolding(null);
        setIsAddingMore(false);
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
    const handleSubmit = async (orderType) => {
        if (!selectedOrderHolding) return;
        setLoading(true);
        try {
            const transactionType = isAddingMore ? 'BUY' : 'SELL';
            const order = {
                tradingsymbol: selectedOrderHolding.tradingsymbol,
                exchange: selectedOrderHolding.exchange,
                transaction_type: transactionType,
                order_type: orderType,
                quantity: parseInt(quantity),
                price: parseFloat(price),
                product: selectedOrderHolding.product,
            };
            await placeOrder(order);
            handleCloseOrderDialog();
        } catch (error) {
            alert(error.message || 'Failed to place order');
        } finally {
            setLoading(false);
        }
    };
    const handleExitHolding = () => {
        handleOpenOrderDialog(menuAnchorEl, selectedHolding, false);
        handleMenuClose();
    };
    const handleAddMore = () => {
        handleOpenOrderDialog(menuAnchorEl, selectedHolding, true);
        handleMenuClose();
    };

    if (isInitialLoad && loadingStates.holdings) {
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

    if (!holdings || holdings.length === 0) {
        return (
            <Typography variant="body1" color="text.secondary" align="center" py={4}>
                No holdings found
            </Typography>
        );
    }

    return (
        <Box>
            <TableContainer component={Paper} elevation={0}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Symbol</TableCell>
                            <TableCell align="right">Quantity</TableCell>
                            <TableCell align="right">Avg. Cost</TableCell>
                            <TableCell align="right">LTP</TableCell>
                            <TableCell align="right">Current Value</TableCell>
                            <TableCell align="right">P&L</TableCell>
                            <TableCell align="right">Day Change</TableCell>
                            <TableCell align="right">Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {holdings.map((holding) => {
                            const quantity = Number(holding.quantity) || 0;
                            const avgPrice = Number(holding.average_price) || 0;
                            const lastPrice = Number(holding.last_price) || 0;
                            const closePrice = Number(holding.close_price) || lastPrice;
                            const currentValue = quantity * lastPrice;
                            const investedValue = quantity * avgPrice;
                            const pnl = currentValue - investedValue;
                            const pnlPercentage = (pnl / investedValue) * 100;
                            const dayChange = (lastPrice - closePrice) * quantity;
                            const dayChangePercentage = ((lastPrice - closePrice) / closePrice) * 100;

                            return (
                                <TableRow key={holding.tradingsymbol}>
                                    <TableCell component="th" scope="row">
                                        {holding.tradingsymbol}
                                    </TableCell>
                                    <TableCell align="right">{quantity}</TableCell>
                                    <TableCell align="right">₹{formatCurrency(avgPrice)}</TableCell>
                                    <TableCell align="right"
                                        sx={{
                                            fontFamily: 'monospace',
                                            transition: isUpdating ? 'color 0.3s ease' : 'none'
                                        }}
                                    >
                                        ₹{formatCurrency(lastPrice)}
                                    </TableCell>
                                    <TableCell align="right"
                                        sx={{
                                            fontFamily: 'monospace',
                                            transition: isUpdating ? 'color 0.3s ease' : 'none'
                                        }}
                                    >
                                        ₹{formatCurrency(currentValue)}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography
                                            color={pnl >= 0 ? 'success.main' : 'error.main'}
                                            sx={{ transition: isUpdating ? 'color 0.3s ease' : 'none' }}
                                        >
                                            ₹{formatCurrency(pnl)} ({pnlPercentage.toFixed(2)}%)
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography
                                            color={dayChange >= 0 ? 'success.main' : 'error.main'}
                                            sx={{ transition: isUpdating ? 'color 0.3s ease' : 'none' }}
                                        >
                                            ₹{formatCurrency(dayChange)} ({dayChangePercentage.toFixed(2)}%)
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            onClick={e => handleMenuClick(e, holding)}
                                            aria-label={`Actions for ${holding.tradingsymbol}`}
                                            aria-haspopup="true"
                                            aria-controls={Boolean(menuAnchorEl) && selectedHolding?.tradingsymbol === holding.tradingsymbol ? `holding-menu-${holding.tradingsymbol}` : undefined}
                                        >
                                            <MoreVert fontSize="small" />
                                        </IconButton>
                                        <Menu
                                            id={`holding-menu-${holding.tradingsymbol}`}
                                            anchorEl={menuAnchorEl}
                                            open={Boolean(menuAnchorEl) && selectedHolding?.tradingsymbol === holding.tradingsymbol}
                                            onClose={handleMenuClose}
                                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                        >
                                            <MenuItem onClick={handleExitHolding}>Exit Holdings</MenuItem>
                                            <MenuItem onClick={handleAddMore}>Add More</MenuItem>
                                        </Menu>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
                {selectedOrderHolding && (
                    <OrderPopup
                        open={Boolean(orderDialogAnchorEl)}
                        onClose={handleCloseOrderDialog}
                        position={selectedOrderHolding}
                        quantity={quantity}
                        price={price}
                        underlying={selectedOrderHolding.tradingsymbol}
                        isAdding={isAddingMore}
                        isStopLoss={false}
                        onQuantityChange={handleQuantityChange}
                        onPriceChange={handlePriceChange}
                        onSubmit={handleSubmit}
                        loading={loading}
                        transactionType={isAddingMore ? 'BUY' : 'SELL'}
                    />
                )}
            </TableContainer>
        </Box>
    );
};

export default Holdings; 