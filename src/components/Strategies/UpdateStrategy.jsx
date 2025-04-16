import React, { useState, useEffect } from "react";
import {
    Button,
    Container,
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    CircularProgress,
    Dialog,
    DialogActions, DialogContent, DialogContentText, DialogTitle, FormControl, InputLabel, Select, MenuItem, Slider, Chip, Grid
} from "@mui/material";
import SettingsSuggestTwoToneIcon from '@mui/icons-material/SettingsSuggestTwoTone';
import { updateStrategy, getStrategies, deleteStrategy } from '../../services/strategies';
import { getStockTradesbyId, getOptionTradesbyId } from '../../services/trades';
import { StockTradeForm } from "../Trades/StockTradeForm.jsx";
import OptionTradeForm from "../Trades/OptionTradeForm.jsx";
import { addNewStockTrade, updateStockTrade, addNewOptionTrade, updateOptionTrade } from "../../services/trades.js";
// import { culateOptionPrice } from "../../services/optionPriceSimulation.js";
import { useNavigate } from "react-router-dom";
import { getStockLivePrice } from '../../services/nsedata.js';
import StrategyNotes from './StrategyNotes';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';

// Add these constants at the top of the file after imports
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

// Component for confirmation dialog when deleting a strategy   
const ConfirmationDialog = ({ open, onClose, onConfirm, message, title }) => {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {message}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">Cancel</Button>
                <Button onClick={onConfirm} color="error" variant="contained">Delete</Button>
            </DialogActions>
        </Dialog>
    );
};

