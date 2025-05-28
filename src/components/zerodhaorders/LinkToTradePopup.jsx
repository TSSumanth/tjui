import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    Radio,
    Alert,
    TextField,
    Card,
    CardContent,
    Divider,
    ListItemAvatar,
    Avatar
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import { getStockTrades, addNewStockTrade, addNewOptionTrade, getOptionTrades, updateOptionTrade, updateStockTrade } from '../../services/trades';
import { getOrders, addStockOrder, addOptionOrder, getTradeOptionOrders, updateOptionOrder, getTradeStockOrders, updateStockOrder } from '../../services/orders';
import { getInstruments } from '../../services/zerodha/api';
import { formatPrice } from '../../utils/formatters';
import moment from 'moment';
import { AssignTradesToStrategy } from '../Strategies/AssignTradesPopup';

async function getTradeDetails(symbol) {
    try {
        const response = await getInstruments({ search: symbol });
        if (response?.data?.length > 0) {
            for (const instrument of response.data) {
                if (instrument.tradingsymbol === symbol) {
                    return {
                        type: instrument.instrument_type, // 'EQ', 'FUT', 'CE', 'PE'
                        strikePrice: instrument.strike,
                        underlyingAsset: instrument.name,
                        lotSize: instrument.lot_size,
                        expiry: instrument.expiry
                    };
                }
            }
        }
        return null;
    } catch (error) {
        console.error('Error fetching instrument details:', error);
        return null;
    }
}

