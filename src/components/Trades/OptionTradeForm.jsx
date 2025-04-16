import React, { useState, useEffect } from 'react';
import { format, parseISO } from "date-fns";
import { v4 as uuidv4 } from 'uuid';
import { OrderForm } from './OrderForm.jsx'
import { addOptionOrder, getTradeOptionOrders, updateOptionOrder, deleteAllTradeOptionOrders, deleteTradeOptionOrder } from '../../services/orders.js'
import { updateStrategy, getStrategies, deleteStrategy } from '../../services/strategies';
import { deleteOptionTrade } from '../../services/trades.js'
import { AlertPopup, ConfirmPopup } from '../Generic/Popup.jsx'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Tabs,
    Tab,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    IconButton,
    Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const getCurrentDateTime = () => {
    let date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}/${month}/${day} ${hours}:${minutes}`;
};

function OptionTradeForm({ title, onSubmit, onCancel, onDelete, isUpdate = false, currentTrade, strategyid }) {
    const [showAddNewOrder, setShowAddNewOrder] = useState(false);
    const [showUpdateOrder, setShowUpdateOrder] = useState(false);
    const [newTradeId, setNewTradeId] = useState(uuidv4());
    const [activeTab, setActiveTab] = useState(0);
    const [showOrderFailedAlertPopup, setShowOrderFailedAlertPopup] = useState(false);
    const [showTradeFailedAlertPopup, setShowTradeFailedAlertPopup] = useState(false);
    const [showOrderDeleteConfirmPopup, setShowOrderDeleteConfirmPopup] = useState(false);
    const [showTradeDeleteConfirmPopup, setShowTradeDeleteConfirmPopup] = useState(false);
    const [allorders, setallOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [tradeDetails, setTradeDetails] = useState(currentTrade || {
        tradeid: "",
        asset: "",
        lotsize: "",
        premiumamount: 0,
        tradetype: "Long",
        quantity: 0,
        entryprice: 0,
        capitalused: 0,
        entrydate: "",
        openquantity: 0,
        closedquantity: 0,
        exitaverageprice: 0,
        finalexitprice: "",
        status: "",
        overallreturn: "",
        exitdate: "",
        lastmodifieddate: "",
        notes: "",
        tags: "",
        ltp: 0
    });

    async function fetchOrders(tradeid) {
        try {
            if (!tradeid) {
                console.error('No trade ID provided for fetching orders');
                setallOrders([]);
                return;
            }
            const response = await getTradeOptionOrders(tradeid);
            if (response && Array.isArray(response)) {
                setallOrders(response);
            } else {
                console.error('Invalid response format from getTradeOptionOrders:', response);
                setallOrders([]);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            setallOrders([]);
        }
    }

    useEffect(() => {
        if (isUpdate && tradeDetails.tradeid) {
            fetchOrders(tradeDetails.tradeid);
        }
    }, [isUpdate, tradeDetails.tradeid]);

    // Update total when other fields change
    useEffect(() => {
        updateOptionTradeDetails()
    }, [allorders]);

    function updateOptionTradeDetails() {
        if (!allorders.length > 0)
            return;
        let entryorderquantity = 0;
        let exitorderquantity = 0;
        let entryavgprice = 0;
        let exitavgprice = 0;
        allorders.map((order) => {
            if (tradeDetails.tradetype.toUpperCase() === "LONG" && order.ordertype.toUpperCase() === "BUY") {
                let newentryquantity = entryorderquantity + Number(order.quantity);
                let newentryavgprice = ((entryavgprice * entryorderquantity) + (Number(order.quantity) * Number(order.price))) / (entryorderquantity + Number(order.quantity))
                entryavgprice = newentryavgprice
                entryorderquantity = newentryquantity
            } else if (tradeDetails.tradetype.toUpperCase() === "LONG" && order.ordertype.toUpperCase() === "SELL") {
                let newexitavgquantity = exitorderquantity + Number(order.quantity);
                let newexitavgprice = ((exitavgprice * exitorderquantity) + (Number(order.quantity) * Number(order.price))) / (exitorderquantity + Number(order.quantity))
                exitavgprice = newexitavgprice
                exitorderquantity = newexitavgquantity
            }
            else if (tradeDetails.tradetype.toUpperCase() === "SHORT" && order.ordertype.toUpperCase() === "BUY") {
                let newexitavgquantity = exitorderquantity + Number(order.quantity);
                let newexitavgprice = ((exitavgprice * exitorderquantity) + (Number(order.quantity) * Number(order.price))) / (exitorderquantity + Number(order.quantity))
                exitavgprice = newexitavgprice
                exitorderquantity = newexitavgquantity
            }
            else if (tradeDetails.tradetype.toUpperCase() === "SHORT" && order.ordertype.toUpperCase() === "SELL") {
                let newentryquantity = entryorderquantity + Number(order.quantity);
                let newentryavgprice = ((entryavgprice * entryorderquantity) + (Number(order.quantity) * Number(order.price))) / (entryorderquantity + Number(order.quantity))
                entryavgprice = newentryavgprice
                entryorderquantity = newentryquantity
            }
        })
        setTradeDetails((prevDetails) => ({
            ...prevDetails,
            quantity: entryorderquantity * Number(tradeDetails.lotsize),
            openquantity: (entryorderquantity - exitorderquantity) * Number(tradeDetails.lotsize),
            closedquantity: exitorderquantity * Number(tradeDetails.lotsize),
            entryprice: parseFloat(entryavgprice).toFixed(2),
            exitaverageprice: parseFloat(exitavgprice).toFixed(2),
            "status": (entryorderquantity - exitorderquantity === 0) ? "CLOSED" : "OPEN",
            entrydate: allorders[0].date,
            finalexitprice: (entryorderquantity - exitorderquantity === 0) ? parseFloat(exitavgprice).toFixed(2) : 0,
            capitalused: (entryorderquantity - exitorderquantity !== 0) ? parseFloat(((entryorderquantity * entryavgprice) * Number(tradeDetails.lotsize)) - ((exitorderquantity * exitavgprice) * Number(tradeDetails.lotsize))).toFixed(2) : 0,
            overallreturn: parseFloat((tradeDetails.tradetype.toUpperCase() === "LONG" ? (exitorderquantity * exitavgprice * prevDetails.lotsize) - (exitorderquantity * entryavgprice * prevDetails.lotsize) : (exitorderquantity * entryavgprice * prevDetails.lotsize) - (exitorderquantity * exitavgprice * prevDetails.lotsize))).toFixed(2),
            exitdate: (entryorderquantity - exitorderquantity === 0) ? allorders[allorders.length - 1].date : 0,
            lastmodifieddate: getCurrentDateTime(),
            premiumamount: parseFloat((entryorderquantity * entryavgprice) * Number(tradeDetails.lotsize)).toFixed(2)
        }));
    }

    async function createNewOrder(orderdetails) {
        if (isUpdate) {
            orderdetails.tradeid = tradeDetails.tradeid;
        } else
            orderdetails.tradeid = newTradeId;

        orderdetails.lotsize = tradeDetails.lotsize
        orderdetails.asset = tradeDetails.asset;
        let response = await addOptionOrder(orderdetails)
        if (response?.created) {
            setShowAddNewOrder(false);
            console.log("Order Created: ", response)
            await fetchOrders(orderdetails.tradeid);
            updateOptionTradeDetails()
        }
        else {
            setShowOrderFailedAlertPopup(true)
        }
    }

    async function updateOrder(order) {
        let response = await updateOptionOrder(order)
        if (response) {
            await fetchOrders(order.tradeid);
            setShowUpdateOrder(false);
        }
    }

    const handleOrderEditClick = async (order) => {
        setSelectedOrder(order);
        setShowUpdateOrder(true)
    }

    const handleOrderDeleteClick = async (order) => {
        setSelectedOrder(order);
        setShowOrderDeleteConfirmPopup(true)
    }

    async function deleteOrder(e) {
        let response = await deleteTradeOptionOrder(e.id)
        if (response === true) {
            await fetchOrders(e.tradeid);
            setShowOrderDeleteConfirmPopup(false)
            setSelectedOrder(null);
        } else {
            alert("Unable to delete order " + e.asset)
        }
    }

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleTextChange = (e) => {
        const { name, value } = e.target;
        if (value !== "") {
            setTradeDetails((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleOnSubmit = (e) => {
        e.preventDefault();
        if (!isUpdate)
            onSubmit({
                ...tradeDetails,
                tradeid: newTradeId,
            })
        else {
            onSubmit(tradeDetails);
        }
    }

    const handleOnDelete = (e) => {
        e.preventDefault();
        setShowTradeDeleteConfirmPopup(true)
    }

    async function deleteCompleteTrade() {
        let response = await deleteAllTradeOptionOrders(tradeDetails.tradeid)
        if (response) {
            let response1 = await deleteOptionTrade(tradeDetails.tradeid)
            if (response1) {
                setShowTradeDeleteConfirmPopup(false)
                onCancel()
            } else {
                setShowTradeDeleteConfirmPopup(false)
                setShowTradeFailedAlertPopup(true)
            }
            if (strategyid !== undefined) {
                let response2 = await getStrategies({ id: strategyid })
                response2[0].option_trades = response2[0].option_trades.filter(trade => trade !== tradeDetails.tradeid);
                await updateStrategy(response2[0])
            }
        } else {
            setShowTradeDeleteConfirmPopup(false)
            setShowTradeFailedAlertPopup(true)
        }
        if (onDelete) {
            onDelete()
        }
    }

    return (
        <Dialog
            open={true}
            onClose={onCancel}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    minHeight: '80vh',
                    maxHeight: '80vh'
                }
            }}
        >
            <DialogTitle>{title}</DialogTitle>
            <DialogContent
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '60vh',
                    overflow: 'hidden'
                }}
            >
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs value={activeTab} onChange={handleTabChange}>
                        <Tab label="Trade Details" />
                        <Tab label="Orders" />
                        <Tab label="Trade Notes" />
                    </Tabs>
                </Box>

                <Box sx={{
                    flex: 1,
                    overflow: 'auto',
                    pr: 1
                }}>
                    {activeTab === 0 && (
                        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <TextField
                                    label="Asset"
                                    name="asset"
                                    value={tradeDetails.asset}
                                    onChange={handleTextChange}
                                    fullWidth
                                />
                                <TextField
                                    label="Strike Price"
                                    name="strikeprize"
                                    value={tradeDetails.strikeprize}
                                    onChange={handleTextChange}
                                    fullWidth
                                />
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <TextField
                                    label="Lot Size"
                                    name="lotsize"
                                    value={tradeDetails.lotsize}
                                    onChange={handleTextChange}
                                    fullWidth
                                />
                                <FormControl fullWidth>
                                    <InputLabel>Trade Type</InputLabel>
                                    <Select
                                        name="tradetype"
                                        value={tradeDetails.tradetype}
                                        onChange={handleTextChange}
                                        label="Trade Type"
                                    >
                                        <MenuItem value="Long">Long</MenuItem>
                                        <MenuItem value="Short">Short</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <TextField
                                    label="Trade Quantity"
                                    name="quantity"
                                    value={tradeDetails.quantity}
                                    disabled
                                    fullWidth
                                />
                                <TextField
                                    label="Entry Average Price"
                                    name="entryprice"
                                    value={tradeDetails.entryprice}
                                    disabled
                                    fullWidth
                                />
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <TextField
                                    label="Entry Date"
                                    name="entrydate"
                                    value={tradeDetails.entrydate}
                                    disabled
                                    fullWidth
                                />
                                <TextField
                                    label="Open Quantity"
                                    name="openquantity"
                                    value={tradeDetails.openquantity}
                                    disabled
                                    fullWidth
                                />
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <TextField
                                    label="Closed Quantity"
                                    name="closedquantity"
                                    value={tradeDetails.closedquantity}
                                    disabled
                                    fullWidth
                                />
                                <TextField
                                    label="Exit Average Price"
                                    name="exitaverageprice"
                                    value={tradeDetails.exitaverageprice}
                                    disabled
                                    fullWidth
                                />
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <TextField
                                    label="Capital Used"
                                    name="capitalused"
                                    value={tradeDetails.capitalused}
                                    disabled
                                    fullWidth
                                />
                                <TextField
                                    label="Premium Paid"
                                    name="premiumamount"
                                    value={tradeDetails.premiumamount}
                                    disabled
                                    fullWidth
                                />
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <TextField
                                    label="Overall Return"
                                    name="overallreturn"
                                    value={tradeDetails.overallreturn}
                                    disabled
                                    fullWidth
                                />
                                <TextField
                                    label="Status"
                                    name="status"
                                    value={tradeDetails.status}
                                    disabled
                                    fullWidth
                                />
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <TextField
                                    label="Last Traded Price"
                                    name="ltp"
                                    type="number"
                                    value={tradeDetails.ltp}
                                    onChange={handleTextChange}
                                    inputProps={{ step: "0.01", min: "0" }}
                                    fullWidth
                                />
                                <TextField
                                    label="Tags"
                                    name="tags"
                                    value={tradeDetails.tags}
                                    onChange={handleTextChange}
                                    fullWidth
                                />
                            </Box>
                        </Box>
                    )}

                    {activeTab === 1 && (
                        <Box>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => setShowAddNewOrder(true)}
                                sx={{ mb: 2 }}
                            >
                                Add Order
                            </Button>
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Id</TableCell>
                                            <TableCell>Type</TableCell>
                                            <TableCell>Quantity</TableCell>
                                            <TableCell>Price</TableCell>
                                            <TableCell>Date</TableCell>
                                            <TableCell>Notes</TableCell>
                                            <TableCell>Tags</TableCell>
                                            <TableCell>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {Array.isArray(allorders) && allorders.map((order) => (
                                            <TableRow key={order.id}>
                                                <TableCell>{order.id}</TableCell>
                                                <TableCell className={order.ordertype.toLowerCase()}>
                                                    {order.ordertype}
                                                </TableCell>
                                                <TableCell>{order.quantity}</TableCell>
                                                <TableCell>{parseFloat(order.price).toFixed(2)}</TableCell>
                                                <TableCell>{order.date}</TableCell>
                                                <TableCell>{order.notes}</TableCell>
                                                <TableCell>{order.tags}</TableCell>
                                                <TableCell>
                                                    <Tooltip title="Edit">
                                                        <IconButton onClick={() => handleOrderEditClick(order)}>
                                                            <EditIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete">
                                                        <IconButton onClick={() => handleOrderDeleteClick(order)}>
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}

                    {activeTab === 2 && (
                        <TextField
                            label="Notes"
                            name="notes"
                            value={tradeDetails.notes}
                            onChange={handleTextChange}
                            multiline
                            rows={10}
                            fullWidth
                        />
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel}>Cancel</Button>
                {isUpdate && (
                    <Button color="error" onClick={handleOnDelete}>
                        Delete Trade
                    </Button>
                )}
                <Button variant="contained" onClick={handleOnSubmit}>
                    Submit
                </Button>
            </DialogActions>

            {showAddNewOrder && (
                <OrderForm
                    title='New Order'
                    onSubmit={(orderdetails) => createNewOrder(orderdetails)}
                    onCancel={() => setShowAddNewOrder(false)}
                />
            )}

            {showUpdateOrder && (
                <OrderForm
                    title='Update Order'
                    onSubmit={(orderdetails) => updateOrder(orderdetails)}
                    onCancel={() => setShowUpdateOrder(false)}
                    updateOrderdetails={selectedOrder}
                />
            )}

            {showOrderFailedAlertPopup && (
                <AlertPopup
                    trigger={showOrderFailedAlertPopup}
                    onConfirm={() => setShowOrderFailedAlertPopup(false)}
                    message="Unable to Create Order."
                />
            )}

            {showTradeFailedAlertPopup && (
                <AlertPopup
                    trigger={showTradeFailedAlertPopup}
                    onConfirm={() => setShowTradeFailedAlertPopup(false)}
                    message="Unable to Delete Order."
                />
            )}

            {showOrderDeleteConfirmPopup && (
                <ConfirmPopup
                    trigger={showOrderDeleteConfirmPopup}
                    onConfirm={() => deleteOrder(selectedOrder)}
                    onCancel={() => setShowOrderDeleteConfirmPopup(false)}
                    message="Do you wish to delete Order?"
                />
            )}

            {showTradeDeleteConfirmPopup && (
                <ConfirmPopup
                    trigger={showTradeDeleteConfirmPopup}
                    onConfirm={() => deleteCompleteTrade()}
                    onCancel={() => setShowTradeDeleteConfirmPopup(false)}
                    message="Do you wish to delete the trade and associated orders?"
                />
            )}
        </Dialog>
    );
}

export default OptionTradeForm;