// Main component for modifying strategy details
const ModifyStrategyDetails = ({ id }) => {
    // State management for strategy and trades
    const [currentStrategy, setCurrentStrategy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [trades, setTrades] = useState([]);
    const [stockTrades, setStockTrades] = useState([]);
    const [optionTrades, setOptionTrades] = useState([]);
    const [optionAssets, setOptionAssets] = useState([]);

    // State for error handling and validation
    const [nameError, setNameError] = useState("");
    const [stockPriceError, setStockPriceError] = useState("");
    const [existingStrategies, setExistingStrategies] = useState([]);
    const [selectedTrades, setSelectedTrades] = useState([]);
    const [updateTradeDetails, setUpdateTradeDetails] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // State for price management and calculations
    const [currentStockPrice, setCurrentStockPrice] = useState("");
    const [totalUnrealizedPL, setTotalUnrealizedPL] = useState(0);
    const [showCreateStockTrade, setShowCreateStockTrade] = useState(false);
    const [showCreateOptionTrade, setShowCreateOptionTrade] = useState(false);
    const [sliderStartValue, setSliderStartValue] = useState(0);
    const [sliderValue, setSliderValue] = useState(0);
    const [optionPriceErrors, setOptionPriceErrors] = useState(Array(optionAssets.length).fill(false));

    // Add error state
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    // Fetch strategy and trade data on component mount
    useEffect(() => {
        const fetchStrategies = async () => {
            setLoading(true);
            try {
                const strategies = await getStrategies();
                console.log('Fetched strategies:', strategies);

                if (!strategies || !Array.isArray(strategies)) {
                    throw new Error("Invalid strategies data received");
                }

                const strategy = strategies.find((s) => s.id === parseInt(id));
                console.log('Found strategy:', strategy);

                if (!strategy) {
                    throw new Error(`Strategy not found with id: ${id}`);
                }

                setCurrentStrategy(strategy);
                await getTrades(strategy);
            } catch (error) {
                console.error("Error in fetchStrategies:", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchStrategies();
    }, [id]);

    // useEffect(() => { getLivePrice(currentStrategy.symbol) }, [currentStrategy.symbol]);

    // Fetch all trades associated with the strategy
    async function getTrades(strategy) {
        if (!strategy) return;

        const stockTrades = await Promise.all(
            (strategy.stock_trades || []).map(getStockTradesbyId)
        );
        const optionTrades = await Promise.all(
            (strategy.option_trades || []).map(getOptionTradesbyId)
        );

        const flatStockTrades = stockTrades.flat();
        const flatOptionTrades = optionTrades.flat();

        // Calculate unrealized P/L for stock trades
        const updatedStockTrades = flatStockTrades.map(trade => {
            // Use LTP if available, otherwise use current stock price
            const currentPrice = trade.ltp || strategy.current_stock_price;
            if (currentPrice) {
                // For LONG trades: (LTP - Entry Price) * Quantity
                // For SHORT trades: (Entry Price - LTP) * Quantity
                const unrealizedPL = trade.tradetype === 'LONG'
                    ? (currentPrice - trade.entryprice) * trade.openquantity
                    : (trade.entryprice - currentPrice) * trade.openquantity;

                // Round to 2 decimal places
                const roundedUnrealizedPL = Math.round(unrealizedPL * 100) / 100;

                return {
                    ...trade,
                    ltp: currentPrice,
                    unrealizedpl: roundedUnrealizedPL
                };
            }
            return {
                ...trade,
                unrealizedpl: 0
            };
        });

        // Calculate unrealized P/L for option trades
        const updatedOptionTrades = flatOptionTrades.map(trade => {
            // Use LTP if available, otherwise try to find price from option assets
            const matchingAsset = (strategy.option_prices || []).find(price => price.name === trade.asset);
            const currentPrice = trade.ltp || (matchingAsset?.price);

            if (currentPrice) {
                // For LONG trades: (LTP - Entry Price) * Quantity
                // For SHORT trades: (Entry Price - LTP) * Quantity
                const unrealizedPL = trade.tradetype === 'LONG'
                    ? (currentPrice - trade.entryprice) * trade.openquantity
                    : (trade.entryprice - currentPrice) * trade.openquantity;

                // Round to 2 decimal places
                const roundedUnrealizedPL = Math.round(unrealizedPL * 100) / 100;

                return {
                    ...trade,
                    ltp: currentPrice,
                    unrealizedpl: roundedUnrealizedPL
                };
            }
            return {
                ...trade,
                unrealizedpl: 0
            };
        });

        setTrades([...updatedStockTrades, ...updatedOptionTrades]);
        setStockTrades(updatedStockTrades);
        setOptionTrades(updatedOptionTrades);

        // Create a new array for option assets, ignoring trades with status "CLOSED"
        const optionAssetsMap = new Map();

        (flatOptionTrades || []).forEach(trade => {
            if (trade && trade.asset && trade.status !== "CLOSED") {
                const price = trade.ltp || (strategy.option_prices || []).find(p => p && p.name === trade.asset)?.price || 0;
                optionAssetsMap.set(trade.asset, {
                    name: trade.asset,
                    price
                });
            }
        });

        const newOptionAssets = Array.from(optionAssetsMap.values());
        setOptionAssets(newOptionAssets);

        // Calculate total unrealized P/L
        const totalStockUnrealizedPL = updatedStockTrades.reduce((sum, trade) => sum + (trade.unrealizedpl || 0), 0);
        const totalOptionUnrealizedPL = updatedOptionTrades.reduce((sum, trade) => sum + (trade.unrealizedpl || 0), 0);
        const totalUnrealizedPL = Math.round((totalStockUnrealizedPL + totalOptionUnrealizedPL) * 100) / 100;
        setTotalUnrealizedPL(totalUnrealizedPL);

        // Initialize option price errors array
        setOptionPriceErrors(Array(newOptionAssets.length).fill(false));
    }

    // Handle trade creation and updates
    async function handleCreateStockTrade() {
        setShowCreateStockTrade(true);
    }

    async function handleCreateOptionTrade() {
        setShowCreateOptionTrade(true);
    }

    // Update strategy details in the backend
    const handleUpdateStrategy = async () => {
        try {
            let response = await updateStrategy(currentStrategy);
            if (response)
                await getTrades(currentStrategy);
        } catch (error) {
            console.error("Strategy update failed:", error);
        }
    };

    // Delete strategy and navigate back to strategies list
    const handleDeleteStrategy = async () => {
        try {
            let response = await deleteStrategy(currentStrategy.id);
            if (response)
                navigate(`/mystrategies`);
        } catch (error) {
            console.error("Strategy deletion failed:", error);
        }
    };

    // Handle strategy name change with validation
    const handleNameChange = (event) => {
        const newName = event.target.value.trim();
        const nameExists = existingStrategies.some(
            (strategy) => strategy.name === newName && strategy.id !== currentStrategy?.id
        );
        setNameError(nameExists ? "Strategy name is already in use. Enter a different name." : "");

        setCurrentStrategy((prev) => ({
            ...prev,
            name: newName,
        }));
    };

    // Handle stock symbol change
    const handleSymbolChange = (event) => {
        const newSymbol = event.target.value.trim();
        setCurrentStrategy((prev) => ({
            ...prev,
            symbol: newSymbol,
        }));
    };

    // Handle strategy status change
    const handleStatusChange = (event) => {
        const newStatus = event.target.value;
        setCurrentStrategy((prev) => ({
            ...prev,
            status: newStatus,
        }));
    };

    // Handle price slider changes for simulation
    const handleSliderChange = (event) => {
        setSliderValue(event.target.value);
        updateStockUnrealizedPL(event.target.value)
        updateStockPrice(event.target.value)
    };

    // Update stock price and reset manual override flag
    const updateStockPrice = (newPrice) => {
        setCurrentStockPrice(newPrice);
        setSliderValue(newPrice)
    };

    // Calculate unrealized P/L for stock trades
    const updateStockUnrealizedPL = (price) => {
        if (price === 0) return;

        console.log('Updating stock unrealized P/L with price:', price);
        console.log('Current stock trades:', stockTrades);

        setStockTrades((prevTrades) => {
            const updatedTrades = prevTrades.map((trade) => {
                // Use LTP if available, otherwise use current price
                const currentPrice = trade.ltp || price;

                // For LONG trades: (LTP - Entry Price) * Quantity
                // For SHORT trades: (Entry Price - LTP) * Quantity
                const unrealizedPL = trade.tradetype === 'LONG'
                    ? (currentPrice - trade.entryprice) * trade.openquantity
                    : (trade.entryprice - currentPrice) * trade.openquantity;

                // Round to 2 decimal places
                const roundedUnrealizedPL = Math.round(unrealizedPL * 100) / 100;

                console.log('Calculating stock trade P/L:', {
                    tradeId: trade.tradeid,
                    tradeType: trade.tradetype,
                    openQuantity: trade.openquantity,
                    entryPrice: trade.entryprice,
                    ltp: currentPrice,
                    unrealizedPL: roundedUnrealizedPL
                });
                return {
                    ...trade,
                    unrealizedpl: roundedUnrealizedPL,
                };
            });
            console.log('Updated stock trades:', updatedTrades);

            // Calculate and update total unrealized P/L
            const totalStockUnrealizedPL = updatedTrades.reduce((sum, trade) => sum + (trade.unrealizedpl || 0), 0);
            const totalOptionUnrealizedPL = optionTrades.reduce((sum, trade) => sum + (trade.unrealizedpl || 0), 0);
            const totalUnrealizedPL = Math.round((totalStockUnrealizedPL + totalOptionUnrealizedPL) * 100) / 100;
            setTotalUnrealizedPL(totalUnrealizedPL);

            return updatedTrades;
        });
    };

    // Calculate unrealized P/L for option trades
    const updateOptionUnrealizedPL = () => {
        if (optionAssets.length === 0) return;

        setOptionTrades((prevTrades) => {
            const assetPriceMap = new Map(optionAssets.map(asset => [asset.name, asset.price]));

            const updatedTrades = prevTrades.map(trade => {
                // Use LTP if available, otherwise use current price from option assets
                const latestPrice = trade.ltp || assetPriceMap.get(trade.asset);

                if (latestPrice !== undefined) {
                    // For LONG trades: (LTP - Entry Price) * Quantity
                    // For SHORT trades: (Entry Price - LTP) * Quantity
                    const unrealizedPL = trade.tradetype === 'LONG'
                        ? (latestPrice - trade.entryprice) * trade.openquantity
                        : (trade.entryprice - latestPrice) * trade.openquantity;

                    // Round to 2 decimal places
                    const roundedUnrealizedPL = Math.round(unrealizedPL * 100) / 100;

                    return {
                        ...trade,
                        unrealizedpl: roundedUnrealizedPL,
                    };
                }
                return {
                    ...trade,
                    unrealizedpl: 0
                };
            });

            // Calculate and update total unrealized P/L
            const totalStockUnrealizedPL = stockTrades.reduce((sum, trade) => sum + (trade.unrealizedpl || 0), 0);
            const totalOptionUnrealizedPL = updatedTrades.reduce((sum, trade) => sum + (trade.unrealizedpl || 0), 0);
            const totalUnrealizedPL = Math.round((totalStockUnrealizedPL + totalOptionUnrealizedPL) * 100) / 100;
            setTotalUnrealizedPL(totalUnrealizedPL);

            return updatedTrades;
        });
    };

    // Generate overall unrealized P/L for all trades
    const generateOverAllUnrealizedPL = async () => {
        console.log('Generating overall unrealized P/L');
        console.log('Current stock price:', currentStockPrice);
        updateStockUnrealizedPL(currentStockPrice);
        updateOptionUnrealizedPL();
    };

    // Handle P/L generation with validation and updates
    const handleGeneratePL = async () => {
        if (!currentStrategy) return;

        let hasError = false;

        // Validate stock price
        if (!currentStockPrice) {
            setStockPriceError("Stock price is required");
            hasError = true;
        } else {
            setStockPriceError("");
        }

        // Validate option prices and update LTP values
        const updatedErrors = (optionAssets || []).map((option, index) => {
            if (!option || !option.name) return false;
            const matchingTrade = (optionTrades || []).find(trade => trade && trade.asset === option.name);
            if (!option.price && !matchingTrade?.ltp) {
                hasError = true;
                return true;
            }
            return false;
        });

        setOptionPriceErrors(updatedErrors);

        if (hasError) return;

        try {
            // Update option trades with new LTP values and save to backend
            const updatedOptionTrades = await Promise.all(optionTrades.map(async (trade) => {
                const matchingAsset = optionAssets.find(asset => asset.name === trade.asset);
                if (matchingAsset && matchingAsset.price) {
                    const updatedTrade = {
                        ...trade,
                        ltp: matchingAsset.price
                    };
                    // Update trade in backend
                    await updateOptionTrade(updatedTrade);
                    return updatedTrade;
                }
                return trade;
            }));

            // Update stock trades with new LTP values and save to backend
            const updatedStockTrades = await Promise.all(stockTrades.map(async (trade) => {
                const updatedTrade = {
                    ...trade,
                    ltp: currentStockPrice
                };
                // Update trade in backend
                await updateStockTrade(updatedTrade);
                return updatedTrade;
            }));

            // Update local state with updated trades
            setOptionTrades(updatedOptionTrades);
            setStockTrades(updatedStockTrades);

            // Update strategy with current prices
            const updatedStrategy = {
                ...currentStrategy,
                current_stock_price: currentStockPrice,
                option_prices: (optionAssets || []).map(asset => ({
                    name: asset.name,
                    price: asset.price
                }))
            };

            // Update strategy in backend
            await updateStrategy(updatedStrategy);
            setCurrentStrategy(updatedStrategy);

            // Recalculate P/L with new prices
            await generateOverAllUnrealizedPL();

            setSliderStartValue(currentStockPrice);
        } catch (error) {
            console.error("Error updating trades and strategy:", error);
        }
    };

    // Handle stock price change
    const handleStockPriceChange = (value) => {
        if (value === "") {
            setCurrentStockPrice("");
        } else {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
                setCurrentStockPrice(numValue);
            }
        }
    };

    // Handle option price change
    const handleOptionPriceChange = (index, value) => {
        setOptionAssets(prevAssets => {
            const newAssets = [...prevAssets];
            if (newAssets[index]) {
                newAssets[index] = {
                    ...newAssets[index],
                    price: value === "" ? undefined : parseFloat(value)
                };
            }
            return newAssets;
        });

        // Update LTP in option trades immediately
        setOptionTrades(prevTrades => {
            return prevTrades.map(trade => {
                if (trade.asset === optionAssets[index]?.name) {
                    return {
                        ...trade,
                        ltp: value === "" ? undefined : parseFloat(value)
                    };
                }
                return trade;
            });
        });
    };

    // Calculate total realized P/L
    const totalPL = (stockTrades.reduce((sum, trade) => sum + (trade.overallreturn || 0), 0) +
        optionTrades.reduce((sum, trade) => sum + (trade.overallreturn || 0), 0));

    // Handle trade selection for update
    const handleTradeSelection = (trade) => {
        setSelectedTrades((prev) =>
            prev.some((t) => t.tradeid === trade.tradeid)
                ? prev.filter((t) => t.tradeid !== trade.tradeid)
                : [...prev, trade]
        );
        setUpdateTradeDetails(trade);
    };

    // Handle trade submission (create/update)
    const handleSubmitTrade = async (tradeDetails, isStock, isUpdate = false) => {
        try {
            let response;
            if (isStock) {
                response = isUpdate ? await updateStockTrade({ ...tradeDetails, strategy_id: id }) : await addNewStockTrade({ ...tradeDetails, strategy_id: id });
            } else {
                response = isUpdate ? await updateOptionTrade({ ...tradeDetails, strategy_id: id }) : await addNewOptionTrade({ ...tradeDetails, strategy_id: id });
            }

            if (response?.created) {
                if (!isUpdate) {
                    // Only add new trades to strategy, not updates
                    await addTradeToStrategy(response.tradeid, isStock);
                }

                // Update the UI state with the new/updated trade
                const updatedTrade = {
                    ...tradeDetails,
                    tradeid: response.tradeid
                };

                if (isStock) {
                    if (isUpdate) {
                        setStockTrades(prev => prev.map(trade =>
                            trade.tradeid === updatedTrade.tradeid ? updatedTrade : trade
                        ));
                    } else {
                        setStockTrades(prev => [...prev, updatedTrade]);
                        setShowCreateStockTrade(false);
                    }
                } else {
                    if (isUpdate) {
                        setOptionTrades(prev => prev.map(trade =>
                            trade.tradeid === updatedTrade.tradeid ? updatedTrade : trade
                        ));
                    } else {
                        setOptionTrades(prev => [...prev, updatedTrade]);
                        setShowCreateOptionTrade(false);
                    }
                }

                // Refresh trades to show the updated data
                await getTrades(currentStrategy);

                // Close the update dialog if this was an update
                if (isUpdate) {
                    setUpdateTradeDetails(null);
                }
            }
        } catch (error) {
            console.error("Error submitting trade:", error);
            // Handle error appropriately
        }
    };

    // Add trade to strategy
    const addTradeToStrategy = async (tradeId, isStock = true) => {
        if (isStock)
            currentStrategy.stock_trades = [...currentStrategy.stock_trades, tradeId]
        else
            currentStrategy.option_trades = [...currentStrategy.option_trades, tradeId]
        await handleUpdateStrategy()
    }

    // Placeholder for strategy prediction simulator
    async function runStrategyPredictionSimulator() { }

    // Add this helper function after the TABLE_STYLES constant
    const getRowStyle = (isSelected, index) => ({
        ...TABLE_STYLES.row,
        ...(isSelected ? TABLE_STYLES.selectedRow : {}),
        ...(index % 2 === 0 ? TABLE_STYLES.evenRow : TABLE_STYLES.oddRow)
    });

    // Main render function
    return (
        <>
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                    <CircularProgress size={24} />
                </Box>
            ) : error ? (
                <Typography variant="h6" color="error" sx={{ p: 3 }}>
                    {error}
                </Typography>
            ) : !currentStrategy ? (
                <Typography variant="h6" color="error" sx={{ p: 3 }}>
                    Strategy not found
                </Typography>
            ) : (
                <Box sx={{ width: '100%', p: 3 }}>
                    {/* Strategy header and actions */}
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 4,
                        flexWrap: 'wrap',
                        gap: 2
                    }}>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                            {currentStrategy?.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleCreateStockTrade}
                                startIcon={<AddIcon />}
                            >
                                Add Stock Trade
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleCreateOptionTrade}
                                startIcon={<AddIcon />}
                            >
                                Add Option Trade
                            </Button>
                            <Button
                                variant="contained"
                                color="success"
                                onClick={runStrategyPredictionSimulator}
                                startIcon={<SettingsSuggestTwoToneIcon />}
                            >
                                Run Simulation
                            </Button>
                            <Button
                                variant="contained"
                                color="secondary"
                                onClick={handleUpdateStrategy}
                                startIcon={<SaveIcon />}
                            >
                                Update Strategy
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                onClick={() => setDeleteDialogOpen(true)}
                                startIcon={<DeleteIcon />}
                            >
                                Delete Strategy
                            </Button>
                        </Box>
                    </Box>

                    {/* Strategy details form */}
                    <Paper sx={{ p: 3, mb: 4 }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    label="Name"
                                    value={currentStrategy?.name || ""}
                                    fullWidth
                                    onChange={handleNameChange}
                                    error={!!nameError}
                                    helperText={nameError}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    label="Stock Symbol"
                                    value={currentStrategy?.symbol || ""}
                                    fullWidth
                                    onChange={handleSymbolChange}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth>
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        value={currentStrategy?.status}
                                        onChange={handleStatusChange}
                                        label="Status"
                                    >
                                        <MenuItem value="OPEN">OPEN</MenuItem>
                                        <MenuItem value="CLOSE">CLOSE</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Price update section */}
                    <Paper sx={{ p: 3, mb: 4 }}>
                        <Typography variant="h6" gutterBottom>
                            Update Stock and Option Prices
                        </Typography>
                        <Grid container spacing={3} alignItems="center">
                            <Grid item xs={12} md={4}>
                                <TextField
                                    label="Current Stock Price"
                                    value={currentStockPrice === undefined || currentStockPrice === 0 ? "" : currentStockPrice}
                                    onChange={(e) => handleStockPriceChange(e.target.value)}
                                    error={!!stockPriceError}
                                    helperText={stockPriceError}
                                    fullWidth
                                />
                            </Grid>
                            {optionAssets.map((option, index) => (
                                <Grid item xs={12} md={4} key={index}>
                                    <TextField
                                        label={`Price for ${option.name}`}
                                        type="number"
                                        value={option.price === undefined || option.price === 0 ? "" : option.price}
                                        onChange={(e) => handleOptionPriceChange(index, e.target.value)}
                                        error={optionPriceErrors[index]}
                                        helperText={optionPriceErrors[index] ? "Option price is required" : ""}
                                        fullWidth
                                    />
                                </Grid>
                            ))}
                            <Grid item xs={12}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleGeneratePL}
                                    fullWidth
                                    size="large"
                                >
                                    Generate Unrealized P/L
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* P/L summary cards */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 3, textAlign: 'center' }}>
                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                    Total Realized P/L
                                </Typography>
                                <Typography variant="h4" color={totalPL >= 0 ? 'success.main' : 'error.main'}>
                                    {totalPL >= 0 ? '+' : ''}{totalPL}
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 3, textAlign: 'center' }}>
                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                    Total Unrealized P/L
                                </Typography>
                                <Typography variant="h4" color={totalUnrealizedPL >= 0 ? 'success.main' : 'error.main'}>
                                    {totalUnrealizedPL >= 0 ? '+' : ''}{totalUnrealizedPL}
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 3, textAlign: 'center' }}>
                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                    Final P/L
                                </Typography>
                                <Typography variant="h4" color={(totalUnrealizedPL + totalPL) >= 0 ? 'success.main' : 'error.main'}>
                                    {(totalUnrealizedPL + totalPL) >= 0 ? '+' : ''}{totalUnrealizedPL + totalPL}
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* Stock and Option trades tables */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {stockTrades.length > 0 && (
                            <TableContainer component={Paper} sx={TABLE_STYLES.container}>
                                <Typography variant="h6" gutterBottom sx={{ mb: 1, textAlign: "center", color: "primary.main" }}>
                                    Stock Trades
                                </Typography>
                                <Table>
                                    <TableHead sx={TABLE_STYLES.header}>
                                        <TableRow>
                                            <TableCell><b>Status</b></TableCell>
                                            <TableCell><b>Asset</b></TableCell>
                                            <TableCell><b>Total Quantity</b></TableCell>
                                            <TableCell><b>Open Quantity</b></TableCell>
                                            <TableCell><b>Trade Type</b></TableCell>
                                            <TableCell><b>Entry Price</b></TableCell>
                                            <TableCell><b>Average Exit Price</b></TableCell>
                                            <TableCell><b>LTP</b></TableCell>
                                            <TableCell><b>Current P/L</b></TableCell>
                                            <TableCell><b>Unrealized P/L</b></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {[...stockTrades]
                                            .sort((a, b) => {
                                                if (a.status === 'OPEN' && b.status !== 'OPEN') return -1;
                                                if (a.status !== 'OPEN' && b.status === 'OPEN') return 1;
                                                return 0;
                                            })
                                            .map((trade, index) => (
                                                <TableRow
                                                    key={index}
                                                    hover
                                                    onClick={() => handleTradeSelection(trade)}
                                                    sx={getRowStyle(selectedTrades.some((t) => t.tradeid === trade.tradeid), index)}
                                                >
                                                    <TableCell>
                                                        <Chip
                                                            label={trade.status || 'OPEN'}
                                                            color={trade.status === 'OPEN' ? 'success' : 'error'}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell>{trade.asset}</TableCell>
                                                    <TableCell>{trade.quantity}</TableCell>
                                                    <TableCell>{trade.openquantity}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={trade.tradetype}
                                                            color={trade.tradetype === 'LONG' ? 'success' : 'error'}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell>{trade.entryprice}</TableCell>
                                                    <TableCell>{trade.exitaverageprice}</TableCell>
                                                    <TableCell>{trade.ltp}</TableCell>
                                                    <TableCell>{trade.overallreturn}</TableCell>
                                                    <TableCell>{trade.unrealizedpl}</TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}

                        {optionTrades.length > 0 && (
                            <TableContainer component={Paper} sx={TABLE_STYLES.container}>
                                <Typography variant="h6" gutterBottom sx={{ mb: 1, textAlign: "center", color: "primary.main" }}>
                                    Option Trades
                                </Typography>
                                <Table>
                                    <TableHead sx={TABLE_STYLES.header}>
                                        <TableRow>
                                            <TableCell><b>Status</b></TableCell>
                                            <TableCell><b>Asset</b></TableCell>
                                            <TableCell><b>Strike Prize</b></TableCell>
                                            <TableCell><b>Lot Size</b></TableCell>
                                            <TableCell><b>Total Quantity</b></TableCell>
                                            <TableCell><b>Open Quantity</b></TableCell>
                                            <TableCell><b>Trade Type</b></TableCell>
                                            <TableCell><b>Entry Price</b></TableCell>
                                            <TableCell><b>Average Exit Price</b></TableCell>
                                            <TableCell><b>LTP</b></TableCell>
                                            <TableCell><b>Current P/L</b></TableCell>
                                            <TableCell><b>Unrealized P/L</b></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {[...optionTrades]
                                            .sort((a, b) => {
                                                if (a.status === 'OPEN' && b.status !== 'OPEN') return -1;
                                                if (a.status !== 'OPEN' && b.status === 'OPEN') return 1;
                                                return 0;
                                            })
                                            .map((trade, index) => (
                                                <TableRow
                                                    key={index}
                                                    hover
                                                    onClick={() => handleTradeSelection(trade)}
                                                    sx={getRowStyle(selectedTrades.some((t) => t.tradeid === trade.tradeid), index)}
                                                >
                                                    <TableCell>
                                                        <Chip
                                                            label={trade.status || 'OPEN'}
                                                            color={trade.status === 'OPEN' ? 'success' : 'error'}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell>{trade.asset}</TableCell>
                                                    <TableCell>{trade.strikeprize}</TableCell>
                                                    <TableCell>{trade.lotsize}</TableCell>
                                                    <TableCell>{trade.quantity / trade.lotsize}</TableCell>
                                                    <TableCell>{trade.openquantity / trade.lotsize}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={trade.tradetype}
                                                            color={trade.tradetype === 'LONG' ? 'success' : 'error'}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell>{trade.entryprice}</TableCell>
                                                    <TableCell>{trade.exitaverageprice}</TableCell>
                                                    <TableCell>{trade.ltp}</TableCell>
                                                    <TableCell>{trade.overallreturn}</TableCell>
                                                    <TableCell>{trade.unrealizedpl}</TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Box>

                    <StrategyNotes strategyId={id} />
                </Box>
            )}

            {/* Trade update dialogs */}
            <Dialog
                open={!!updateTradeDetails}
                onClose={() => setUpdateTradeDetails(null)}
                maxWidth="md"
                fullWidth
            >
                {updateTradeDetails?.lotsize === undefined ? (
                    <StockTradeForm
                        title="Update Stock Trade"
                        onSubmit={(details) => handleSubmitTrade(details, true, true)}
                        onCancel={() => setUpdateTradeDetails(null)}
                        onDelete={() => getTrades(currentStrategy)}
                        isUpdate={true}
                        currentTrade={updateTradeDetails}
                        strategyid={id}
                    />
                ) : (
                    <OptionTradeForm
                        title="Update Option Trade"
                        onSubmit={(details) => handleSubmitTrade(details, false, true)}
                        onCancel={() => setUpdateTradeDetails(null)}
                        onDelete={() => getTrades(currentStrategy)}
                        isUpdate={true}
                        currentTrade={updateTradeDetails}
                        strategyid={id}
                    />
                )}
            </Dialog>

            <Dialog
                open={showCreateStockTrade}
                onClose={() => setShowCreateStockTrade(false)}
                maxWidth="md"
                fullWidth
            >
                <StockTradeForm
                    title='Create Stock Trade'
                    onSubmit={(details) => handleSubmitTrade(details, true)}
                    onCancel={() => setShowCreateStockTrade(false)}
                />
            </Dialog>

            <Dialog
                open={showCreateOptionTrade}
                onClose={() => setShowCreateOptionTrade(false)}
                maxWidth="md"
                fullWidth
            >
                <OptionTradeForm
                    title='Create Option Trade'
                    onSubmit={(details) => handleSubmitTrade(details, false)}
                    onCancel={() => setShowCreateOptionTrade(false)}
                />
            </Dialog>

            <ConfirmationDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDeleteStrategy}
                message={"Are you sure you want to delete this strategy? This action cannot be undone."}
                title={"Delete Confirmation"}
            />
        </>
    );
};

export { ModifyStrategyDetails };