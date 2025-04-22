import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box, Typography, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { format as formatDate } from "date-fns";
import DateComponent from "../Generic/DateComponent";

const ProfitLossForm = ({ isOpen, onClose, record, onSave, isUpdate }) => {
    const [updatedRecord, setUpdatedRecord] = useState(record || {
        date: formatDate(new Date(), "yyyy-MM-dd"),
        stocks_realised: "",
        stocks_unrealised: "",
        fo_realised: "",
        fo_unrealised: "",
        fo_pl: "0",
        stock_pl: "0",
        total_pl: "0"
    });

    useEffect(() => {
        setUpdatedRecord((prev) => ({
            ...prev,
            stock_pl: Number(prev.stocks_realised) + Number(prev.stocks_unrealised),
            fo_pl: Number(prev.fo_realised) + Number(prev.fo_unrealised),
            total_pl: Number(prev.stocks_realised) + Number(prev.stocks_unrealised) + Number(prev.fo_realised) + Number(prev.fo_unrealised),
        }));
    }, [updatedRecord.stocks_realised, updatedRecord.stocks_unrealised, updatedRecord.fo_realised, updatedRecord.fo_unrealised]);

    const handleChange = (e) => {
        setUpdatedRecord({ ...updatedRecord, [e.target.name]: e.target.value });
    };

    const handleDateChange = (date) => {
        setUpdatedRecord((prev) => ({ ...prev, date: formatDate(date, "yyyy-MM-dd") }));
    };

    const handleSave = () => {
        onSave(updatedRecord);
        onClose();
    };

    return (
        <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{isUpdate ? "Edit P/L Entry" : "Add New P/L Entry"}</DialogTitle>
            <IconButton onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }}>
                <CloseIcon />
            </IconButton>
            <DialogContent>
                <Box display="flex" flexDirection="column" gap={2}>
                    <Typography variant="h6">Report Date</Typography>
                    <DateComponent initialDate={updatedRecord.date} onDateSelect={handleDateChange} />

                    <TextField label="Stocks Realized (₹)" name="stocks_realised" value={updatedRecord.stocks_realised} onChange={handleChange} fullWidth />
                    <TextField label="Stocks Unrealized (₹)" name="stocks_unrealised" value={updatedRecord.stocks_unrealised} onChange={handleChange} fullWidth />
                    <Typography variant="subtitle1">Total Stock P/L: {updatedRecord.stock_pl}</Typography>

                    <TextField label="F&O Realized (₹)" name="fo_realised" value={updatedRecord.fo_realised} onChange={handleChange} fullWidth />
                    <TextField label="F&O Unrealized (₹)" name="fo_unrealised" value={updatedRecord.fo_unrealised} onChange={handleChange} fullWidth />
                    <Typography variant="subtitle1">Total F&O P/L: {updatedRecord.fo_pl}</Typography>
                    <Typography variant="h6">Overall P/L: {updatedRecord.total_pl}</Typography>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="error">Cancel</Button>
                <Button onClick={handleSave} variant="contained" color="primary">Save</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProfitLossForm;
