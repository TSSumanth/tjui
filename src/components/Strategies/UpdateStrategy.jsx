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
    const [trades, setTrades] = useState([]);
    const [stockTrades, setStockTrades] = useState([]);
    const [optionTrades, setOptionTrades] = useState([]);
    const [notes, setNotes] = useState([]);
    const [activeTab, setActiveTab] = useState(0);
    const [showCreateStockTrade, setShowCreateStockTrade] = useState(false);
    const [showCreateOptionTrade, setShowCreateOptionTrade] = useState(false);
    const [showUpdateTrade, setShowUpdateTrade] = useState(false);
    const [selectedTrade, setSelectedTrade] = useState(null);
    const [totalUnrealizedPL, setTotalUnrealizedPL] = useState(0);
    const [currentStockPrice, setCurrentStockPrice] = useState("");
    const [stockPriceError, setStockPriceError] = useState("");
    const [optionAssets, setOptionAssets] = useState([]);
    const [optionPriceErrors, setOptionPriceErrors] = useState([]);
    const [nameError, setNameError] = useState("");
    const [existingStrategies, setExistingStrategies] = useState([]);
    const [openTradesLTP, setOpenTradesLTP] = useState({});
    const [showLTPDialog, setShowLTPDialog] = useState(false);
    const [plSummary, setPlSummary] = useState({
        realizedPL: 0,
        unrealizedPL: 0,
        hasAllLTP: true
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

    const fetchTrades = useCallback(async (strategyData) => {
        if (!strategyData) return;

        try {
            const stockTradeIds = strategyData.stock_trades || [];
            const optionTradeIds = strategyData.option_trades || [];
            console.log('Fetching trades for strategy:', strategyData.id);
            console.log('Stock trade IDs:', stockTradeIds);
            console.log('Option trade IDs:', optionTradeIds);

            let allTrades = [];
            let totalReturn = 0;

            if (stockTradeIds.length > 0) {
                const stockTrades = await getStockTradesbyId(stockTradeIds);
                const formattedStockTrades = stockTrades.map(trade => ({
                    ...trade,
                    entrydate: moment(trade.entrydate).format("YYYY-MM-DD"),
                    exitdate: trade.exitdate ? moment(trade.exitdate).format("YYYY-MM-DD") : null,
                    lastmodifieddate: trade.lastmodifieddate ? moment(trade.lastmodifieddate).format("YYYY-MM-DD") : null,
                    type: 'stock'
                }));
                setStockTrades(formattedStockTrades);
                allTrades = [...allTrades, ...formattedStockTrades];
                totalReturn += formattedStockTrades.reduce((sum, trade) => sum + (parseFloat(trade.overallreturn) || 0), 0);
            }

            if (optionTradeIds.length > 0) {
                const optionTrades = await getOptionTradesbyId(optionTradeIds);
                const formattedOptionTrades = optionTrades.map(trade => ({
                    ...trade,
                    entrydate: moment(trade.entrydate).format("YYYY-MM-DD"),
                    exitdate: trade.exitdate ? moment(trade.exitdate).format("YYYY-MM-DD") : null,
                    lastmodifieddate: trade.lastmodifieddate ? moment(trade.lastmodifieddate).format("YYYY-MM-DD") : null,
                    type: 'option'
                }));
                setOptionTrades(formattedOptionTrades);
                allTrades = [...allTrades, ...formattedOptionTrades];
                totalReturn += formattedOptionTrades.reduce((sum, trade) => sum + (parseFloat(trade.overallreturn) || 0), 0);
            }

            console.log('All trades:', allTrades);
            setTrades(allTrades);
            setTotalUnrealizedPL(totalReturn);

            // Create option assets array for price updates
            const optionAssetsMap = new Map();
            optionTrades.forEach(trade => {
                if (trade && trade.asset && trade.status !== "CLOSED") {
                    const price = trade.ltp || (strategyData.option_prices || []).find(p => p && p.name === trade.asset)?.price || 0;
                    optionAssetsMap.set(trade.asset, {
                        name: trade.asset,
                        price
                    });
                }
            });
            setOptionAssets(Array.from(optionAssetsMap.values()));
            setOptionPriceErrors(Array(optionAssetsMap.size).fill(false));
        } catch (error) {
            console.error("Error fetching trades:", error);
            setError("Failed to load trades data.");
        }
    }, []);

    const fetchStrategy = useCallback(async () => {
        if (!id) {
            setError("No strategy ID provided");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const strategies = await getStrategies();
            setExistingStrategies(strategies);

            const foundStrategy = strategies.find(s => s.id === parseInt(id));
            if (foundStrategy) {
                console.log('Found strategy:', foundStrategy);
                setStrategy(foundStrategy);
                setCurrentStockPrice(foundStrategy.current_stock_price || "");
                await fetchTrades(foundStrategy);
                await fetchNotes(foundStrategy.id);
            } else {
                setError("Strategy not found");
            }
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load strategy data.");
        } finally {
            setLoading(false);
        }
    }, [id, fetchTrades, fetchNotes]);

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
                await fetchTrades(strategy);
                setShowUpdateTrade(false);
            }
        } catch (error) {
            console.error('Error updating trade:', error);
            setError("Failed to update trade.");
        }
    };

    const handleSubmitTrade = async (tradeDetails, isStock) => {
        try {
            const response = isStock
                ? await addNewStockTrade({ ...tradeDetails, strategy_id: id })
                : await addNewOptionTrade({ ...tradeDetails, strategy_id: id });

            if (response?.tradeid) {
                const updatedStrategy = {
                    ...strategy,
                    [isStock ? 'stock_trades' : 'option_trades']: [
                        ...(strategy[isStock ? 'stock_trades' : 'option_trades'] || []),
                        response.tradeid
                    ]
                };
                await updateStrategy(updatedStrategy);
                setStrategy(updatedStrategy);
                await fetchTrades(updatedStrategy);

                isStock ? setShowCreateStockTrade(false) : setShowCreateOptionTrade(false);
            }
        } catch (error) {
            console.error("Error creating trade:", error);
            setError("Failed to create trade.");
        }
    };

    const handleNameChange = (event) => {
        const newName = event.target.value.trim();
        const nameExists = existingStrategies.some(
            (s) => s.name === newName && s.id !== strategy?.id
        );
        setNameError(nameExists ? "Strategy name is already in use" : "");

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
            await fetchTrades(strategy);
        } catch (error) {
            console.error("Strategy update failed:", error);
            setError("Failed to update strategy.");
        }
    };

    const handleLTPInputChange = (tradeId, value) => {
        setOpenTradesLTP(prev => ({
            ...prev,
            [tradeId]: value
        }));
    };

    const calculateUnrealizedPL = useCallback((trade) => {
        if (!trade || trade.status !== 'OPEN' || !trade.ltp || !trade.openquantity) return 0;

        const quantity = parseInt(trade.openquantity);
        const ltp = parseFloat(trade.ltp);
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
            const updatePromises = [];

            // Update stock trades
            for (const trade of stockTrades) {
                if (trade.status === 'OPEN' && openTradesLTP[trade.tradeid]) {
                    const updatedTrade = {
                        ...trade,
                        ltp: openTradesLTP[trade.tradeid],
                        unrealizedpl: calculateUnrealizedPL(trade)
                    };
                    totalUnrealized += updatedTrade.unrealizedpl;
                    updatePromises.push(updateStockTrade(updatedTrade));
                }
            }

            // Update option trades
            for (const trade of optionTrades) {
                if (trade.status === 'OPEN' && openTradesLTP[trade.tradeid]) {
                    const updatedTrade = {
                        ...trade,
                        ltp: openTradesLTP[trade.tradeid],
                        unrealizedpl: calculateUnrealizedPL(trade)
                    };
                    totalUnrealized += updatedTrade.unrealizedpl;
                    updatePromises.push(updateOptionTrade(updatedTrade));
                }
            }

            await Promise.all(updatePromises);
            setTotalUnrealizedPL(totalUnrealized);
            await fetchTrades(strategy);
            setShowLTPDialog(false);
        } catch (error) {
            console.error('Error updating LTPs:', error);
            setError("Failed to update LTPs.");
        }
    };

    const LTPUpdateDialog = () => {
        const openStockTrades = stockTrades.filter(trade => trade.status === 'OPEN');
        const openOptionTrades = optionTrades.filter(trade => trade.status === 'OPEN');

        const hasOpenTrades = openStockTrades.length > 0 || openOptionTrades.length > 0;

        return (
            <Dialog
                open={showLTPDialog}
                onClose={() => setShowLTPDialog(false)}
                maxWidth="md"
                fullWidth
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

                    {openStockTrades.length > 0 && (
                        <>
                            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                                Stock Trades
                            </Typography>
                            {openStockTrades.map(trade => (
                                <Box key={trade.tradeid} sx={{ mb: 2 }}>
                                    <TextField
                                        label={`${trade.asset} (Entry: ${trade.entryprice})`}
                                        type="number"
                                        value={openTradesLTP[trade.tradeid] || ''}
                                        onChange={(e) => handleLTPInputChange(trade.tradeid, e.target.value)}
                                        fullWidth
                                        size="small"
                                    />
                                </Box>
                            ))}
                        </>
                    )}

                    {openOptionTrades.length > 0 && (
                        <>
                            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                                Option Trades
                            </Typography>
                            {openOptionTrades.map(trade => (
                                <Box key={trade.tradeid} sx={{ mb: 2 }}>
                                    <TextField
                                        label={`${trade.asset} ${trade.strikeprize} (Entry: ${trade.entryprice})`}
                                        type="number"
                                        value={openTradesLTP[trade.tradeid] || ''}
                                        onChange={(e) => handleLTPInputChange(trade.tradeid, e.target.value)}
                                        fullWidth
                                        size="small"
                                    />
                                </Box>
                            ))}
                        </>
                    )}

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button onClick={() => setShowLTPDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleGenerateUnrealizedPL}
                            disabled={!hasOpenTrades}
                        >
                            Generate Unrealized P/L
                        </Button>
                    </Box>
                </Box>
            </Dialog>
        );
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
        fetchStrategy();
    }, [fetchStrategy]);

    useEffect(() => {
        calculatePLSummary();
    }, [calculatePLSummary]);

    const PLSummaryCard = () => {
        const hasOpenTrades = [...stockTrades, ...optionTrades].some(trade => trade.status === 'OPEN');

        return (
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        P/L Summary
                    </Typography>

                    {hasOpenTrades && !plSummary.hasAllLTP ? (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Please update LTP of all open positions to view complete P/L Summary
                        </Alert>
                    ) : (
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
                                    {plSummary.hasAllLTP ? (
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
                                        color: (plSummary.realizedPL + plSummary.unrealizedPL) >= 0
                                            ? 'success.main'
                                            : 'error.main',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {plSummary.hasAllLTP ? (
                                        <>
                                            {(plSummary.realizedPL + plSummary.unrealizedPL) >= 0 ? '+' : ''}
                                            ₹{(plSummary.realizedPL + plSummary.unrealizedPL).toFixed(2)}
                                        </>
                                    ) : (
                                        <>
                                            {plSummary.realizedPL >= 0 ? '+' : ''}
                                            ₹{plSummary.realizedPL.toFixed(2)} + Unrealized
                                        </>
                                    )}
                                </Typography>
                            </Grid>
                        </Grid>
                    )}
                </CardContent>
            </Card>
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
                                            <MenuItem value="CLOSED">CLOSED</MenuItem>
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
        </Box>
    );
}

export default UpdateStrategy;