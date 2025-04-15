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
    DialogActions, DialogContent, DialogContentText, DialogTitle, FormControl, InputLabel, Select, MenuItem, Slider
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
    const [showTradeFailedAlertPopup, setShowTradeFailedAlertPopup] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // State for price management and calculations
    const [currentStockPrice, setCurrentStockPrice] = useState("");
    const [isStockPriceUpdateDisabled, setIsStockPriceUpdateDisabled] = useState(false);
    const [totalUnrealizedPL, setTotalUnrealizedPL] = useState(0);
    const [showCreateStockTrade, setShowCreateStockTrade] = useState(false);
    const [showCreateOptionTrade, setShowCreateOptionTrade] = useState(false);
    const [sliderStartValue, setSliderStartValue] = useState(0);
    const [sliderValue, setSliderValue] = useState(0);
    const [isManualPriceUpdate, setIsManualPriceUpdate] = useState(false);
    const [optionPriceErrors, setOptionPriceErrors] = useState(Array(optionAssets.length).fill(false));

    const navigate = useNavigate();

    // Fetch strategy and trade data on component mount
    useEffect(() => {
        const fetchStrategies = async () => {
            setLoading(true);
            try {
                const strategies = await getStrategies();
                setExistingStrategies(strategies);

                const strategy = strategies.find((s) => s.id == id);
                if (strategy) {
                    setCurrentStrategy(strategy);
                    await getTrades(strategy);
                }
                // await getLivePrice(strategy.symbol)
            } catch (error) {
                console.error("Error fetching strategies:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStrategies();
    }, []);

    // useEffect(() => { getLivePrice(currentStrategy.symbol) }, [currentStrategy.symbol]);

    // Fetch live stock price for the strategy's symbol
    async function getLivePrice(symbol) {
        const liveData = await getStockLivePrice(symbol)
        if (liveData.priceInfo.lastPrice !== undefined && liveData.priceInfo.lastPrice !== 0) {
            setCurrentStockPrice(liveData.priceInfo.lastPrice)
            setIsStockPriceUpdateDisabled(true)
            updateStockUnrealizedPL(liveData.priceInfo.lastPrice)
        }
    }

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
            if (strategy.current_stock_price) {
                const unrealizedPL = (trade.openquantity * strategy.current_stock_price) - (trade.openquantity * trade.entryprice);
                return {
                    ...trade,
                    ltp: strategy.current_stock_price,
                    unrealizedpl: unrealizedPL
                };
            }
            return trade;
        });

        // Calculate unrealized P/L for option trades
        const updatedOptionTrades = flatOptionTrades.map(trade => {
            const matchingAsset = (strategy.option_prices || []).find(price => price.name === trade.asset);
            if (matchingAsset?.price) {
                const unrealizedPL = (trade.openquantity * matchingAsset.price) - (trade.openquantity * trade.entryprice);
                return {
                    ...trade,
                    ltp: matchingAsset.price,
                    unrealizedpl: unrealizedPL
                };
            }
            return trade;
        });

        setTrades([...updatedStockTrades, ...updatedOptionTrades]);
        setStockTrades(updatedStockTrades);
        setOptionTrades(updatedOptionTrades);

        // Create a new array for option assets, ignoring trades with status "CLOSED"
        console.log('Flat Option Trades:', flatOptionTrades);
        console.log('Strategy Option Prices:', strategy.option_prices);

        const optionAssetsMap = new Map();

        (flatOptionTrades || []).forEach(trade => {
            console.log('Processing trade:', trade);
            if (trade && trade.asset && trade.status !== "CLOSED") {
                const price = (strategy.option_prices || []).find(p => p && p.name === trade.asset)?.price || 0;
                console.log('Found price for trade:', { asset: trade.asset, price });
                optionAssetsMap.set(trade.asset, {
                    name: trade.asset,
                    price
                });
            }
        });

        const newOptionAssets = Array.from(optionAssetsMap.values());
        console.log('New Option Assets:', newOptionAssets);
        setOptionAssets(newOptionAssets);

        // Calculate total unrealized P/L
        const totalStockUnrealizedPL = updatedStockTrades.reduce((sum, trade) => sum + (trade.unrealizedpl || 0), 0);
        const totalOptionUnrealizedPL = updatedOptionTrades.reduce((sum, trade) => sum + (trade.unrealizedpl || 0), 0);
        setTotalUnrealizedPL(totalStockUnrealizedPL + totalOptionUnrealizedPL);

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
    async function handleUpdateStrategy() {
        try {
            let response = await updateStrategy(currentStrategy);
            if (response)
                await getTrades(currentStrategy);
        } catch (error) {
            console.error("Strategy update failed:", error);
            setShowTradeFailedAlertPopup(true);
        }
    }

    // Delete strategy and navigate back to strategies list
    async function handleDeleteStrategy() {
        try {
            let response = await deleteStrategy(currentStrategy.id);
            if (response)
                navigate(`/mystrategies`);
        } catch (error) {
            console.error("Strategy deletion failed:", error);
            setShowTradeFailedAlertPopup(true);
        }
    }

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
        setIsManualPriceUpdate(true);
        updateStockUnrealizedPL(event.target.value)
        updateStockPrice(event.target.value)
    };

    // Update stock price and reset manual override flag
    const updateStockPrice = (newPrice) => {
        setCurrentStockPrice(newPrice);
        setSliderValue(newPrice)
        setIsManualPriceUpdate(false);
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

        console.log('Updating option unrealized P/L');
        console.log('Current option trades:', optionTrades);
        console.log('Current option assets:', optionAssets);

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

                    console.log('Calculating option trade P/L:', {
                        tradeId: trade.tradeid,
                        tradeType: trade.tradetype,
                        asset: trade.asset,
                        openQuantity: trade.openquantity,
                        entryPrice: trade.entryprice,
                        ltp: latestPrice,
                        unrealizedPL: roundedUnrealizedPL
                    });
                    return {
                        ...trade,
                        unrealizedpl: roundedUnrealizedPL,
                    };
                }
                return trade;
            });
            console.log('Updated option trades:', updatedTrades);

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
            setShowTradeFailedAlertPopup(true);
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
        const tradeFunction = isStock
            ? isUpdate ? updateStockTrade : addNewStockTrade
            : isUpdate ? updateOptionTrade : addNewOptionTrade;

        try {
            const response = await tradeFunction(tradeDetails);
            if (response?.created) {
                if (isUpdate) {
                    await getTrades(currentStrategy);
                } else {
                    await addTradeToStrategy(response.data.tradeid, isStock);
                }
                setUpdateTradeDetails(null);
                setShowCreateStockTrade(false);
                setShowCreateOptionTrade(false);
            } else {
                setShowTradeFailedAlertPopup(true);
            }
        } catch (error) {
            console.error("Trade submission failed:", error);
            setShowTradeFailedAlertPopup(true);
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

    // Main render function
    return (
        <>
            {loading ? (
                <CircularProgress size={24} />
            ) : !currentStrategy ? (
                <Typography variant="h6" color="error">
                    Strategy not found
                </Typography>
            ) : (
                <Container sx={{ mt: 4 }}>
                    {/* Strategy header and actions */}
                    <Typography variant="h4" gutterBottom sx={{ mb: 2 }}>
                        {currentStrategy?.name}
                    </Typography>

                    <Box display="flex" justifyContent="space-between" sx={{ mb: 5 }}>
                        <Button variant="contained" color="primary" onClick={handleCreateStockTrade}>Add Stock Trade</Button>
                        <Button variant="contained" color="primary" onClick={handleCreateOptionTrade}>Add Option Trade</Button>
                        <Button variant="contained" color="success" onClick={runStrategyPredictionSimulator} startIcon={<SettingsSuggestTwoToneIcon />}>Run Simulation</Button>
                        <Button variant="contained" color="secondary" onClick={handleUpdateStrategy}>Update Strategy Details</Button>
                        <Button variant="contained" color="error" onClick={() => setDeleteDialogOpen(true)}>Delete Strategy</Button>
                    </Box>

                    {/* Strategy details form */}
                    <TextField
                        label="Name"
                        value={currentStrategy?.name || ""}
                        fullWidth
                        onChange={handleNameChange}
                        sx={{ mb: 2 }}
                        error={!!nameError}
                        helperText={nameError}
                    />

                    <TextField
                        label="Stock Symbol Used for this Strategy"
                        value={currentStrategy?.symbol || ""}
                        fullWidth
                        onChange={handleSymbolChange}
                        sx={{ mb: 2 }}
                        error={!!nameError}
                        helperText={nameError}
                    />

                    <FormControl fullWidth sx={{ mb: 2 }}>
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

                    {/* Price update section */}
                    <Box sx={{ mb: 3, p: 1, border: "1px solid #ddd", borderRadius: "8px", background: "#f9f9f9", display: "flex", flexWrap: "wrap", alignItems: "center" }}>
                        <Typography variant="body2" gutterBottom sx={{ width: "100%", color: "black" }}> Update Stock and Option Prices to Calculate Unrealized P/L</Typography>
                        <TextField
                            label="Current Stock Price"
                            value={currentStockPrice === undefined || currentStockPrice === 0 ? "" : currentStockPrice}
                            onChange={(e) => handleStockPriceChange(e.target.value)}
                            error={!!stockPriceError}
                            helperText={stockPriceError}
                            sx={{ m: 1, width: "calc(33.33% - 16px)" }}
                        />
                        {optionAssets.length > 0 && optionAssets.map((option, index) => {
                            const matchingTrade = optionTrades.find(trade => trade.asset === option.name);
                            const displayValue = matchingTrade?.ltp ? matchingTrade.ltp : (option.price === undefined || option.price === 0 ? "" : option.price);
                            return (
                                <TextField
                                    key={index}
                                    label={`Price for ${option.name}`}
                                    type="number"
                                    value={displayValue}
                                    onChange={(e) => handleOptionPriceChange(index, e.target.value)}
                                    inputMode="decimal"
                                    error={optionPriceErrors[index]}
                                    helperText={optionPriceErrors[index] ? "Option price is required" : ""}
                                    sx={{ m: 1, width: "calc(33.33% - 16px)" }}
                                />
                            );
                        })}
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleGeneratePL}
                            sx={{ m: 1, width: "100%" }}
                        >
                            Generate Unrealized P/L
                        </Button>
                    </Box>

                    {/* Price simulation slider */}
                    {sliderStartValue > 0 &&
                        <Box sx={{ mb: 3, p: 2, borderRadius: "8px", border: "1px solid #ddd", }}>
                            <Typography variant="body2" sx={{ mb: 1, color: "black" }}>
                                Move the slider to update the stock price. Adjusted Value: {sliderValue}
                            </Typography>
                            <Slider
                                value={Number(sliderValue)}
                                onChange={handleSliderChange}
                                min={Math.round(sliderStartValue * 0.9)}
                                max={Math.round(sliderStartValue * 1.1)}
                                step={1}
                                marks={[
                                    { value: Math.round(sliderStartValue * 0.9), label: `${Math.round(sliderStartValue * 0.9)}` },
                                    { value: sliderStartValue, label: `${sliderStartValue}` },
                                    { value: Math.round(sliderStartValue * 1.1), label: `${Math.round(sliderStartValue * 1.1)}` },
                                ]}
                                valueLabelDisplay="auto"
                            />
                        </Box>
                    }

                    {/* P/L summary */}
                    <TextField
                        label="Total Realized P/L"
                        value={totalPL}
                        fullWidth
                        readOnly
                        sx={{ mb: 3 }}
                    />

                    <TextField
                        label="Total Unrealized P/L"
                        value={totalUnrealizedPL}
                        fullWidth
                        readOnly
                        sx={{ mb: 3 }}
                    />

                    <TextField
                        label="Final P/L"
                        value={totalUnrealizedPL + totalPL}
                        fullWidth
                        readOnly
                        sx={{ mb: 3 }}
                    />

                    {/* Stock trades table */}
                    {stockTrades.length > 0 &&
                        <TableContainer component={Paper} sx={{ mb: 4 }}>
                            <Typography variant="h6" gutterBottom sx={{ mb: 1, textAlign: "center", color: "blue", backgroundColor: "#f5f5f5" }}>
                                Stock Trades
                            </Typography>
                            <Table>
                                <TableHead>
                                    <TableRow>
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
                                    {stockTrades.map((trade, index) => (
                                        <TableRow
                                            key={index}
                                            hover
                                            onClick={() => handleTradeSelection(trade)}
                                            sx={{
                                                backgroundColor: selectedTrades.some((t) => t.tradeid === trade.tradeid)
                                                    ? "#b3e5fc"
                                                    : index % 2 === 0 ? "#f5f5f5" : "#e0e0e0",
                                                cursor: "pointer",
                                                "&:hover": { backgroundColor: "lightgreen !important" }
                                            }}
                                        >
                                            <TableCell>{trade.asset}</TableCell>
                                            <TableCell>{trade.quantity}</TableCell>
                                            <TableCell>{trade.openquantity}</TableCell>
                                            <TableCell>{trade.tradetype}</TableCell>
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
                    }

                    {/* Option trades table */}
                    {optionTrades.length > 0 &&
                        <TableContainer component={Paper} >
                            <Typography variant="h6" gutterBottom sx={{ mb: 1, textAlign: "center", color: "blue", background: "#f5f5f5" }}>
                                Option Trades
                            </Typography>
                            <Table>
                                <TableHead>
                                    <TableRow>
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
                                        <TableCell><b>Status</b></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {optionTrades.map((trade, index) => (
                                        <TableRow
                                            key={index}
                                            hover
                                            onClick={() => handleTradeSelection(trade)}
                                            sx={{
                                                backgroundColor: selectedTrades.some((t) => t.tradeid === trade.tradeid)
                                                    ? "#b3e5fc"
                                                    : index % 2 === 0 ? "#f5f5f5" : "#e0e0e0",
                                                cursor: "pointer",
                                                "&:hover": { backgroundColor: "lightgreen !important" }
                                            }}
                                        >
                                            <TableCell>{trade.asset}</TableCell>
                                            <TableCell>{trade.strikeprize}</TableCell>
                                            <TableCell>{trade.lotsize}</TableCell>
                                            <TableCell>{trade.quantity / trade.lotsize}</TableCell>
                                            <TableCell>{trade.openquantity / trade.lotsize}</TableCell>
                                            <TableCell>{trade.tradetype}</TableCell>
                                            <TableCell>{trade.entryprice}</TableCell>
                                            <TableCell>{trade.exitaverageprice}</TableCell>
                                            <TableCell>{trade.ltp}</TableCell>
                                            <TableCell>{trade.overallreturn}</TableCell>
                                            <TableCell>{trade.unrealizedpl}</TableCell>
                                            <TableCell>{trade.status}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    }

                    <StrategyNotes strategyId={id} />
                </Container >
            )}

            {/* Trade update dialogs */}
            <Dialog open={!!updateTradeDetails} onClose={() => setUpdateTradeDetails(null)}>
                {updateTradeDetails?.lotsize === undefined ? (
                    <StockTradeForm title="Update Stock Trade" onSubmit={(details) => handleSubmitTrade(details, true, true)} onCancel={() => setUpdateTradeDetails(null)} onDelete={() => getTrades(currentStrategy)} isUpdate currentTrade={updateTradeDetails} strategyid={id} />
                ) : (
                    <OptionTradeForm title="Update Option Trade" onSubmit={(details) => handleSubmitTrade(details, false, true)} onCancel={() => setUpdateTradeDetails(null)} onDelete={() => getTrades(currentStrategy)} isUpdate currentTrade={updateTradeDetails} strategyid={id} />
                )}
            </Dialog>
            <Dialog open={showCreateStockTrade} onClose={() => setShowCreateStockTrade(false)}>
                <StockTradeForm title='Create Stock Trade' onSubmit={(details) => handleSubmitTrade(details, true, false)} onCancel={() => setShowCreateStockTrade(false)} />
            </Dialog>

            <Dialog open={showCreateOptionTrade} onClose={() => setShowCreateOptionTrade(false)}>
                <OptionTradeForm title='Create Option Trade' onSubmit={(details) => handleSubmitTrade(details, false, false)} onCancel={() => setShowCreateOptionTrade(false)} />
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