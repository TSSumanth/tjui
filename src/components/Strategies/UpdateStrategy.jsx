import React, { useState, useEffect, useCallback } from "react";
import {
    Box,
    Button,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    Grid,
    Card,
    CardContent,
    Divider,
    Tab,
    Tabs,
    Dialog,
    TableContainer,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Snackbar,
} from "@mui/material";
import { getStrategies, updateStrategy, getStrategyNotes } from "../../services/strategies";
import { getStockTradesbyId, getOptionTradesbyId, addNewStockTrade, updateStockTrade, addNewOptionTrade, updateOptionTrade } from "../../services/trades";
import StrategyForm from "./StrategyForm";
import TradesTable from "../Trades/TradesTable";
import { StockTradeForm } from "../Trades/StockTradeForm";
import OptionTradeForm from "../Trades/OptionTradeForm";
import NotesTable from "./NotesTable";
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import moment from 'moment';

const TABLE_STYLES = {
    container: {
        padding: 2,
        borderRadius: 2,
        boxShadow: 3,
        width: '100%',
        overflowX: 'auto'
    },
    header: {
        backgroundColor: "primary.light",
        '& th': {
            fontWeight: 'bold',
            color: 'primary.contrastText',
            whiteSpace: 'nowrap'
        }
    },
    row: {
        cursor: 'pointer',
        '&:hover': {
            backgroundColor: 'action.hover'
        }
    },
    selectedRow: {
        backgroundColor: 'primary.light',
        '&:hover': {
            backgroundColor: 'primary.light'
        }
    },
    evenRow: {
        backgroundColor: 'background.default'
    },
    oddRow: {
        backgroundColor: 'background.paper'
    }
};

