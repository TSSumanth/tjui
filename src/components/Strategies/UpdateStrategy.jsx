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
    DialogActions, DialogContent, DialogContentText, DialogTitle, FormControl, InputLabel, Select, MenuItem
} from "@mui/material";
import { AlertPopup } from "../Generic/Popup.jsx";
import { updateStrategy, getStrategies, deleteStrategy } from '../../services/strategies';
import { getStockTradesbyId, getOptionTradesbyId } from '../../services/trades';
import { StockTradeForm } from "../Trades/StockTradeForm.jsx";
import OptionTradeForm from "../Trades/OptionTradeForm.jsx";
import { addNewStockTrade, updateStockTrade, addNewOptionTrade, updateOptionTrade } from "../../services/trades.js";
import { useNavigate } from "react-router-dom";


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
    const [nameError, setNameError] = useState("");
    const [existingStrategies, setExistingStrategies] = useState([]);
    const [selectedTrades, setSelectedTrades] = useState([]);
    const [updateTradeDetails, setUpdateTradeDetails] = useState(null);
    const [showTradeFailedAlertPopup, setShowTradeFailedAlertPopup] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [lateststockprice, updatestockprize] = useState(0);
    const [unrealizedpl, updateunrealizedpl] = useState(0);
    const [CreateStockTrade, setCreateStockTrade] = useState(false);
    const [CreateOptionTrade, setCreateOptionTrade] = useState(false);
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
            } catch (error) {
                console.error("Error fetching strategies:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStrategies();
    }, []);

    async function getTrades(strategy) {
        const stockTrades = await Promise.all(
            strategy.stock_trades.map(getStockTradesbyId)
        );
        const optionTrades = await Promise.all(
            strategy.option_trades.map(getOptionTradesbyId)
        );
        setTrades([...stockTrades.flat(), ...optionTrades.flat()]);
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

    const handleStatusChange = (event) => {
        const newstatus = event.target.value;

        setCurrentStrategy((prev) => ({
            ...prev,
            status: newstatus,
        }));
    };

    const handleStockPriceChange = (event) => {
        const newPrice = event.target.value.trim();
        updatestockprize(newPrice)
    };

    const updateUnrealizedPL = () => {
        if (!(lateststockprice === 0))
            setTrades((prevTrades) => {
                const updatedTrades = prevTrades.map((trade) => {
                    if (trade.lotsize === undefined) {
                        return {
                            ...trade,
                            unrealizedpl: (trade.openquantity * lateststockprice) - (trade.openquantity * trade.entryprice),
                        };
                    }
                    return trade;
                });

                // Calculate the sum of unrealized P/L based on updated trades
                const totalUnrealizedPL = updatedTrades.reduce((sum, trade) => sum + (trade.unrealizedpl || 0), 0);

                // Update state with the new total unrealized P/L
                updateunrealizedpl(totalUnrealizedPL);

                return updatedTrades; // Return updated trades to update state
            });
    }

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

    // Calculate Total P/L
    const totalPL = trades.reduce((sum, trade) => sum + (trade.overallreturn || 0), 0);

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

                    <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
                        <TextField
                            label="Current Stock Price"
                            value={lateststockprice}
                            onChange={handleStockPriceChange}
                            error={!!nameError}
                            helperText={nameError}
                            sx={{ flex: 1 }} // Makes TextField take remaining space
                        />
                        <Button variant="contained" color="primary" onClick={updateUnrealizedPL}>
                            Generate Unrealized P/L
                        </Button>
                    </Box>
                    <TextField
                        label="Total Realized P/L"
                        value={totalPL}
                        fullWidth
                        readOnly
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        label="Total Unrealized P/L"
                        value={unrealizedpl}
                        fullWidth
                        readOnly
                        sx={{ mb: 2 }}
                    />

                    <TableContainer component={Paper}>
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
                                {trades.map((trade, index) => (
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
                </Container>
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