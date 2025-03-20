import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Box
} from "@mui/material";
import { AlertPopup } from "../Generic/Popup";
import { getOpenStrategies, updateStrategy } from "../../services/strategies";

function AssignTradesToStrategy({ title, tradeDetails, onSubmit, open, onClose }) {
    const [selectedStrategy, setSelectedStrategy] = useState({});
    const [openStrategies, setOpenStrategies] = useState([]);
    const [showCreateConfirmation, setCreateConfirmation] = useState(false);
    const [showCreateFailedMessage, setShowCreateFailedMessage] = useState(false);

    useEffect(() => {
        const fetchStrategies = async () => {
            try {
                const response = await getOpenStrategies();
                setOpenStrategies(response);
            } catch (error) {
                console.error("Error fetching strategies:", error);
            }
        };
        fetchStrategies();
    }, []);

    // Handle strategy selection change
    const handleStrategyChange = (event) => {
        const selected = openStrategies.find((strategy) => strategy.name === event.target.value);
        setSelectedStrategy(selected || {});
    };

    // Handle submit action
    const handleSubmit = async () => {
        if (!selectedStrategy.id) {
            alert("Please select a strategy.");
            return;
        }

        let stockTrades = [];
        let optionTrades = [];

        tradeDetails.forEach((trade) => {
            trade.lotsize === undefined
                ? stockTrades.push(trade.tradeid)
                : optionTrades.push(trade.tradeid);
        });

        const updatePayload = {
            ...selectedStrategy,
            stock_trades: Array.from(new Set([...selectedStrategy.stock_trades, ...stockTrades])),
            option_trades: Array.from(new Set([...selectedStrategy.option_trades, ...optionTrades])),
        };

        try {
            await updateStrategy(updatePayload);
            setCreateConfirmation(true);
        } catch (error) {
            setShowCreateFailedMessage(true);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{title || "Assign Trades to Strategy"}</DialogTitle>
            <DialogContent>
                {/* Strategy Selection */}
                <Box sx={{ mb: 2 }}>
                    <FormControl fullWidth>
                        <InputLabel>Select a Strategy</InputLabel>
                        <Select value={selectedStrategy.name || ""} onChange={handleStrategyChange}>
                            {openStrategies.map((strategy) => (
                                <MenuItem key={strategy.id} value={strategy.name}>
                                    {strategy.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                {/* Trade Details Table */}
                {tradeDetails.length > 0 && (
                    <Table sx={{ mt: 2 }}>
                        <TableHead sx={{ backgroundColor: "#e3f2fd" }}>
                            <TableRow>
                                <TableCell>Id</TableCell>
                                <TableCell>Market</TableCell>
                                <TableCell>Asset</TableCell>
                                <TableCell>Open Quantity</TableCell>
                                <TableCell>Price</TableCell>
                                <TableCell>Date</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tradeDetails.map((trade, index) => (
                                <TableRow
                                    key={index}
                                    sx={{
                                        backgroundColor: trade.lotsize === undefined ? "#c8e6c9" : "#ffcdd2",
                                    }}
                                >
                                    <TableCell>{trade.tradeid}</TableCell>
                                    <TableCell>{trade.lotsize === undefined ? "Stock" : "Option"}</TableCell>
                                    <TableCell>{trade.asset}</TableCell>
                                    <TableCell>{trade.openquantity}</TableCell>
                                    <TableCell>{trade.entryprice}</TableCell>
                                    <TableCell>{trade.date}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </DialogContent>

            {/* Popup Footer Buttons */}
            <DialogActions>
                <Button variant="contained" color="primary" onClick={handleSubmit} disabled={!selectedStrategy.id}>
                    Submit
                </Button>
                <Button variant="outlined" color="secondary" onClick={onClose}>
                    Cancel
                </Button>
            </DialogActions>

            {/* Success & Failure Popups */}
            {showCreateConfirmation && (
                <AlertPopup
                    trigger={showCreateConfirmation}
                    onConfirm={() => {
                        setCreateConfirmation(false);
                        onSubmit();
                    }}
                    message="Strategy updated successfully."
                />
            )}

            {showCreateFailedMessage && (
                <AlertPopup
                    trigger={showCreateFailedMessage}
                    onConfirm={() => {
                        setShowCreateFailedMessage(false);
                        onClose();
                    }}
                    message="Unable to update Strategy."
                />
            )}
        </Dialog>
    );
}

export { AssignTradesToStrategy };