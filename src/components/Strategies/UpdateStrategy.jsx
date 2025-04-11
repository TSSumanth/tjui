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

const ModifyStrategyDetails = ({ id }) => {
    const [currentStrategy, setCurrentStrategy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [trades, setTrades] = useState([]);
    const [stocktrades, setStockTrades] = useState([]);
    const [optiontrades, setOptionTrades] = useState([]);
    const [optionAssets, setOptionAssets] = useState([]);
    const [nameError, setNameError] = useState("");
    const [stockpriceError, setStockPriceError] = useState("");
    const [existingStrategies, setExistingStrategies] = useState([]);
    const [selectedTrades, setSelectedTrades] = useState([]);
    const [updateTradeDetails, setUpdateTradeDetails] = useState(null);
    const [showTradeFailedAlertPopup, setShowTradeFailedAlertPopup] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [lateststockprice, updatestockprize] = useState("");
    const [disableStockPriceUpdate, changeDisableStockPriceUpdate] = useState(false);
    const [totalunrealizedpl, updatetotalunrealizedpl] = useState(0);
    const [CreateStockTrade, setCreateStockTrade] = useState(false);
    const [CreateOptionTrade, setCreateOptionTrade] = useState(false);
    const [sliderStartValue, setSliderStartValue] = useState(0);
    const [sliderValue, setSliderValue] = useState(0); // Slider starts at 0%
    const [isManual, setIsManual] = useState(false);
    const [optionErrors, setOptionErrors] = useState(Array(optionAssets.length).fill(false)); // Error states for options

    const navigate = useNavigate();

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


    async function getLivePrice(symbol) {
        const livedata = await getStockLivePrice(symbol)
        if (livedata.priceInfo.lastPrice !== undefined && livedata.priceInfo.lastPrice !== 0) {
            updatestockprize(livedata.priceInfo.lastPrice)
            changeDisableStockPriceUpdate(true)
            updateStockUnrealizedPL(livedata.priceInfo.lastPrice)
        }
    }


    async function getTrades(strategy) {
        const stockTrades = await Promise.all(
            strategy.stock_trades.map(getStockTradesbyId)
        );
        const optionTrades = await Promise.all(
            strategy.option_trades.map(getOptionTradesbyId)
        );

        setTrades([...stockTrades.flat(), ...optionTrades.flat()]);
        setStockTrades([...stockTrades.flat()]);
        setOptionTrades([...optionTrades.flat()]);

        // Create a new array for option assets, ignoring trades with status "CLOSED"
        const newOptionAssets = Array.from(
            new Map(
                optionTrades
                    .flat()
                    .filter(trade => trade.status !== "CLOSED") // Ignore closed trades
                    .map(trade => [trade.asset, { name: trade.asset, price: 0 }])
            ).values()
        );

        // Update optionAssets state
        setOptionAssets(newOptionAssets);
    }

    async function handleCreateStockTrade() {
        setCreateStockTrade(true);
    }

    async function handleCreateOptionTrade() {
        setCreateOptionTrade(true);
    }

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

    async function handleDeleteStrategy() {
        try {
            let response = await deleteStrategy(currentStrategy.id);
            if (response)
                navigate(`/mystrategies`);
        } catch (error) {
            console.error("Strategy update failed:", error);
            setShowTradeFailedAlertPopup(true);
        }
    }

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

    const handleSymbolChange = (event) => {
        const newsymbol = event.target.value.trim();
        setCurrentStrategy((prev) => ({
            ...prev,
            symbol: newsymbol,
        }));
    };


    const handleStatusChange = (event) => {
        const newstatus = event.target.value;
        setCurrentStrategy((prev) => ({
            ...prev,
            status: newstatus,
        }));
    };

    const handleSliderChange = (event) => {

        setSliderValue(event.target.value);
        setIsManual(true); // Mark as manually changed
        updateStockUnrealizedPL(event.target.value)

        // setOptionAssets(prevAssets =>
        //     prevAssets.map((a, index) => {
        //         let newOptionPrice = 0;
        //         optiontrades.forEach((trade) => {
        //             console.log(trade.asset, a.name, trade.status)
        //             if (trade.asset === a.name && trade.status === "OPEN") {
        //                 newOptionPrice = parseFloat(culateOptionPrice(Number(lateststockprice), trade.strikeprize, a.price, "24-04-2025", 3, (Number(event.target.value) - Number(lateststockprice)), 1, "put")).toFixed(2)
        //                 console.log(newOptionPrice)
        //             }
        //         })
        //         return { ...a, price: parseFloat(newOptionPrice).toFixed(2) }
        //     }
        //     )
        // );
        // updateOptionUnrealizedPL()

        updateStockPrice(event.target.value)

    };

    const updateStockPrice = (newPrice) => {
        updatestockprize(newPrice);
        setSliderValue(newPrice)
        setIsManual(false); // Reset manual override
    };

    const updateStockUnrealizedPL = (price) => {
        if (price === 0) return; // Prevent updating if price is 0

        setStockTrades((prevTrades) => {
            const updatedTrades = prevTrades.map((trade) => {
                return {
                    ...trade,
                    unrealizedpl: (trade.openquantity * price) - (trade.openquantity * trade.entryprice),
                };
            });
            return updatedTrades
        });
    };

    const updateOptionUnrealizedPL = () => {
        if (optionAssets.length === 0) return;

        setOptionTrades((prevTrades) => {
            const assetPriceMap = new Map(optionAssets.map(asset => [asset.name, asset.price]));

            const updatedTrades = prevTrades.map(trade => {
                const latestPrice = assetPriceMap.get(trade.asset);
                if (latestPrice !== undefined) {
                    return {
                        ...trade,
                        unrealizedpl: (trade.openquantity * latestPrice) - (trade.openquantity * trade.entryprice),
                    };
                }
                return trade;
            });

            return updatedTrades;
        });
    };

    const generateOverAllUnrealizedPL = async () => {
        updateStockUnrealizedPL(lateststockprice);
        updateOptionUnrealizedPL();
    };

    const handleGeneratePL = () => {
        let hasError = false;

        // Check if stock price is empty
        if (!lateststockprice) {
            setStockPriceError("Stock price is required");
            hasError = true;
        } else {
            setStockPriceError("");
        }

        // Check if all option prices are filled
        const updatedErrors = optionAssets.map((option, index) => {
            if (!option.price) {
                hasError = true;
                return true; // Show error for this option
            }
            return false; // No error for this option
        });

        setOptionErrors(updatedErrors);

        // If there are errors, stop the function
        if (hasError) return;

        // Proceed with unrealized PL calculation if no errors
        generateOverAllUnrealizedPL();
        setSliderStartValue(lateststockprice)
    };

    useEffect(() => {
        const stockUnrealizedPL = stocktrades.reduce((sum, trade) => sum + (trade.unrealizedpl || 0), 0);
        const optionUnrealizedPL = optiontrades.reduce((sum, trade) => sum + (trade.unrealizedpl || 0), 0);

        const totalUnrealizedPL = stockUnrealizedPL + optionUnrealizedPL;
        updatetotalunrealizedpl(totalUnrealizedPL);
    }, [stocktrades, optiontrades]);

    const handleTradeSelection = (trade) => {
        setSelectedTrades((prev) =>
            prev.some((t) => t.tradeid === trade.tradeid)
                ? prev.filter((t) => t.tradeid !== trade.tradeid)
                : [...prev, trade]
        );
        setUpdateTradeDetails(trade);
    };

    const handleSubmitTrade = async (tradeDetails, isStock, isUpdate = false) => {
        const tradeFunction = isStock
            ? isUpdate ? updateStockTrade : addNewStockTrade
            : isUpdate ? updateOptionTrade : addNewOptionTrade;

        try {
            const response = await tradeFunction(tradeDetails);
            console.log("New Trade: " + response)
            if (response?.created) {
                if (isUpdate) {
                    await getTrades(currentStrategy);
                } else {
                    await addTradeToStrategy(response.data.tradeid, isStock);
                }
                setUpdateTradeDetails(null);
                setCreateStockTrade(false);
                setCreateOptionTrade(false);

            } else {
                setShowTradeFailedAlertPopup(true);
            }
        } catch (error) {
            console.error("Trade submission failed:", error);
            setShowTradeFailedAlertPopup(true);
        }
    };

    const addTradeToStrategy = async (tradeId, isStock = true) => {
        if (isStock)
            currentStrategy.stock_trades = [...currentStrategy.stock_trades, tradeId]
        else
            currentStrategy.option_trades = [...currentStrategy.option_trades, tradeId]
        await handleUpdateStrategy()
    }

    const totalPL = (stocktrades.reduce((sum, trade) => sum + (trade.overallreturn || 0), 0) + optiontrades.reduce((sum, trade) => sum + (trade.overallreturn || 0), 0));

    async function runStrategyPredictionSimulator() { }
    return (
        <>
            {loading ? (
                <CircularProgress size={24} />
            ) : (
                <Container sx={{ mt: 4 }}>
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

                    <Box sx={{ mb: 3, p: 1, border: "1px solid #ddd", borderRadius: "8px", background: "#f9f9f9", display: "flex", flexWrap: "wrap", alignItems: "center" }}>
                        <Typography variant="body2" gutterBottom sx={{ width: "100%", color: "black" }}> Update Stock and Option Prices to Calculate Unrealized P/L</Typography>
                        <TextField
                            label="Current Stock Price"
                            value={lateststockprice}
                            onChange={(e) => updateStockPrice(Number(e.target.value))}
                            error={!!stockpriceError} // Show error if there's an issue
                            helperText={stockpriceError} // Display the error message
                            sx={{ m: 1, width: "calc(33.33% - 16px)" }}
                            disabled={disableStockPriceUpdate}
                        />
                        {optionAssets.length > 0 && optionAssets.map((option, index) => (
                            <TextField
                                key={index}
                                label={`Price for ${option.name}`}
                                type="number"
                                value={option.price === undefined || option.price === 0 ? "" : option.price}
                                onChange={(e) => {
                                    let newPrice = e.target.value;
                                    if (newPrice === "" || /^[0-9]*\.?[0-9]{0,2}$/.test(newPrice)) {
                                        setOptionAssets(prevAssets =>
                                            prevAssets.map((a, i) =>
                                                i === index ? { ...a, price: newPrice === "" ? undefined : parseFloat(newPrice) } : a
                                            )
                                        );
                                    }
                                }}
                                inputMode="decimal"
                                error={optionErrors[index]} // Show error if this option field is empty
                                helperText={optionErrors[index] ? "Option price is required" : ""} // Display the error message for this option
                                sx={{ m: 1, width: "calc(33.33% - 16px)" }}
                            />
                        ))}
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleGeneratePL} // Trigger validation and then action
                            sx={{ m: 1, width: "100%" }}
                        >
                            Generate Unrealized P/L
                        </Button>
                    </Box>

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



                    <TextField
                        label="Total Realized P/L"
                        value={totalPL}
                        fullWidth
                        readOnly
                        sx={{ mb: 3 }}
                    />

                    <TextField
                        label="Total Unrealized P/L"
                        value={totalunrealizedpl}
                        fullWidth
                        readOnly
                        sx={{ mb: 3 }}
                    />

                    <TextField
                        label="Final P/L"
                        value={totalunrealizedpl + totalPL}
                        fullWidth
                        readOnly
                        sx={{ mb: 3 }}
                    />


                    {stocktrades.length > 0 &&
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
                                        <TableCell><b>Current P/L</b></TableCell>
                                        <TableCell><b>Unrealized P/L</b></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {stocktrades.map((trade, index) => (
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
                                            <TableCell>{trade.overallreturn}</TableCell>
                                            <TableCell>{trade.unrealizedpl}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    }

                    {optiontrades.length > 0 &&
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
                                        <TableCell><b>Current P/L</b></TableCell>
                                        <TableCell><b>Unrealized P/L</b></TableCell>
                                        <TableCell><b>Status</b></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {optiontrades.map((trade, index) => (
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

            <Dialog open={!!updateTradeDetails} onClose={() => setUpdateTradeDetails(null)}>
                {updateTradeDetails?.lotsize === undefined ? (
                    <StockTradeForm title="Update Stock Trade" onSubmit={(details) => handleSubmitTrade(details, true, true)} onCancel={() => setUpdateTradeDetails(null)} onDelete={() => getTrades(currentStrategy)} isUpdate currentTrade={updateTradeDetails} strategyid={id} />
                ) : (
                    <OptionTradeForm title="Update Option Trade" onSubmit={(details) => handleSubmitTrade(details, false, true)} onCancel={() => setUpdateTradeDetails(null)} onDelete={() => getTrades(currentStrategy)} isUpdate currentTrade={updateTradeDetails} strategyid={id} />
                )}
            </Dialog>
            <Dialog open={CreateStockTrade} onClose={() => setCreateStockTrade(false)}>
                <StockTradeForm title='Create Stock Trade' onSubmit={(details) => handleSubmitTrade(details, true, false)} onCancel={() => setCreateStockTrade(false)} />
            </Dialog>

            <Dialog open={CreateOptionTrade} onClose={() => setCreateOptionTrade(false)}>
                <OptionTradeForm title='Create Option Trade' onSubmit={(details) => handleSubmitTrade(details, false, false)} onCancel={() => setCreateOptionTrade(false)} />
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