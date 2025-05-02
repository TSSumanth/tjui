import React, { useEffect, useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, CircularProgress, List, ListItem, ListItemText, Radio, RadioGroup, FormControlLabel, Alert, TextField, Card, CardContent, Divider, ListItemAvatar, Avatar
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import { getStockTrades, addNewStockTrade, addNewOptionTrade, getOptionTrades, updateOptionTrade, updateStockTrade } from '../../services/trades';
import { addStockOrder, addOptionOrder, getTradeOptionOrders, updateOptionOrder, getTradeStockOrders } from '../../services/orders';
import moment from 'moment';

function isOptionOrFuture(order) {
    // Check if it's from NFO exchange
    if (order.exchange === 'NFO') return true;

    // For non-NFO exchanges, check if it's a valid option/future symbol
    const symbol = order.tradingsymbol || '';

    // Check for CE/PE at the end of the symbol
    const hasOptionSuffix = /(CE|PE)$/.test(symbol);
    if (!hasOptionSuffix) return false;

    // Check if it has a valid expiry format (e.g., 24MAY, 24JUN, etc.)
    const hasExpiry = /[0-9]{2}(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)/.test(symbol);
    if (!hasExpiry) return false;

    // Check if it has a strike price (numbers before CE/PE)
    const hasStrike = /[0-9]+(CE|PE|FUT)$/.test(symbol);
    return hasStrike;
}

function extractStrikePrice(order) {
    // Prefer direct field if available
    if (order.strike_price) return Number(order.strike_price);

    // Try to parse from tradingsymbol (e.g., NIFTY24MAY22500CE)
    const symbol = order.tradingsymbol || '';
    const match = symbol.match(/(\d+)(CE|PE|FUT)$/);
    if (match) return Number(match[1]);
    return null;
}

function getUnderlyingAsset(symbol) {
    // For options/futures, extract the underlying asset (e.g., NIFTY from NIFTY24MAY22500CE)
    if (!symbol) return '';

    // Remove the expiry and strike price parts
    const match = symbol.match(/^([A-Z]+)[0-9]/);
    if (match) return match[1];

    // For stocks, just return the symbol (may need further normalization)
    return symbol.split('-')[0];
}

function LinkToTradePopup({ open, onClose, zerodhaOrder, assetType = 'stock', onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [openTrades, setOpenTrades] = useState([]);
    const [selectedTradeId, setSelectedTradeId] = useState(null);
    const [error, setError] = useState(null);
    const [linking, setLinking] = useState(false);
    const [creating, setCreating] = useState(false);
    const [lotSize, setLotSize] = useState('');
    const [lotSizeError, setLotSizeError] = useState('');

    useEffect(() => {
        if (open && zerodhaOrder) {
            fetchOpenTrades();
        }
        // eslint-disable-next-line
    }, [open, zerodhaOrder]);

    if (!zerodhaOrder) return null;

    const isOption = isOptionOrFuture(zerodhaOrder);

    const fetchOpenTrades = async () => {
        setLoading(true);
        setError(null);
        setOpenTrades([]);
        setSelectedTradeId(null);
        try {
            // Fetch all open trades of the correct type
            let trades = [];
            if (isOption) {
                trades = await getOptionTrades({ status: 'OPEN' });
            } else {
                trades = await getStockTrades({ status: 'OPEN' });
            }
            // For options, match by underlying asset; for stocks, match by asset name
            const orderAsset = isOption ? getUnderlyingAsset(zerodhaOrder.tradingsymbol) : zerodhaOrder.tradingsymbol.split('-')[0];
            const filtered = trades.filter(trade => {
                if (!trade.asset) return false;
                if (isOption) {
                    return getUnderlyingAsset(trade.asset).toUpperCase() === orderAsset.toUpperCase();
                } else {
                    return trade.asset.toUpperCase() === orderAsset.toUpperCase();
                }
            });
            setOpenTrades(filtered);
        } catch (err) {
            setError('Failed to fetch open trades.');
        } finally {
            setLoading(false);
        }
    };

    const getFormattedDate = (dateStr) => moment(dateStr).format('YYYY-MM-DD HH:mm:ss');

    const handleLink = async () => {
        if (isOption && (!lotSize || Number(lotSize) <= 0)) {
            setLotSizeError('Lot size is a mandatory field for options.');
            return;
        }
        setLotSizeError('');
        if (!selectedTradeId) return;
        setLinking(true);
        setError(null);
        try {
            const lots = lotSize > 0 ? Math.floor(zerodhaOrder.quantity / lotSize) : zerodhaOrder.quantity;
            if (isOption) {
                // Option/Future order
                const orderPayload = {
                    asset: zerodhaOrder.tradingsymbol,
                    ordertype: zerodhaOrder.transaction_type,
                    quantity: lots,
                    price: zerodhaOrder.price,
                    date: getFormattedDate(zerodhaOrder.order_timestamp),
                    tradeid: selectedTradeId,
                    notes: 'Linked from Zerodha',
                    tags: `zerodha,${zerodhaOrder.order_id}`,
                    lotsize: lotSize
                };
                await addOptionOrder(orderPayload);
                // Fetch all orders for the trade
                const allorders = await getTradeOptionOrders(selectedTradeId);
                // Recalculate trade fields
                let entryorderquantity = 0;
                let exitorderquantity = 0;
                let entryavgprice = 0;
                let exitavgprice = 0;
                let tradeType = allorders[0]?.tradetype || 'LONG';
                allorders.forEach(order => {
                    if (tradeType.toUpperCase() === "LONG" && order.ordertype.toUpperCase() === "BUY") {
                        let newentryquantity = entryorderquantity + Number(order.quantity);
                        let newentryavgprice = ((entryavgprice * entryorderquantity) + (Number(order.quantity) * Number(order.price))) / (entryorderquantity + Number(order.quantity))
                        entryavgprice = newentryavgprice
                        entryorderquantity = newentryquantity
                    } else if (tradeType.toUpperCase() === "LONG" && order.ordertype.toUpperCase() === "SELL") {
                        let newexitavgquantity = exitorderquantity + Number(order.quantity);
                        let newexitavgprice = ((exitavgprice * exitorderquantity) + (Number(order.quantity) * Number(order.price))) / (exitorderquantity + Number(order.quantity))
                        exitavgprice = newexitavgprice
                        exitorderquantity = newexitavgquantity
                    }
                    else if (tradeType.toUpperCase() === "SHORT" && order.ordertype.toUpperCase() === "BUY") {
                        let newexitavgquantity = exitorderquantity + Number(order.quantity);
                        let newexitavgprice = ((exitavgprice * exitorderquantity) + (Number(order.quantity) * Number(order.price))) / (exitorderquantity + Number(order.quantity))
                        exitavgprice = newexitavgprice
                        exitorderquantity = newexitavgquantity
                    }
                    else if (tradeType.toUpperCase() === "SHORT" && order.ordertype.toUpperCase() === "SELL") {
                        let newentryquantity = entryorderquantity + Number(order.quantity);
                        let newentryavgprice = ((entryavgprice * entryorderquantity) + (Number(order.quantity) * Number(order.price))) / (entryorderquantity + Number(order.quantity))
                        entryavgprice = newentryavgprice
                        entryorderquantity = newentryquantity
                    }
                });
                const contracts = entryorderquantity * lotSize;
                const opencontracts = (entryorderquantity - exitorderquantity) * lotSize;
                const closedcontracts = exitorderquantity * lotSize;
                const status = (entryorderquantity - exitorderquantity === 0) ? "CLOSED" : "OPEN";
                const entrydate = allorders[0]?.date;
                const exitdate = (entryorderquantity - exitorderquantity === 0) ? allorders[allorders.length - 1]?.date : '';
                const finalexitprice = (entryorderquantity - exitorderquantity === 0) ? parseFloat(exitavgprice).toFixed(2) : "0";
                const capitalused = (entryorderquantity - exitorderquantity !== 0) ? parseFloat(((entryorderquantity * entryavgprice) * lotSize) - ((exitorderquantity * exitavgprice) * lotSize)).toFixed(2) : 0;
                const overallreturn = parseFloat((tradeType.toUpperCase() === "LONG" ? (exitorderquantity * exitavgprice * lotSize) - (exitorderquantity * entryavgprice * lotSize) : (exitorderquantity * entryavgprice * lotSize) - (exitorderquantity * exitavgprice * lotSize))).toFixed(2);
                const lastmodifieddate = moment().format('YYYY-MM-DD');
                // Update the trade
                await updateOptionTrade({
                    tradeid: selectedTradeId,
                    quantity: contracts,
                    openquantity: opencontracts,
                    closedquantity: closedcontracts,
                    entryprice: parseFloat(entryavgprice).toFixed(2),
                    exitaverageprice: parseFloat(exitavgprice).toFixed(2),
                    status,
                    entrydate,
                    exitdate,
                    finalexitprice,
                    capitalused,
                    overallreturn,
                    lastmodifieddate
                });
            } else {
                // Stock order
                const orderPayload = {
                    asset: zerodhaOrder.tradingsymbol,
                    ordertype: zerodhaOrder.transaction_type,
                    quantity: zerodhaOrder.quantity,
                    price: zerodhaOrder.price,
                    date: getFormattedDate(zerodhaOrder.order_timestamp),
                    tradeid: selectedTradeId,
                    notes: 'Linked from Zerodha',
                    tags: `zerodha,${zerodhaOrder.order_id}`,
                };
                await addStockOrder(orderPayload);
                // Fetch all orders for the trade
                const allorders = await getTradeStockOrders(selectedTradeId);
                // Recalculate trade fields
                let entryorderquantity = 0;
                let exitorderquantity = 0;
                let entryavgprice = 0;
                let exitavgprice = 0;
                let tradeType = allorders[0]?.tradetype || 'LONG';
                allorders.forEach(order => {
                    if (tradeType.toUpperCase() === "LONG" && order.ordertype.toUpperCase() === "BUY") {
                        let newentryquantity = entryorderquantity + Number(order.quantity);
                        let newentryavgprice = ((entryavgprice * entryorderquantity) + (Number(order.quantity) * Number(order.price))) / (entryorderquantity + Number(order.quantity))
                        entryavgprice = newentryavgprice
                        entryorderquantity = newentryquantity
                    } else if (tradeType.toUpperCase() === "LONG" && order.ordertype.toUpperCase() === "SELL") {
                        let newexitavgquantity = exitorderquantity + Number(order.quantity);
                        let newexitavgprice = ((exitavgprice * exitorderquantity) + (Number(order.quantity) * Number(order.price))) / (exitorderquantity + Number(order.quantity))
                        exitavgprice = newexitavgprice
                        exitorderquantity = newexitavgquantity
                    }
                    else if (tradeType.toUpperCase() === "SHORT" && order.ordertype.toUpperCase() === "BUY") {
                        let newexitavgquantity = exitorderquantity + Number(order.quantity);
                        let newexitavgprice = ((exitavgprice * exitorderquantity) + (Number(order.quantity) * Number(order.price))) / (exitorderquantity + Number(order.quantity))
                        exitavgprice = newexitavgprice
                        exitorderquantity = newexitavgquantity
                    }
                    else if (tradeType.toUpperCase() === "SHORT" && order.ordertype.toUpperCase() === "SELL") {
                        let newentryquantity = entryorderquantity + Number(order.quantity);
                        let newentryavgprice = ((entryavgprice * entryorderquantity) + (Number(order.quantity) * Number(order.price))) / (entryorderquantity + Number(order.quantity))
                        entryavgprice = newentryavgprice
                        entryorderquantity = newentryquantity
                    }
                });
                const openquantity = entryorderquantity - exitorderquantity;
                const closedquantity = exitorderquantity;
                const status = (entryorderquantity - exitorderquantity === 0) ? "CLOSED" : "OPEN";
                const entrydate = allorders[0]?.date;
                const exitdate = (entryorderquantity - exitorderquantity === 0) ? allorders[allorders.length - 1]?.date : '';
                const finalexitprice = (entryorderquantity - exitorderquantity === 0) ? parseFloat(exitavgprice).toFixed(2) : "0";
                const capitalused = (entryorderquantity - exitorderquantity !== 0) ? parseFloat((entryorderquantity * entryavgprice) - (exitorderquantity * exitavgprice)).toFixed(2) : 0;
                const overallreturn = parseFloat((tradeType.toUpperCase() === "LONG" ? (exitorderquantity * exitavgprice) - (exitorderquantity * entryavgprice) : (exitorderquantity * entryavgprice) - (exitorderquantity * exitavgprice))).toFixed(2);
                const lastmodifieddate = getFormattedDate(zerodhaOrder.order_timestamp);
                // Update the trade
                await updateStockTrade({
                    tradeid: selectedTradeId,
                    quantity: entryorderquantity,
                    openquantity,
                    closedquantity,
                    entryprice: parseFloat(entryavgprice).toFixed(2),
                    exitaverageprice: parseFloat(exitavgprice).toFixed(2),
                    status,
                    entrydate,
                    exitdate,
                    finalexitprice,
                    capitalused,
                    overallreturn,
                    lastmodifieddate
                });
            }
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            setError('Failed to link order to trade.');
        } finally {
            setLinking(false);
        }
    };

    const handleCreateNewTrade = async () => {
        if (isOption && (!lotSize || Number(lotSize) <= 0)) {
            setLotSizeError('Lot size is a mandatory field for options.');
            return;
        }
        setLotSizeError('');
        setCreating(true);
        setError(null);
        try {
            const lots = lotSize > 0 ? Math.floor(zerodhaOrder.quantity / lotSize) : zerodhaOrder.quantity;
            const newTradeId = uuidv4();
            if (isOption) {
                // Option/Future order
                const strikeprize = extractStrikePrice(zerodhaOrder);
                const orderPayload = {
                    asset: zerodhaOrder.tradingsymbol,
                    ordertype: zerodhaOrder.transaction_type,
                    quantity: lots,
                    price: zerodhaOrder.price,
                    date: getFormattedDate(zerodhaOrder.order_timestamp),
                    tradeid: newTradeId,
                    notes: 'Linked from Zerodha',
                    tags: `zerodha,${zerodhaOrder.order_id}`,
                    lotsize: lotSize
                };
                await addOptionOrder(orderPayload);
                // Now create the trade
                const contracts = lots * lotSize;
                const lastModifiedDate = moment(zerodhaOrder.order_timestamp).format('YYYY-MM-DD');
                const tradePayload = {
                    tradeid: newTradeId,
                    asset: zerodhaOrder.tradingsymbol,
                    tradetype: zerodhaOrder.transaction_type === 'BUY' ? 'LONG' : 'SHORT',
                    quantity: contracts,
                    entryprice: zerodhaOrder.price,
                    entrydate: getFormattedDate(zerodhaOrder.order_timestamp),
                    openquantity: contracts,
                    status: 'OPEN',
                    notes: 'Created from Zerodha order',
                    tags: 'zerodha',
                    ltp: zerodhaOrder.price,
                    lotsize: lotSize,
                    strikeprize: strikeprize,
                    lastmodifieddate: lastModifiedDate
                };
                await addNewOptionTrade(tradePayload);
            } else {
                // Stock order
                const orderPayload = {
                    asset: zerodhaOrder.tradingsymbol,
                    ordertype: zerodhaOrder.transaction_type,
                    quantity: zerodhaOrder.quantity,
                    price: zerodhaOrder.price,
                    date: getFormattedDate(zerodhaOrder.order_timestamp),
                    tradeid: newTradeId,
                    notes: 'Linked from Zerodha',
                    tags: `zerodha,${zerodhaOrder.order_id}`,
                };
                await addStockOrder(orderPayload);
                // Now create the trade
                const tradePayload = {
                    tradeid: newTradeId,
                    asset: zerodhaOrder.tradingsymbol,
                    tradetype: zerodhaOrder.transaction_type === 'BUY' ? 'LONG' : 'SHORT',
                    quantity: zerodhaOrder.quantity,
                    entryprice: zerodhaOrder.price,
                    entrydate: getFormattedDate(zerodhaOrder.order_timestamp),
                    openquantity: zerodhaOrder.quantity,
                    status: 'OPEN',
                    notes: 'Created from Zerodha order',
                    tags: 'zerodha',
                    ltp: zerodhaOrder.price,
                    lastmodifieddate: getFormattedDate(zerodhaOrder.order_timestamp)
                };
                await addNewStockTrade(tradePayload);
            }
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            setError('Failed to create new trade and link order.');
        } finally {
            setCreating(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 700, fontSize: 22, pb: 1 }}>Link Zerodha Order to Trade</DialogTitle>
            <DialogContent>
                <Card variant="outlined" sx={{ mb: 3, bgcolor: '#f8fafc', borderRadius: 2 }}>
                    <CardContent>
                        <Typography variant="subtitle2" color="primary" gutterBottom>Order Summary</Typography>
                        <Box mb={1}>
                            <Typography variant="body2"><b>Symbol:</b> {zerodhaOrder.tradingsymbol}</Typography>
                            <Typography variant="body2"><b>Type:</b> {zerodhaOrder.transaction_type}</Typography>
                            <Typography variant="body2"><b>Quantity:</b> {zerodhaOrder.quantity}</Typography>
                            <Typography variant="body2"><b>Price:</b> {zerodhaOrder.price}</Typography>
                            <Typography variant="body2"><b>Time:</b> {getFormattedDate(zerodhaOrder.order_timestamp)}</Typography>
                            {isOption && (
                                <TextField
                                    label="Lot Size"
                                    type="number"
                                    value={lotSize}
                                    onChange={e => setLotSize(e.target.value.replace(/[^\d]/g, ''))}
                                    sx={{ mt: 2, width: 150 }}
                                    inputProps={{ min: 1 }}
                                    size="small"
                                    error={!!lotSizeError}
                                    helperText={lotSizeError}
                                />
                            )}
                        </Box>
                    </CardContent>
                </Card>
                <Divider sx={{ mb: 2 }} />
                {loading ? <Box display="flex" justifyContent="center" py={3}><CircularProgress /></Box> : (
                    <>
                        {openTrades.length > 0 ? (
                            <>
                                <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>Select an open trade to link:</Typography>
                                <List sx={{ bgcolor: '#f5f7fa', borderRadius: 2, mb: 2 }}>
                                    {openTrades.map(trade => (
                                        <ListItem
                                            key={trade.tradeid}
                                            sx={{
                                                border: selectedTradeId === trade.tradeid ? '2px solid #1976d2' : '1px solid #e0e0e0',
                                                borderRadius: 2,
                                                mb: 1,
                                                bgcolor: selectedTradeId === trade.tradeid ? '#e3f2fd' : 'inherit',
                                                transition: 'all 0.2s',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => setSelectedTradeId(trade.tradeid)}
                                        >
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: '#1976d2', color: 'white', fontWeight: 700 }}>{trade.asset[0]}</Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={<Typography variant="subtitle1" fontWeight={600} component="span">{trade.asset}</Typography>}
                                                secondary={<Typography variant="body2" color="text.secondary" component="span">Type: {trade.tradetype}, Qty: {trade.quantity}, Entry: {trade.entryprice}</Typography>}
                                            />
                                            <Radio
                                                checked={selectedTradeId === trade.tradeid}
                                                onChange={() => setSelectedTradeId(trade.tradeid)}
                                                value={trade.tradeid}
                                                color="primary"
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleLink}
                                    disabled={!selectedTradeId || linking}
                                    sx={{ mt: 1, width: '100%', py: 1.2, fontWeight: 600, fontSize: 16 }}
                                >
                                    {linking ? 'Linking...' : 'Link to Selected Trade'}
                                </Button>
                            </>
                        ) : (
                            <Alert severity="info" sx={{ mb: 2 }}>No open trades found for this asset.</Alert>
                        )}
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={handleCreateNewTrade}
                            disabled={creating}
                            sx={{ mt: 2, width: '100%', py: 1.2, fontWeight: 600, fontSize: 16 }}
                        >
                            {creating ? 'Creating...' : 'Create New Trade'}
                        </Button>
                    </>
                )}
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'flex-end', px: 3, pb: 2 }}>
                <Button onClick={onClose} variant="outlined" color="primary">Cancel</Button>
            </DialogActions>
        </Dialog>
    );
}

export default LinkToTradePopup; 