function isOptionOrFuture(order) {
    // Check if it's from NFO exchange
    if (order.exchange === 'NFO') return true;

    // For non-NFO exchanges, check if it's a valid option/future symbol
    const symbol = order.tradingsymbol || '';
    return symbol.endsWith('FUT') || symbol.endsWith('CE') || symbol.endsWith('PE');
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

const LinkToTradePopup = ({ open, order, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [openTrades, setOpenTrades] = useState([]);
    const [selectedTradeId, setSelectedTradeId] = useState(null);
    const [error, setError] = useState(null);
    const [linking, setLinking] = useState(false);
    const [creating, setCreating] = useState(false);
    const [lotSize, setLotSize] = useState('');
    const [lotSizeError, setLotSizeError] = useState('');
    const [lotSizeLoading, setLotSizeLoading] = useState(false);
    const [showAssignStrategy, setShowAssignStrategy] = useState(false);
    const [newlyCreatedTrade, setNewlyCreatedTrade] = useState(null);
    const [tradeDetails, setTradeDetails] = useState(null);

    useEffect(() => {
        if (open && order) {
            fetchOpenTrades();
            fetchTradeDetails();
        }
    }, [open, order]);

    const fetchTradeDetails = async () => {
        if (!order?.tradingsymbol) return;

        setLotSizeLoading(true);
        try {
            const details = await getTradeDetails(order.tradingsymbol);
            if (details) {
                setTradeDetails(details);
                if (details.lotSize && !lotSize) {
                    setLotSize(details.lotSize);
                }
            }
        } catch (error) {
            console.error('Error fetching trade details:', error);
        } finally {
            setLotSizeLoading(false);
        }
    };

    if (!order) return null;

    const isOption = tradeDetails?.type === 'CE' || tradeDetails?.type === 'PE' || tradeDetails?.type === 'FUT';

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
            const orderAsset = isOption ? tradeDetails?.underlyingAsset : order.tradingsymbol.split('-')[0];
            const filtered = trades.filter(trade => {
                if (!trade.asset) return false;
                if (isOption) {
                    return trade.asset.toUpperCase().includes(orderAsset.toUpperCase());
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

    async function tagZerodhaOrderAsLinked(orderId) {
        try {
            // Fetch orders with the zerodha order id as a tag
            const orders = await getOrders({ tags: orderId });
            if (orders && orders.length > 0) {
                const order = orders[0];
                // Add 'linked' to the tags if not already present
                let tagsArr = order.tags ? order.tags.split(',') : [];
                if (!tagsArr.includes('linked')) {
                    tagsArr.push('linked');
                    const updatedTags = tagsArr.join(',');
                    if (order.lotsize !== undefined) {
                        await updateOptionOrder({ ...order, tags: updatedTags });
                    } else {
                        await updateStockOrder({ ...order, tags: updatedTags });
                    }
                }
            }
        } catch (err) {
            // Optionally handle error
            console.error('Failed to tag Zerodha order as linked:', err);
        }
    }

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
            const lots = lotSize > 0 ? Math.floor(order.quantity / lotSize) : order.quantity;
            if (isOption) {
                // Option/Future order
                const orderPayload = {
                    asset: order.tradingsymbol,
                    ordertype: order.transaction_type,
                    quantity: lots,
                    price: order.price,
                    date: getFormattedDate(order.order_timestamp),
                    tradeid: selectedTradeId,
                    notes: 'Linked from Zerodha',
                    tags: `zerodha,${order.order_id}`,
                    lotsize: lotSize
                };
                await addOptionOrder(orderPayload);
                // Tag the original Zerodha order as linked
                await tagZerodhaOrderAsLinked(order.order_id);
                // Fetch all orders for the trade
                const allorders = await getTradeOptionOrders(selectedTradeId);
                // Get the selected trade's tradetype from openTrades
                const selectedTrade = openTrades.find(t => t.tradeid === selectedTradeId);
                let tradeType = selectedTrade?.tradetype || 'LONG';
                // Recalculate trade fields
                let entryorderquantity = 0;
                let exitorderquantity = 0;
                let entryavgprice = 0;
                let exitavgprice = 0;
                allorders.forEach(order => {
                    if (tradeType.toUpperCase() === "LONG") {
                        if (order.ordertype.toUpperCase() === "BUY") {
                            let newentryquantity = entryorderquantity + Number(order.quantity);
                            let newentryavgprice = ((entryavgprice * entryorderquantity) + (Number(order.quantity) * Number(order.price))) / (entryorderquantity + Number(order.quantity))
                            entryavgprice = newentryavgprice
                            entryorderquantity = newentryquantity
                        } else if (order.ordertype.toUpperCase() === "SELL") {
                            let newexitavgquantity = exitorderquantity + Number(order.quantity);
                            let newexitavgprice = ((exitavgprice * exitorderquantity) + (Number(order.quantity) * Number(order.price))) / (exitorderquantity + Number(order.quantity))
                            exitavgprice = newexitavgprice
                            exitorderquantity = newexitavgquantity
                        }
                    } else if (tradeType.toUpperCase() === "SHORT") {
                        if (order.ordertype.toUpperCase() === "SELL") {
                            let newentryquantity = entryorderquantity + Number(order.quantity);
                            let newentryavgprice = ((entryavgprice * entryorderquantity) + (Number(order.quantity) * Number(order.price))) / (entryorderquantity + Number(order.quantity))
                            entryavgprice = newentryavgprice
                            entryorderquantity = newentryquantity
                        } else if (order.ordertype.toUpperCase() === "BUY") {
                            let newexitavgquantity = exitorderquantity + Number(order.quantity);
                            let newexitavgprice = ((exitavgprice * exitorderquantity) + (Number(order.quantity) * Number(order.price))) / (exitorderquantity + Number(order.quantity))
                            exitavgprice = newexitavgprice
                            exitorderquantity = newexitavgquantity
                        }
                    }
                });
                const contracts = entryorderquantity * lotSize;
                const opencontracts = Math.max(entryorderquantity - exitorderquantity, 0) * lotSize;
                const closedcontracts = exitorderquantity * lotSize;
                const status = (entryorderquantity - exitorderquantity === 0) ? "CLOSED" : "OPEN";
                const entrydate = allorders[0]?.date;
                const exitdate = (entryorderquantity - exitorderquantity === 0) ? allorders[allorders.length - 1]?.date : '';
                const finalexitprice = (entryorderquantity - exitorderquantity === 0) ? parseFloat(exitavgprice).toFixed(2) : "0";
                let capitalused = 0;
                let overallreturn = 0;
                if (tradeType.toUpperCase() === "LONG") {
                    capitalused = (entryorderquantity - exitorderquantity !== 0) ? parseFloat((entryorderquantity * entryavgprice) - (exitorderquantity * exitavgprice)).toFixed(2) : 0;
                    overallreturn = parseFloat((exitorderquantity * exitavgprice * lotSize) - (exitorderquantity * entryavgprice * lotSize)).toFixed(2);
                } else if (tradeType.toUpperCase() === "SHORT") {
                    capitalused = (entryorderquantity - exitorderquantity !== 0) ? parseFloat((entryorderquantity * entryavgprice) - (exitorderquantity * exitavgprice)).toFixed(2) : 0;
                    overallreturn = parseFloat((exitorderquantity * entryavgprice * lotSize) - (exitorderquantity * exitavgprice * lotSize)).toFixed(2);
                }
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
                    asset: order.tradingsymbol,
                    ordertype: order.transaction_type,
                    quantity: order.quantity,
                    price: order.price,
                    date: getFormattedDate(order.order_timestamp),
                    tradeid: selectedTradeId,
                    notes: 'Linked from Zerodha',
                    tags: `zerodha,${order.order_id}`,
                };
                await addStockOrder(orderPayload);
                // Tag the original Zerodha order as linked
                await tagZerodhaOrderAsLinked(order.order_id);
                // Fetch all orders for the trade
                const allorders = await getTradeStockOrders(selectedTradeId);
                // Get the selected trade's tradetype from openTrades
                const selectedTrade = openTrades.find(t => t.tradeid === selectedTradeId);
                let tradeType = selectedTrade?.tradetype || 'LONG';
                // Recalculate trade fields
                let entryorderquantity = 0;
                let exitorderquantity = 0;
                let entryavgprice = 0;
                let exitavgprice = 0;
                allorders.forEach(order => {
                    if (tradeType.toUpperCase() === "LONG") {
                        if (order.ordertype.toUpperCase() === "BUY") {
                            let newentryquantity = entryorderquantity + Number(order.quantity);
                            let newentryavgprice = ((entryavgprice * entryorderquantity) + (Number(order.quantity) * Number(order.price))) / (entryorderquantity + Number(order.quantity))
                            entryavgprice = newentryavgprice
                            entryorderquantity = newentryquantity
                        } else if (order.ordertype.toUpperCase() === "SELL") {
                            let newexitavgquantity = exitorderquantity + Number(order.quantity);
                            let newexitavgprice = ((exitavgprice * exitorderquantity) + (Number(order.quantity) * Number(order.price))) / (exitorderquantity + Number(order.quantity))
                            exitavgprice = newexitavgprice
                            exitorderquantity = newexitavgquantity
                        }
                    } else if (tradeType.toUpperCase() === "SHORT") {
                        if (order.ordertype.toUpperCase() === "SELL") {
                            let newentryquantity = entryorderquantity + Number(order.quantity);
                            let newentryavgprice = ((entryavgprice * entryorderquantity) + (Number(order.quantity) * Number(order.price))) / (entryorderquantity + Number(order.quantity))
                            entryavgprice = newentryavgprice
                            entryorderquantity = newentryquantity
                        } else if (order.ordertype.toUpperCase() === "BUY") {
                            let newexitavgquantity = exitorderquantity + Number(order.quantity);
                            let newexitavgprice = ((exitavgprice * exitorderquantity) + (Number(order.quantity) * Number(order.price))) / (exitorderquantity + Number(order.quantity))
                            exitavgprice = newexitavgprice
                            exitorderquantity = newexitavgquantity
                        }
                    }
                });
                const openquantity = Math.max(entryorderquantity - exitorderquantity, 0);
                const closedquantity = exitorderquantity;
                const status = (entryorderquantity - exitorderquantity === 0) ? "CLOSED" : "OPEN";
                const entrydate = allorders[0]?.date;
                const exitdate = (entryorderquantity - exitorderquantity === 0) ? allorders[allorders.length - 1]?.date : '';
                const finalexitprice = (entryorderquantity - exitorderquantity === 0) ? parseFloat(exitavgprice).toFixed(2) : "0";
                let capitalused = 0;
                let overallreturn = 0;
                if (tradeType.toUpperCase() === "LONG") {
                    capitalused = (entryorderquantity - exitorderquantity !== 0) ? parseFloat((entryorderquantity * entryavgprice) - (exitorderquantity * exitavgprice)).toFixed(2) : 0;
                    overallreturn = parseFloat((exitorderquantity * exitavgprice) - (exitorderquantity * entryavgprice)).toFixed(2);
                } else if (tradeType.toUpperCase() === "SHORT") {
                    capitalused = (entryorderquantity - exitorderquantity !== 0) ? parseFloat((entryorderquantity * entryavgprice) - (exitorderquantity * exitavgprice)).toFixed(2) : 0;
                    overallreturn = parseFloat((exitorderquantity * entryavgprice) - (exitorderquantity * exitavgprice)).toFixed(2);
                }
                const lastmodifieddate = getFormattedDate(order.order_timestamp);
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
            const lots = lotSize > 0 ? Math.floor(order.quantity / lotSize) : order.quantity;
            const newTradeId = uuidv4();
            let tradePayload;
            if (isOption) {
                // Option/Future order
                const orderPayload = {
                    asset: order.tradingsymbol,
                    ordertype: order.transaction_type,
                    quantity: lots,
                    price: order.price,
                    date: getFormattedDate(order.order_timestamp),
                    tradeid: newTradeId,
                    notes: 'Linked from Zerodha',
                    tags: `zerodha,${order.order_id}`,
                    lotsize: lotSize
                };
                await addOptionOrder(orderPayload);
                // Tag the original Zerodha order as linked
                await tagZerodhaOrderAsLinked(order.order_id);
                // Fetch all orders for the trade (should be just one, but keeps logic consistent)
                const allorders = await getTradeOptionOrders(newTradeId);
                // Recalculate trade fields (same as update logic)
                let entryorderquantity = 0;
                let exitorderquantity = 0;
                let entryavgprice = 0;
                let exitavgprice = 0;
                let tradeType = orderPayload.ordertype === 'BUY' ? 'LONG' : 'SHORT';
                allorders.forEach(order => {
                    if (tradeType.toUpperCase() === "LONG") {
                        if (order.ordertype.toUpperCase() === "BUY") {
                            let newentryquantity = entryorderquantity + Number(order.quantity);
                            let newentryavgprice = ((entryavgprice * entryorderquantity) + (Number(order.quantity) * Number(order.price))) / (entryorderquantity + Number(order.quantity))
                            entryavgprice = newentryavgprice
                            entryorderquantity = newentryquantity
                        } else if (order.ordertype.toUpperCase() === "SELL") {
                            let newexitavgquantity = exitorderquantity + Number(order.quantity);
                            let newexitavgprice = ((exitavgprice * exitorderquantity) + (Number(order.quantity) * Number(order.price))) / (exitorderquantity + Number(order.quantity))
                            exitavgprice = newexitavgprice
                            exitorderquantity = newexitavgquantity
                        }
                    } else if (tradeType.toUpperCase() === "SHORT") {
                        if (order.ordertype.toUpperCase() === "SELL") {
                            let newentryquantity = entryorderquantity + Number(order.quantity);
                            let newentryavgprice = ((entryavgprice * entryorderquantity) + (Number(order.quantity) * Number(order.price))) / (entryorderquantity + Number(order.quantity))
                            entryavgprice = newentryavgprice
                            entryorderquantity = newentryquantity
                        } else if (order.ordertype.toUpperCase() === "BUY") {
                            let newexitavgquantity = exitorderquantity + Number(order.quantity);
                            let newexitavgprice = ((exitavgprice * exitorderquantity) + (Number(order.quantity) * Number(order.price))) / (exitorderquantity + Number(order.quantity))
                            exitavgprice = newexitavgprice
                            exitorderquantity = newexitavgquantity
                        }
                    }
                });
                const contracts = entryorderquantity * lotSize;
                const opencontracts = Math.max(entryorderquantity - exitorderquantity, 0) * lotSize;
                const closedcontracts = exitorderquantity * lotSize;
                const status = (entryorderquantity - exitorderquantity === 0) ? "CLOSED" : "OPEN";
                const entrydate = allorders[0]?.date;
                const exitdate = (entryorderquantity - exitorderquantity === 0) ? allorders[allorders.length - 1]?.date : '';
                const finalexitprice = (entryorderquantity - exitorderquantity === 0) ? parseFloat(exitavgprice).toFixed(2) : "0";
                let capitalused = 0;
                let overallreturn = 0;
                if (tradeType.toUpperCase() === "LONG") {
                    capitalused = (entryorderquantity - exitorderquantity !== 0) ? parseFloat((entryorderquantity * entryavgprice) - (exitorderquantity * exitavgprice)).toFixed(2) : 0;
                    overallreturn = parseFloat((exitorderquantity * exitavgprice * lotSize) - (exitorderquantity * entryavgprice * lotSize)).toFixed(2);
                } else if (tradeType.toUpperCase() === "SHORT") {
                    capitalused = (entryorderquantity - exitorderquantity !== 0) ? parseFloat((entryorderquantity * entryavgprice) - (exitorderquantity * exitavgprice)).toFixed(2) : 0;
                    overallreturn = parseFloat((exitorderquantity * entryavgprice * lotSize) - (exitorderquantity * exitavgprice * lotSize)).toFixed(2);
                }
                const lastModifiedDate = moment(order.order_timestamp).format('YYYY-MM-DD');
                tradePayload = {
                    tradeid: newTradeId,
                    asset: order.tradingsymbol,
                    tradetype: tradeType,
                    quantity: contracts,
                    entryprice: parseFloat(entryavgprice).toFixed(2),
                    entrydate,
                    openquantity: opencontracts,
                    closedquantity: closedcontracts,
                    exitaverageprice: parseFloat(exitavgprice).toFixed(2),
                    status,
                    notes: 'Created from Zerodha order',
                    tags: 'zerodha',
                    ltp: order.price,
                    lotsize: lotSize,
                    strikeprize: tradeDetails?.strikePrice,
                    finalexitprice,
                    capitalused,
                    overallreturn,
                    lastmodifieddate: lastModifiedDate,
                    exitdate
                };
                await addNewOptionTrade(tradePayload);
            } else {
                // Stock order
                const orderPayload = {
                    asset: order.tradingsymbol,
                    ordertype: order.transaction_type,
                    quantity: order.quantity,
                    price: order.price,
                    date: getFormattedDate(order.order_timestamp),
                    tradeid: newTradeId,
                    notes: 'Linked from Zerodha',
                    tags: `zerodha,${order.order_id}`,
                };
                await addStockOrder(orderPayload);
                // Tag the original Zerodha order as linked
                await tagZerodhaOrderAsLinked(order.order_id);
                // Fetch all orders for the trade (should be just one, but keeps logic consistent)
                const allorders = await getTradeStockOrders(newTradeId);
                // Recalculate trade fields (same as update logic)
                let entryorderquantity = 0;
                let exitorderquantity = 0;
                let entryavgprice = 0;
                let exitavgprice = 0;
                let tradeType = orderPayload.ordertype === 'BUY' ? 'LONG' : 'SHORT';
                allorders.forEach(order => {
                    if (tradeType.toUpperCase() === "LONG") {
                        if (order.ordertype.toUpperCase() === "BUY") {
                            let newentryquantity = entryorderquantity + Number(order.quantity);
                            let newentryavgprice = ((entryavgprice * entryorderquantity) + (Number(order.quantity) * Number(order.price))) / (entryorderquantity + Number(order.quantity))
                            entryavgprice = newentryavgprice
                            entryorderquantity = newentryquantity
                        } else if (order.ordertype.toUpperCase() === "SELL") {
                            let newexitavgquantity = exitorderquantity + Number(order.quantity);
                            let newexitavgprice = ((exitavgprice * exitorderquantity) + (Number(order.quantity) * Number(order.price))) / (exitorderquantity + Number(order.quantity))
                            exitavgprice = newexitavgprice
                            exitorderquantity = newexitavgquantity
                        }
                    } else if (tradeType.toUpperCase() === "SHORT") {
                        if (order.ordertype.toUpperCase() === "SELL") {
                            let newentryquantity = entryorderquantity + Number(order.quantity);
                            let newentryavgprice = ((entryavgprice * entryorderquantity) + (Number(order.quantity) * Number(order.price))) / (entryorderquantity + Number(order.quantity))
                            entryavgprice = newentryavgprice
                            entryorderquantity = newentryquantity
                        } else if (order.ordertype.toUpperCase() === "BUY") {
                            let newexitavgquantity = exitorderquantity + Number(order.quantity);
                            let newexitavgprice = ((exitavgprice * exitorderquantity) + (Number(order.quantity) * Number(order.price))) / (exitorderquantity + Number(order.quantity))
                            exitavgprice = newexitavgprice
                            exitorderquantity = newexitavgquantity
                        }
                    }
                });
                const openquantity = Math.max(entryorderquantity - exitorderquantity, 0);
                const closedquantity = exitorderquantity;
                const status = (entryorderquantity - exitorderquantity === 0) ? "CLOSED" : "OPEN";
                const entrydate = allorders[0]?.date;
                const exitdate = (entryorderquantity - exitorderquantity === 0) ? allorders[allorders.length - 1]?.date : '';
                const finalexitprice = (entryorderquantity - exitorderquantity === 0) ? parseFloat(exitavgprice).toFixed(2) : "0";
                let capitalused = 0;
                let overallreturn = 0;
                if (tradeType.toUpperCase() === "LONG") {
                    capitalused = (entryorderquantity - exitorderquantity !== 0) ? parseFloat((entryorderquantity * entryavgprice) - (exitorderquantity * exitavgprice)).toFixed(2) : 0;
                    overallreturn = parseFloat((exitorderquantity * exitavgprice) - (exitorderquantity * entryavgprice)).toFixed(2);
                } else if (tradeType.toUpperCase() === "SHORT") {
                    capitalused = (entryorderquantity - exitorderquantity !== 0) ? parseFloat((entryorderquantity * entryavgprice) - (exitorderquantity * exitavgprice)).toFixed(2) : 0;
                    overallreturn = parseFloat((exitorderquantity * entryavgprice) - (exitorderquantity * exitavgprice)).toFixed(2);
                }
                const lastModifiedDate = getFormattedDate(order.order_timestamp);
                tradePayload = {
                    tradeid: newTradeId,
                    asset: order.tradingsymbol,
                    tradetype: tradeType,
                    quantity: entryorderquantity,
                    entryprice: parseFloat(entryavgprice).toFixed(2),
                    entrydate,
                    openquantity,
                    closedquantity,
                    exitaverageprice: parseFloat(exitavgprice).toFixed(2),
                    status,
                    notes: 'Created from Zerodha order',
                    tags: 'zerodha',
                    ltp: order.price,
                    finalexitprice,
                    capitalused,
                    overallreturn,
                    lastmodifieddate: lastModifiedDate,
                    exitdate
                };
                await addNewStockTrade(tradePayload);
            }
            setNewlyCreatedTrade(tradePayload);
            setShowAssignStrategy(true);
            setCreating(false);
        } catch (err) {
            setError('Failed to create new trade.');
            setCreating(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                }
            }}
        >
            <DialogTitle sx={{
                fontWeight: 700,
                fontSize: 22,
                pb: 1,
                borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                backgroundColor: '#f8fafc'
            }}>
                Link Order to Trade
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
                <Box sx={{ height: 20 }} />
                <Card variant="outlined" sx={{
                    mb: 3,
                    bgcolor: '#f8fafc',
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                    border: '1px solid rgba(0, 0, 0, 0.08)'
                }}>
                    <CardContent>
                        <Typography variant="subtitle2" color="primary" gutterBottom sx={{
                            fontWeight: 600,
                            fontSize: 16,
                            mb: 2
                        }}>
                            Order Summary
                        </Typography>
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: 2
                        }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Symbol</Typography>
                                <Typography variant="body1" fontWeight={500}>{order.tradingsymbol}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Type</Typography>
                                <Typography variant="body1" fontWeight={500} color={order.transaction_type === 'BUY' ? 'success.main' : 'error.main'}>
                                    {order.transaction_type}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Quantity</Typography>
                                <Typography variant="body1" fontWeight={500}>{order.quantity}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Price</Typography>
                                <Typography variant="body1" fontWeight={500}>₹{formatPrice(order.price)}</Typography>
                            </Box>
                            {tradeDetails && (
                                <>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">Instrument Type</Typography>
                                        <Typography variant="body1" fontWeight={500}>
                                            {tradeDetails.type === 'EQ' ? 'Stock' :
                                                tradeDetails.type === 'FUT' ? 'Future' :
                                                    tradeDetails.type === 'CE' ? 'Call Option' :
                                                        tradeDetails.type === 'PE' ? 'Put Option' :
                                                            tradeDetails.type}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">Underlying Asset</Typography>
                                        <Typography variant="body1" fontWeight={500}>{tradeDetails.underlyingAsset}</Typography>
                                    </Box>
                                    {(tradeDetails.type === 'CE' || tradeDetails.type === 'PE') && (
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">Strike Price</Typography>
                                            <Typography variant="body1" fontWeight={500}>₹{formatPrice(tradeDetails.strikePrice)}</Typography>
                                        </Box>
                                    )}
                                    {tradeDetails.expiry && (
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">Expiry</Typography>
                                            <Typography variant="body1" fontWeight={500}>
                                                {moment(tradeDetails.expiry).format('DD MMM YYYY')}
                                            </Typography>
                                        </Box>
                                    )}
                                </>
                            )}
                        </Box>
                    </CardContent>
                </Card>

                {isOption && (
                    <Box sx={{ mb: 3 }}>
                        <TextField
                            label="Lot Size"
                            type="number"
                            value={lotSize}
                            onChange={(e) => setLotSize(e.target.value)}
                            error={!!lotSizeError}
                            helperText={lotSizeError}
                            disabled={lotSizeLoading}
                            fullWidth
                            sx={{ mb: 2 }}
                        />
                    </Box>
                )}

                {loading ? (
                    <Box display="flex" justifyContent="center" py={3}>
                        <CircularProgress size={40} />
                    </Box>
                ) : (
                    <>
                        {openTrades.length > 0 ? (
                            <>
                                <Typography variant="subtitle2" color="primary" sx={{
                                    mb: 2,
                                    fontWeight: 600,
                                    fontSize: 16
                                }}>
                                    Select an open trade to link:
                                </Typography>
                                <List sx={{
                                    bgcolor: '#f5f7fa',
                                    borderRadius: 2,
                                    mb: 2,
                                    p: 1
                                }}>
                                    {openTrades.map(trade => (
                                        <ListItem
                                            key={trade.tradeid}
                                            sx={{
                                                border: selectedTradeId === trade.tradeid ? '2px solid #1976d2' : '1px solid #e0e0e0',
                                                borderRadius: 2,
                                                mb: 1,
                                                bgcolor: selectedTradeId === trade.tradeid ? '#e3f2fd' : 'inherit',
                                                transition: 'all 0.2s',
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    bgcolor: selectedTradeId === trade.tradeid ? '#e3f2fd' : '#f8fafc',
                                                    borderColor: '#1976d2'
                                                }
                                            }}
                                            onClick={() => setSelectedTradeId(trade.tradeid)}
                                        >
                                            <ListItemAvatar>
                                                <Avatar sx={{
                                                    bgcolor: '#1976d2',
                                                    color: 'white',
                                                    fontWeight: 700,
                                                    width: 40,
                                                    height: 40
                                                }}>
                                                    {trade.asset[0]}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={<Typography variant="subtitle1" fontWeight={600} component="span">{trade.asset}</Typography>}
                                                secondary={<Typography variant="body2" color="text.secondary" component="span">
                                                    Type: {trade.tradetype}, Qty: {trade.quantity}, Entry: ₹{trade.entryprice}
                                                </Typography>}
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
                                    sx={{
                                        mt: 1,
                                        width: '100%',
                                        py: 1.2,
                                        fontWeight: 600,
                                        fontSize: 16,
                                        textTransform: 'none',
                                        borderRadius: 2
                                    }}
                                >
                                    {linking ? 'Linking...' : 'Link to Selected Trade'}
                                </Button>
                            </>
                        ) : (
                            <Alert severity="info" sx={{
                                mb: 2,
                                borderRadius: 2,
                                '& .MuiAlert-icon': {
                                    color: 'info.main'
                                }
                            }}>
                                No open trades found for this asset.
                            </Alert>
                        )}

                        <Divider sx={{ my: 3 }} />

                        <Typography variant="subtitle2" color="primary" sx={{
                            mb: 2,
                            fontWeight: 600,
                            fontSize: 16
                        }}>
                            Or create a new trade:
                        </Typography>

                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={handleCreateNewTrade}
                            disabled={creating}
                            sx={{
                                width: '100%',
                                py: 1.2,
                                fontWeight: 600,
                                fontSize: 16,
                                textTransform: 'none',
                                borderRadius: 2
                            }}
                        >
                            {creating ? 'Creating...' : 'Create New Trade'}
                        </Button>
                    </>
                )}

                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
            </DialogActions>
            {showAssignStrategy && newlyCreatedTrade && (
                <AssignTradesToStrategy
                    title="Assign New Trade to Strategy"
                    tradeDetails={[newlyCreatedTrade]}
                    open={showAssignStrategy}
                    onSubmit={() => {
                        setShowAssignStrategy(false);
                        setNewlyCreatedTrade(null);
                        if (onSuccess) onSuccess();
                        if (onClose) onClose();
                    }}
                    onClose={() => {
                        setShowAssignStrategy(false);
                        setNewlyCreatedTrade(null);
                        if (onSuccess) onSuccess();
                        if (onClose) onClose();
                    }}
                />
            )}
        </Dialog>
    );
};

export default LinkToTradePopup; 