import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Box,
    FormControl,
    InputLabel,
    Select,
} from "@mui/material";
import DateTimePicker from "../Generic/DateTimeComponent";
import moment from 'moment';

const normalizeOrderType = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
};

function OrderForm({ title, onSubmit, onCancel, updateOrderdetails }) {
    const [orderDetails, setOrderDetails] = useState(updateOrderdetails ? {
        ...updateOrderdetails,
        ordertype: normalizeOrderType(updateOrderdetails.ordertype),
        date: updateOrderdetails.date ? moment(updateOrderdetails.date).toDate() : new Date()
    } : {
        ordertype: "Buy",
        quantity: "",
        price: "",
        date: new Date(),
        notes: "",
        tags: "",
    });

    const handleDateTimeChange = (newDateTime) => {
        setOrderDetails((prevData) => ({
            ...prevData,
            date: newDateTime,
        }));
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setOrderDetails((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleOnSubmit = (e) => {
        e.preventDefault();
        const formattedOrderDetails = {
            ...orderDetails,
            date: moment(orderDetails.date).format('YYYY-MM-DD HH:mm:ss')
        };
        onSubmit(formattedOrderDetails);
    };

    return (
        <Dialog open={true} onClose={onCancel} maxWidth="sm" fullWidth>
            <DialogTitle>{title || "Order Form"}</DialogTitle>
            <DialogContent>
                <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
                    {/* Order Type Dropdown */}
                    <FormControl fullWidth>
                        <InputLabel>Order Type</InputLabel>
                        <Select name="ordertype" value={orderDetails.ordertype} onChange={handleChange}>
                            <MenuItem value="Buy">Buy</MenuItem>
                            <MenuItem value="Sell">Sell</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Quantity Input */}
                    <TextField
                        label="Quantity"
                        type="number"
                        name="quantity"
                        value={orderDetails.quantity}
                        onChange={handleChange}
                        fullWidth
                    />

                    {/* Price Input */}
                    <TextField
                        label="Price"
                        type="number"
                        name="price"
                        value={orderDetails.price}
                        onChange={handleChange}
                        slotProps={{
                            input: {
                                step: "0.01",
                                min: "0"
                            }
                        }}
                        fullWidth
                    />

                    {/* Date & Time Picker */}
                    <FormControl fullWidth>
                        <DateTimePicker
                            name="date"
                            value={orderDetails.date}
                            onChange={handleDateTimeChange}
                        />
                    </FormControl>

                    {/* Notes Input */}
                    <TextField
                        label="Notes"
                        name="notes"
                        value={orderDetails.notes}
                        onChange={handleChange}
                        multiline
                        rows={3}
                        fullWidth
                    />

                    {/* Tags Input */}
                    <TextField
                        label="Tags"
                        name="tags"
                        value={orderDetails.tags}
                        onChange={handleChange}
                        fullWidth
                    />
                </Box>
            </DialogContent>

            <DialogActions>
                <Button variant="contained" color="primary" onClick={handleOnSubmit}>
                    Submit
                </Button>
                <Button variant="outlined" color="secondary" onClick={onCancel}>
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export { OrderForm };