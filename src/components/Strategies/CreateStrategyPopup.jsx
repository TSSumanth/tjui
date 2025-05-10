import React, { useState } from 'react';
import { Snackbar, Alert } from "@mui/material";
import { createStrategy } from '../../services/strategies'
import { Container, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem } from "@mui/material";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

function CreateStrategy({ title, onCancel, onSubmit, updateStrategydetails }) {
    const [strategydetails, setstrategydetails] = useState(updateStrategydetails || {
        status: "Open",
        name: "",
        description: "",
        created_at: dayjs(),
        symbol: "",
        symbol_ltp: ""
    });
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success"); // "success" or "error"


    const handleDateTimeChange = (newDateTime) => {
        setstrategydetails((prevData) => ({
            ...prevData,
            created_at: newDateTime
        }));
    };

    function handleChange(event) {
        const { name, value } = event.target;
        setstrategydetails((prevData) => ({
            ...prevData,
            [name]: value
        }));
    }


    const handleOnSubmit = async (e) => {
        e.preventDefault();
        console.log("new strategy details: " + strategydetails)
        let response = await createStrategy(strategydetails)
        if (response) {
            setSnackbarMessage("New Strategy Created Successfully!");
            setSnackbarSeverity("success");
        } else {
            setSnackbarMessage("Failed to Create Strategy.");
            setSnackbarSeverity("error");
        }
        setOpenSnackbar(true);
        // setOpenDialouge(false)
        setTimeout(() => onSubmit(), 1000);  // Adding one second wait to 
    }

    return (
        <Container sx={{ backgroundColor: "#f9f9f9", padding: 2, display: "flex", justifyContent: "center" }}>

            {/* Popup Form */}
            <Dialog open={true} onClose={onCancel} fullWidth maxWidth="sm">
                <DialogTitle>{title}</DialogTitle>
                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, paddingTop: 2 }}>
                    <TextField
                        label="Name"
                        name="name"
                        fullWidth
                        value={strategydetails.name}
                        onChange={handleChange}
                    />
                    <TextField
                        label="Stock Symbol Used for this Strategy"
                        name="symbol"
                        fullWidth
                        value={strategydetails.symbol}
                        onChange={handleChange}
                    />
                    <TextField
                        label="Symbol LTP (optional)"
                        name="symbol_ltp"
                        type="number"
                        fullWidth
                        value={strategydetails.symbol_ltp}
                        onChange={handleChange}
                        inputProps={{ step: "0.01", min: "0" }}
                    />
                    <TextField
                        select
                        label="Status"
                        name="status"
                        fullWidth
                        value={strategydetails.status}
                        onChange={handleChange}
                    >
                        <MenuItem value="Open">Open</MenuItem>
                        <MenuItem value="Close">Close</MenuItem>
                    </TextField>
                    <TextField
                        label="Description"
                        name="description"
                        multiline
                        rows={3}
                        fullWidth
                        value={strategydetails.description}
                        onChange={handleChange}
                    />
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DateTimePicker
                            label="Created Date"
                            value={strategydetails.created_at}
                            onChange={(newValue) => handleDateTimeChange(newValue)}
                            slotProps={{ textField: { fullWidth: true } }}
                        />
                    </LocalizationProvider>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onCancel} color="secondary">
                        Cancel
                    </Button>
                    <Button onClick={handleOnSubmit} variant="contained" color="primary">
                        Submit
                    </Button>
                </DialogActions>
            </Dialog>
            <Snackbar
                open={openSnackbar}
                autoHideDuration={3000} // Closes after 3 seconds
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
            >
                <Alert
                    onClose={() => setOpenSnackbar(false)}
                    severity={snackbarSeverity}
                    sx={{ width: "100%" }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
}

export { CreateStrategy };