function UpdateStrategy({ id }) {
    const [strategy, setStrategy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stockTrades, setStockTrades] = useState([]);
    const [optionTrades, setOptionTrades] = useState([]);
    const [notes, setNotes] = useState([]);
    const [activeTab, setActiveTab] = useState(0);
    const [showCreateStockTrade, setShowCreateStockTrade] = useState(false);
    const [showCreateOptionTrade, setShowCreateOptionTrade] = useState(false);
    const [showUpdateTrade, setShowUpdateTrade] = useState(false);
    const [selectedTrade, setSelectedTrade] = useState(null);
    const [totalUnrealizedPL, setTotalUnrealizedPL] = useState(0);
    const [nameError, setNameError] = useState("");
    const [showLTPDialog, setShowLTPDialog] = useState(false);
    const [plSummary, setPlSummary] = useState({
        realizedPL: 0,
        unrealizedPL: 0,
        hasAllLTP: true
    });
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    const fetchNotes = useCallback(async (strategyId) => {
        try {
            const notesData = await getStrategyNotes(strategyId);
            setNotes(notesData);
        } catch (error) {
            console.error("Error fetching notes:", error);
            setError("Failed to load notes data.");
        }
    }, []);

    const fetchTrades = useCallback(async () => {
        console.log('fetchTrades called with strategy:', strategy);
        if (!strategy) {
            console.log('No strategy data available, skipping trade fetch');
            return;
        }

        try {
            const stockTradeIds = Array.isArray(strategy.stock_trades) ? strategy.stock_trades : [];
            const optionTradeIds = Array.isArray(strategy.option_trades) ? strategy.option_trades : [];

            console.log('Fetching trades with IDs:', { stockTradeIds, optionTradeIds });

            let stockTradesData = [];
            let optionTradesData = [];
            let overallReturn = 0;

            if (stockTradeIds.length > 0) {
                stockTradesData = await getStockTradesbyId(stockTradeIds);
                console.log('Fetched stock trades:', stockTradesData);
                if (Array.isArray(stockTradesData)) {
                    overallReturn += stockTradesData.reduce((sum, trade) => sum + (Number(trade.return) || 0), 0);
                }
            }

            if (optionTradeIds.length > 0) {
                optionTradesData = await getOptionTradesbyId(optionTradeIds);
                console.log('Fetched option trades:', optionTradesData);
                if (Array.isArray(optionTradesData)) {
                    overallReturn += optionTradesData.reduce((sum, trade) => sum + (Number(trade.return) || 0), 0);
                }
            }

            // Format dates for all trades
            const formatTrades = (trades) => {
                if (!Array.isArray(trades)) return [];
                return trades.map(trade => ({
                    ...trade,
                    entrydate: trade.entrydate ? moment(trade.entrydate).format('YYYY-MM-DD HH:mm:ss') : null,
                    exitdate: trade.exitdate ? moment(trade.exitdate).format('YYYY-MM-DD HH:mm:ss') : null,
                    lastmodifieddate: trade.lastmodifieddate ? moment(trade.lastmodifieddate).format('YYYY-MM-DD HH:mm:ss') : null,
                    return: Number(trade.return) || 0,
                    overallreturn: Number(trade.overallreturn) || 0
                }));
            };

            const formattedStockTrades = formatTrades(stockTradesData || []);
            const formattedOptionTrades = formatTrades(optionTradesData || []);

            console.log('Setting trades state with:', {
                stockTrades: formattedStockTrades,
                optionTrades: formattedOptionTrades,
                overallReturn
            });

            setStockTrades(formattedStockTrades);
            setOptionTrades(formattedOptionTrades);
            setTotalUnrealizedPL(overallReturn);
        } catch (error) {
            console.error('Error fetching trades:', error);
            setError('Failed to fetch trades. Please try again later.');
        }
    }, [strategy]);

    const fetchStrategy = useCallback(async () => {
        if (!id) {
            setError("No strategy ID provided");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            // Get strategy by ID
            const response = await getStrategies({ id });
            console.log('Strategy API Response:', response);

            if (response) {
                // Handle both array and single object responses
                const strategyData = Array.isArray(response) ? response[0] : response;

                if (strategyData && strategyData.id) {
                    console.log('Strategy data:', strategyData);
                    console.log('Stock trades:', strategyData.stock_trades);
                    console.log('Option trades:', strategyData.option_trades);

                    // Ensure trades are arrays
                    if (!Array.isArray(strategyData.stock_trades)) {
                        strategyData.stock_trades = [];
                    }
                    if (!Array.isArray(strategyData.option_trades)) {
                        strategyData.option_trades = [];
                    }

                    setStrategy(strategyData);
                } else {
                    setError("Strategy not found");
                }
            } else {
                setError("No response from server");
            }
        } catch (error) {
            console.error('Error fetching strategy:', error);
            setError("Failed to load strategy data");
        } finally {
            setLoading(false);
        }
    }, [id]);

    const handleTradeClick = (trade) => {
        setSelectedTrade(trade);
        setShowUpdateTrade(true);
    };

    const handleUpdateTrade = async (updatedTrade) => {
        try {
            const response = updatedTrade.lotsize === undefined
                ? await updateStockTrade(updatedTrade)
                : await updateOptionTrade(updatedTrade);

            if (response) {
                await fetchTrades();
                setShowUpdateTrade(false);
            }
        } catch (error) {
            console.error('Error updating trade:', error);
            setError("Failed to update trade.");
        }
    };

    const handleSubmitTrade = async (tradeDetails, isStock) => {
        try {
            console.log('Submitting trade:', tradeDetails, 'isStock:', isStock);
            const response = isStock
                ? await addNewStockTrade({ ...tradeDetails, strategy_id: id })
                : await addNewOptionTrade({ ...tradeDetails, strategy_id: id });

            console.log('Trade submission response:', response);

            if (response?.tradeid) {
                // Create a new array of trade IDs
                const updatedStrategy = {
                    ...strategy,
                    [isStock ? 'stock_trades' : 'option_trades']: [
                        ...(Array.isArray(strategy[isStock ? 'stock_trades' : 'option_trades'])
                            ? strategy[isStock ? 'stock_trades' : 'option_trades']
                            : []),
                        response.tradeid
                    ]
                };

                console.log('Updating strategy with new trade:', updatedStrategy);

                // Update the strategy in the database
                const updateResponse = await updateStrategy(updatedStrategy);
                console.log('Strategy update response:', updateResponse);

                if (updateResponse) {
                    // Fetch the updated strategy to ensure we have the latest data
                    const refreshedStrategy = await getStrategies({ id });
                    const strategyData = Array.isArray(refreshedStrategy) ? refreshedStrategy[0] : refreshedStrategy;

                    if (strategyData) {
                        console.log('Refreshed strategy data:', strategyData);
                        setStrategy(strategyData);
                        await fetchTrades();
                    }

                    isStock ? setShowCreateStockTrade(false) : setShowCreateOptionTrade(false);
                } else {
                    setError("Failed to update strategy with new trade");
                }
            } else {
                setError("Failed to create trade");
            }
        } catch (error) {
            console.error("Error creating trade:", error);
            setError("Failed to create trade: " + error.message);
        }
    };

    const handleNameChange = (event) => {
        const newName = event.target.value.trim();
        setNameError(newName === strategy?.name ? "Strategy name is already in use" : "");

        setStrategy((prev) => ({
            ...prev,
            name: newName,
        }));
    };

    const handleStatusChange = (event) => {
        setStrategy((prev) => ({
            ...prev,
            status: event.target.value,
        }));
    };

    const handleUpdateStrategy = async () => {
        try {
            await updateStrategy(strategy);
            await fetchTrades();
            setSnackbar({
                open: true,
                message: 'Strategy updated successfully!',
                severity: 'success'
            });
        } catch (error) {
            console.error("Strategy update failed:", error);
            setSnackbar({
                open: true,
                message: 'Failed to update strategy. Please try again.',
                severity: 'error'
            });
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    const calculateUnrealizedPL = useCallback((trade) => {
        if (!trade || trade.status !== 'OPEN' || !trade.ltp || !trade.openquantity) return 0;

        const ltp = parseFloat(trade.ltp);
        // Return 0 if LTP is 0 or 0.00
        if (ltp === 0 || ltp === 0.00) return 0;

        const quantity = parseInt(trade.openquantity);
        const entryPrice = parseFloat(trade.entryprice);

        // For options, quantity is already adjusted with lot size in the database
        // So we don't need to multiply by lot size here
        if (trade.tradetype === 'LONG') {
            return quantity * (ltp - entryPrice);
        } else {
            return quantity * (entryPrice - ltp);
        }
    }, []);

    const handleGenerateUnrealizedPL = async () => {
        try {
            let totalUnrealized = 0;
            const updatedStockTrades = [];
            const updatedOptionTrades = [];

            // Prepare stock trades updates
            stockTrades.forEach(trade => {
                if (trade.status === 'OPEN') {
                    const updatedTrade = {
                        ...trade,
                        ltp: trade.ltp
                    };
                    const unrealizedPL = calculateUnrealizedPL(updatedTrade);
                    updatedTrade.unrealizedpl = unrealizedPL;
                    totalUnrealized += unrealizedPL;
                    updatedStockTrades.push(updatedTrade);
                }
            });

            // Prepare option trades updates
            optionTrades.forEach(trade => {
                if (trade.status === 'OPEN') {
                    const updatedTrade = {
                        ...trade,
                        ltp: trade.ltp
                    };
                    const unrealizedPL = calculateUnrealizedPL(updatedTrade);
                    updatedTrade.unrealizedpl = unrealizedPL;
                    totalUnrealized += unrealizedPL;
                    updatedOptionTrades.push(updatedTrade);
                }
            });

            // Batch update all trades
            const updatePromises = [
                ...updatedStockTrades.map(trade => updateStockTrade(trade)),
                ...updatedOptionTrades.map(trade => updateOptionTrade(trade))
            ];

            await Promise.all(updatePromises);

            // Update local state
            setTotalUnrealizedPL(totalUnrealized);
            setStockTrades(prevTrades =>
                prevTrades.map(trade => {
                    const updatedTrade = updatedStockTrades.find(t => t.tradeid === trade.tradeid);
                    return updatedTrade || trade;
                })
            );
            setOptionTrades(prevTrades =>
                prevTrades.map(trade => {
                    const updatedTrade = updatedOptionTrades.find(t => t.tradeid === trade.tradeid);
                    return updatedTrade || trade;
                })
            );

            setShowLTPDialog(false);
            calculatePLSummary();
        } catch (error) {
            console.error('Error updating LTPs:', error);
            setError("Failed to update LTPs.");
        }
    };

    const checkAllTradesHaveLTP = useCallback(() => {
        const openStockTrades = stockTrades.filter(trade => trade.status === 'OPEN');
        const openOptionTrades = optionTrades.filter(trade => trade.status === 'OPEN');

        const allTradesHaveLTP = [...openStockTrades, ...openOptionTrades]
            .every(trade => trade.ltp && trade.ltp !== '');

        return allTradesHaveLTP;
    }, [stockTrades, optionTrades]);

    const calculatePLSummary = useCallback(() => {
        let realizedPL = 0;
        let unrealizedPL = 0;
        const hasAllLTP = checkAllTradesHaveLTP();

        // Calculate for stock trades
        stockTrades.forEach(trade => {
            if (trade.status === 'CLOSED') {
                realizedPL += parseFloat(trade.overallreturn || 0);
            } else if (trade.status === 'OPEN' && hasAllLTP) {
                unrealizedPL += calculateUnrealizedPL(trade);
            }
        });

        // Calculate for option trades
        optionTrades.forEach(trade => {
            if (trade.status === 'CLOSED') {
                realizedPL += parseFloat(trade.overallreturn || 0);
            } else if (trade.status === 'OPEN' && hasAllLTP) {
                unrealizedPL += calculateUnrealizedPL(trade);
            }
        });

        setPlSummary({
            realizedPL,
            unrealizedPL,
            hasAllLTP
        });
    }, [stockTrades, optionTrades, calculateUnrealizedPL, checkAllTradesHaveLTP]);

    const sortTrades = useCallback((trades) => {
        return [...trades].sort((a, b) => {
            // First sort by status (OPEN first)
            if (a.status === 'OPEN' && b.status !== 'OPEN') return -1;
            if (a.status !== 'OPEN' && b.status === 'OPEN') return 1;

            // Then sort by entry date (newest first)
            const dateA = new Date(a.entrydate);
            const dateB = new Date(b.entrydate);
            return dateB - dateA;
        });
    }, []);

    useEffect(() => {
        console.log('Initial load - fetching strategy');
        fetchStrategy();
    }, [id, fetchStrategy]);

    useEffect(() => {
        if (strategy && strategy.id) {
            console.log('Strategy updated, fetching trades and notes');
            fetchTrades();
            fetchNotes(strategy.id);
        }
    }, [strategy, fetchTrades, fetchNotes]);

    useEffect(() => {
        if (strategy && strategy.id) {
            console.log('Strategy loaded, fetching trades');
            fetchTrades();
        }
    }, [strategy?.id, fetchTrades]);

    useEffect(() => {
        calculatePLSummary();
    }, [calculatePLSummary]);

    const PLSummaryCard = () => {
        const hasOpenTrades = [...stockTrades, ...optionTrades].some(trade => trade.status === 'OPEN');
        const hasOpenTradesWithZeroLTP = React.useMemo(() => {
            const openTrades = [...stockTrades, ...optionTrades].filter(trade => trade.status === 'OPEN');
            return openTrades.some(trade => !trade.ltp || parseFloat(trade.ltp) === 0 || parseFloat(trade.ltp) === 0.00);
        }, [stockTrades, optionTrades]);

        const tradesNeedingUpdate = React.useMemo(() => {
            return [...stockTrades, ...optionTrades]
                .filter(trade => trade.status === 'OPEN' && (!trade.ltp || parseFloat(trade.ltp) === 0 || parseFloat(trade.ltp) === 0.00))
                .map(trade => `${trade.asset}${trade.strikeprize ? ` ${trade.strikeprize}` : ''}`);
        }, [stockTrades, optionTrades]);

        return (
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        P/L Summary
                    </Typography>

                    {hasOpenTrades && hasOpenTradesWithZeroLTP && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            Please update LTP for: {tradesNeedingUpdate.join(', ')}
                        </Alert>
                    )}

                    {hasOpenTrades && !plSummary.hasAllLTP && !hasOpenTradesWithZeroLTP && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Please update LTP of all open positions to view complete P/L Summary
                        </Alert>
                    )}

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Realized P/L
                            </Typography>
                            <Typography
                                variant="h6"
                                sx={{
                                    color: plSummary.realizedPL >= 0 ? 'success.main' : 'error.main',
                                    fontWeight: 'bold'
                                }}
                            >
                                {plSummary.realizedPL >= 0 ? '+' : ''}
                                ₹{plSummary.realizedPL.toFixed(2)}
                            </Typography>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Unrealized P/L
                            </Typography>
                            <Typography
                                variant="h6"
                                sx={{
                                    color: plSummary.unrealizedPL >= 0 ? 'success.main' : 'error.main',
                                    fontWeight: 'bold'
                                }}
                            >
                                {plSummary.hasAllLTP && !hasOpenTradesWithZeroLTP ? (
                                    <>
                                        {plSummary.unrealizedPL >= 0 ? '+' : ''}
                                        ₹{plSummary.unrealizedPL.toFixed(2)}
                                    </>
                                ) : '-'}
                            </Typography>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Total P/L
                            </Typography>
                            <Typography
                                variant="h6"
                                sx={{
                                    color: plSummary.realizedPL >= 0 ? 'success.main' : 'error.main',
                                    fontWeight: 'bold'
                                }}
                            >
                                {plSummary.hasAllLTP && !hasOpenTradesWithZeroLTP ? (
                                    <>
                                        {(plSummary.realizedPL + plSummary.unrealizedPL) >= 0 ? '+' : ''}
                                        ₹{(plSummary.realizedPL + plSummary.unrealizedPL).toFixed(2)}
                                    </>
                                ) : (
                                    <>
                                        ₹{plSummary.realizedPL.toFixed(2)}
                                        {hasOpenTrades && !hasOpenTradesWithZeroLTP && <span style={{ color: 'text.secondary' }}> (+ Unrealized P/L)</span>}
                                    </>
                                )}
                            </Typography>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        );
    };

    const LTPInput = React.memo(({ trade, value, onValueChange }) => {
        const handleChange = React.useCallback((e) => {
            onValueChange(trade.tradeid, e.target.value);
        }, [trade.tradeid, onValueChange]);

        return (
            <Box sx={{ mb: 2 }}>
                <TextField
                    label={`${trade.asset} ${trade.strikeprize ? trade.strikeprize : ''} (Entry: ${trade.entryprice})`}
                    type="number"
                    value={value || ''}
                    onChange={handleChange}
                    fullWidth
                    size="small"
                />
            </Box>
        );
    });
    LTPInput.displayName = 'LTPInput';

    const TradeSection = React.memo(({ trades, title, values, onValueChange }) => {
        if (trades.length === 0) return null;

        return (
            <>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                    {title}
                </Typography>
                {trades.map(trade => (
                    <LTPInput
                        key={trade.tradeid}
                        trade={trade}
                        value={values[trade.tradeid]}
                        onValueChange={onValueChange}
                    />
                ))}
            </>
        );
    });
    TradeSection.displayName = 'TradeSection';

    const LTPUpdateDialog = () => {
        const [ltpValues, setLtpValues] = React.useState({});

        const openStockTrades = React.useMemo(() =>
            stockTrades.filter(trade => trade.status === 'OPEN'),
            [stockTrades]
        );

        const openOptionTrades = React.useMemo(() =>
            optionTrades.filter(trade => trade.status === 'OPEN'),
            [optionTrades]
        );

        const hasOpenTrades = openStockTrades.length > 0 || openOptionTrades.length > 0;

        const handleClose = React.useCallback(() => {
            setShowLTPDialog(false);
            setLtpValues({});
        }, []);

        const handleValueChange = React.useCallback((tradeId, value) => {
            setLtpValues(prev => ({
                ...prev,
                [tradeId]: value
            }));
        }, []);

        const handleSubmit = React.useCallback(async () => {
            try {
                let totalUnrealized = 0;
                const updatedStockTrades = [];
                const updatedOptionTrades = [];

                // Update stock trades
                for (const trade of openStockTrades) {
                    if (ltpValues[trade.tradeid]) {
                        const updatedTrade = {
                            ...trade,
                            ltp: ltpValues[trade.tradeid]
                        };
                        const unrealizedPL = calculateUnrealizedPL(updatedTrade);
                        updatedTrade.unrealizedpl = unrealizedPL;
                        totalUnrealized += unrealizedPL;
                        updatedStockTrades.push(updatedTrade);
                    }
                }

                // Update option trades
                for (const trade of openOptionTrades) {
                    if (ltpValues[trade.tradeid]) {
                        const updatedTrade = {
                            ...trade,
                            ltp: ltpValues[trade.tradeid]
                        };
                        const unrealizedPL = calculateUnrealizedPL(updatedTrade);
                        updatedTrade.unrealizedpl = unrealizedPL;
                        totalUnrealized += unrealizedPL;
                        updatedOptionTrades.push(updatedTrade);
                    }
                }

                // Update trades in database
                await Promise.all([
                    ...updatedStockTrades.map(trade => updateStockTrade(trade)),
                    ...updatedOptionTrades.map(trade => updateOptionTrade(trade))
                ]);

                // Update local state
                setStockTrades(prevTrades =>
                    prevTrades.map(trade => {
                        const updated = updatedStockTrades.find(t => t.tradeid === trade.tradeid);
                        return updated || trade;
                    })
                );

                setOptionTrades(prevTrades =>
                    prevTrades.map(trade => {
                        const updated = updatedOptionTrades.find(t => t.tradeid === trade.tradeid);
                        return updated || trade;
                    })
                );

                setTotalUnrealizedPL(totalUnrealized);
                setShowLTPDialog(false);
                calculatePLSummary();
                handleClose();
            } catch (error) {
                console.error('Error updating LTPs:', error);
                setError("Failed to update LTPs and calculate P/L.");
            }
        }, [openStockTrades, openOptionTrades, ltpValues, calculateUnrealizedPL, calculatePLSummary, handleClose]);

        // Reset form when dialog opens
        React.useEffect(() => {
            if (showLTPDialog) {
                setLtpValues({});
            }
        }, [showLTPDialog]);

        return (
            <Dialog
                open={showLTPDialog}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
                keepMounted={false}
            >
                <Box sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Update Last Traded Prices
                    </Typography>

                    {!hasOpenTrades && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            No open positions found.
                        </Alert>
                    )}

                    <TradeSection
                        trades={openStockTrades}
                        title="Stock Trades"
                        values={ltpValues}
                        onValueChange={handleValueChange}
                    />

                    <TradeSection
                        trades={openOptionTrades}
                        title="Option Trades"
                        values={ltpValues}
                        onValueChange={handleValueChange}
                    />

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={!hasOpenTrades || Object.keys(ltpValues).length === 0}
                        >
                            Generate Unrealized P/L
                        </Button>
                    </Box>
                </Box>
            </Dialog>
        );
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={4}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box p={4}>
            <Grid container spacing={3}>
                {/* Strategy Details Section */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h5" fontWeight="bold">
                                    {strategy?.name || 'Strategy Details'}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    {totalUnrealizedPL >= 0 ? <TrendingUpIcon color="success" /> : <TrendingDownIcon color="error" />}
                                    <Typography variant="h6" sx={{ ml: 1 }}>
                                        {totalUnrealizedPL >= 0 ? '+' : ''}₹{totalUnrealizedPL.toLocaleString('en-IN')}
                                    </Typography>
                                </Box>
                            </Box>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Name"
                                        value={strategy?.name || ""}
                                        fullWidth
                                        onChange={handleNameChange}
                                        error={!!nameError}
                                        helperText={nameError}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Status</InputLabel>
                                        <Select
                                            value={strategy?.status || ""}
                                            onChange={handleStatusChange}
                                            label="Status"
                                        >
                                            <MenuItem value="OPEN">OPEN</MenuItem>
                                            <MenuItem value="CLOSE">CLOSE</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleUpdateStrategy}
                                    startIcon={<SaveIcon />}
                                >
                                    Update Strategy
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Add P/L Summary Section */}
                <Grid item xs={12}>
                    <PLSummaryCard />
                </Grid>

                {/* Tabs Section */}
                <Grid item xs={12}>
                    <Paper>
                        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                            <Tab label="Trades" />
                            <Tab label="Notes" />
                        </Tabs>
                        <Divider />

                        {/* Trades Tab */}
                        {activeTab === 0 && (
                            <Box p={3}>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 2 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => setShowLTPDialog(true)}
                                    >
                                        Update LTP
                                    </Button>
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => setShowCreateStockTrade(true)}
                                    >
                                        Add Stock Trade
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        startIcon={<AddIcon />}
                                        onClick={() => setShowCreateOptionTrade(true)}
                                    >
                                        Add Option Trade
                                    </Button>
                                </Box>

                                {/* Stock Trades Table */}
                                {stockTrades.length > 0 && (
                                    <TableContainer component={Paper} sx={{ ...TABLE_STYLES.container, mb: 3 }}>
                                        <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                                            Stock Trades
                                        </Typography>
                                        <Table>
                                            <TableHead sx={TABLE_STYLES.header}>
                                                <TableRow>
                                                    <TableCell>Status</TableCell>
                                                    <TableCell>Entry Date</TableCell>
                                                    <TableCell>Asset</TableCell>
                                                    <TableCell>Quantity</TableCell>
                                                    <TableCell>Trade Type</TableCell>
                                                    <TableCell>Entry Price</TableCell>
                                                    <TableCell>Exit Price</TableCell>
                                                    <TableCell>LTP</TableCell>
                                                    <TableCell>Unrealized P/L</TableCell>
                                                    <TableCell>Overall P/L</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {sortTrades(stockTrades).map((trade) => {
                                                    const unrealizedPL = calculateUnrealizedPL(trade);
                                                    return (
                                                        <TableRow
                                                            key={trade.tradeid}
                                                            onClick={() => handleTradeClick(trade)}
                                                            sx={{
                                                                ...TABLE_STYLES.row,
                                                                backgroundColor: trade.status === 'OPEN' ? 'action.hover' : 'inherit'
                                                            }}
                                                        >
                                                            <TableCell>
                                                                <Chip
                                                                    label={trade.status}
                                                                    color={trade.status === 'OPEN' ? 'success' : 'default'}
                                                                    size="small"
                                                                />
                                                            </TableCell>
                                                            <TableCell>{moment(trade.entrydate).format('YYYY-MM-DD')}</TableCell>
                                                            <TableCell>{trade.asset}</TableCell>
                                                            <TableCell>{trade.quantity}</TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={trade.tradetype}
                                                                    color={trade.tradetype === 'LONG' ? 'primary' : 'secondary'}
                                                                    size="small"
                                                                />
                                                            </TableCell>
                                                            <TableCell>{trade.entryprice}</TableCell>
                                                            <TableCell>{trade.exitaverageprice || '-'}</TableCell>
                                                            <TableCell>{trade.ltp || '-'}</TableCell>
                                                            <TableCell
                                                                sx={{
                                                                    color: unrealizedPL >= 0 ? 'success.main' : 'error.main',
                                                                    fontWeight: 'bold'
                                                                }}
                                                            >
                                                                {trade.status === 'OPEN'
                                                                    ? `${unrealizedPL >= 0 ? '+' : ''}${unrealizedPL.toFixed(2)}`
                                                                    : '-'}
                                                            </TableCell>
                                                            <TableCell
                                                                sx={{
                                                                    color: trade.overallreturn >= 0 ? 'success.main' : 'error.main',
                                                                    fontWeight: 'bold'
                                                                }}
                                                            >
                                                                {trade.overallreturn >= 0 ? '+' : ''}{trade.overallreturn}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}

                                {/* Option Trades Table */}
                                {optionTrades.length > 0 && (
                                    <TableContainer component={Paper} sx={TABLE_STYLES.container}>
                                        <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                                            Option Trades
                                        </Typography>
                                        <Table>
                                            <TableHead sx={TABLE_STYLES.header}>
                                                <TableRow>
                                                    <TableCell>Status</TableCell>
                                                    <TableCell>Entry Date</TableCell>
                                                    <TableCell>Asset</TableCell>
                                                    <TableCell>Strike Price</TableCell>
                                                    <TableCell>Lots</TableCell>
                                                    <TableCell>Trade Type</TableCell>
                                                    <TableCell>Entry Price</TableCell>
                                                    <TableCell>Exit Price</TableCell>
                                                    <TableCell>LTP</TableCell>
                                                    <TableCell>Unrealized P/L</TableCell>
                                                    <TableCell>Overall P/L</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {sortTrades(optionTrades).map((trade) => {
                                                    const unrealizedPL = calculateUnrealizedPL(trade);
                                                    return (
                                                        <TableRow
                                                            key={trade.tradeid}
                                                            onClick={() => handleTradeClick(trade)}
                                                            sx={{
                                                                ...TABLE_STYLES.row,
                                                                backgroundColor: trade.status === 'OPEN' ? 'action.hover' : 'inherit'
                                                            }}
                                                        >
                                                            <TableCell>
                                                                <Chip
                                                                    label={trade.status}
                                                                    color={trade.status === 'OPEN' ? 'success' : 'default'}
                                                                    size="small"
                                                                />
                                                            </TableCell>
                                                            <TableCell>{moment(trade.entrydate).format('YYYY-MM-DD')}</TableCell>
                                                            <TableCell>{trade.asset}</TableCell>
                                                            <TableCell>{trade.strikeprize}</TableCell>
                                                            <TableCell>{trade.quantity / trade.lotsize}</TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={trade.tradetype}
                                                                    color={trade.tradetype === 'LONG' ? 'primary' : 'secondary'}
                                                                    size="small"
                                                                />
                                                            </TableCell>
                                                            <TableCell>{trade.entryprice}</TableCell>
                                                            <TableCell>{trade.exitaverageprice || '-'}</TableCell>
                                                            <TableCell>{trade.ltp || '-'}</TableCell>
                                                            <TableCell
                                                                sx={{
                                                                    color: unrealizedPL >= 0 ? 'success.main' : 'error.main',
                                                                    fontWeight: 'bold'
                                                                }}
                                                            >
                                                                {trade.status === 'OPEN'
                                                                    ? `${unrealizedPL >= 0 ? '+' : ''}${unrealizedPL.toFixed(2)}`
                                                                    : '-'}
                                                            </TableCell>
                                                            <TableCell
                                                                sx={{
                                                                    color: trade.overallreturn >= 0 ? 'success.main' : 'error.main',
                                                                    fontWeight: 'bold'
                                                                }}
                                                            >
                                                                {trade.overallreturn >= 0 ? '+' : ''}{trade.overallreturn}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </Box>
                        )}

                        {/* Notes Tab */}
                        {activeTab === 1 && (
                            <Box p={3}>
                                <NotesTable
                                    notes={notes}
                                    onUpdate={() => fetchNotes(strategy.id)}
                                />
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Dialogs */}
            <Dialog
                open={showCreateStockTrade}
                onClose={() => setShowCreateStockTrade(false)}
                maxWidth="md"
                fullWidth
            >
                <StockTradeForm
                    title="Create Stock Trade"
                    onSubmit={(details) => handleSubmitTrade(details, true)}
                    onCancel={() => setShowCreateStockTrade(false)}
                    strategyid={strategy?.id}
                />
            </Dialog>

            <Dialog
                open={showCreateOptionTrade}
                onClose={() => setShowCreateOptionTrade(false)}
                maxWidth="md"
                fullWidth
            >
                <OptionTradeForm
                    title="Create Option Trade"
                    onSubmit={(details) => handleSubmitTrade(details, false)}
                    onCancel={() => setShowCreateOptionTrade(false)}
                    strategyid={strategy?.id}
                />
            </Dialog>

            <Dialog
                open={showUpdateTrade}
                onClose={() => setShowUpdateTrade(false)}
                maxWidth="md"
                fullWidth
            >
                {selectedTrade && (
                    selectedTrade.lotsize === undefined ? (
                        <StockTradeForm
                            title="Update Stock Trade"
                            onSubmit={handleUpdateTrade}
                            onCancel={() => setShowUpdateTrade(false)}
                            strategyid={strategy?.id}
                            currentTrade={selectedTrade}
                            isUpdate={true}
                        />
                    ) : (
                        <OptionTradeForm
                            title="Update Option Trade"
                            onSubmit={handleUpdateTrade}
                            onCancel={() => setShowUpdateTrade(false)}
                            strategyid={strategy?.id}
                            currentTrade={selectedTrade}
                            isUpdate={true}
                        />
                    )
                )}
            </Dialog>

            <LTPUpdateDialog />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default UpdateStrategy;