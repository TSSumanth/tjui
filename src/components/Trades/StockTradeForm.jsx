import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { OrderForm } from './OrderForm.jsx'
import { addStockOrder, getTradeStockOrders, deleteTradeStockOrder, updateStockOrder, deleteAllTradeStockOrders } from '../../services/orders.js'
import { updateStrategy, getStrategies } from '../../services/strategies';
import { deleteStockTrade } from '../../services/trades.js'
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
    IconButton,
    Tooltip,
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

const normalizeOrderType = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
};

function StockTradeForm({ title, onSubmit, onCancel, onDelete, isUpdate = false, currentTrade, strategyid }) {
    const [showAddNewOrder, setShowAddNewOrder] = useState(false);
    const [showUpdateOrder, setShowUpdateOrder] = useState(false);
    const [newTradeId] = useState(() => isUpdate ? null : uuidv4());
    const [activeTab, setActiveTab] = useState(0);
    const [showOrderFailedAlertPopup, setShowOrderFailedAlertPopup] = useState(false);
    const [showTradeFailedAlertPopup, setShowTradeFailedAlertPopup] = useState(false);
    const [showOrderDeleteConfirmPopup, setShowOrderDeleteConfirmPopup] = useState(false);
    const [showTradeDeleteConfirmPopup, setShowTradeDeleteConfirmPopup] = useState(false);
    const [allorders, setallOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [strategies, setStrategies] = useState([]);
    const [tradeDetails, setTradeDetails] = useState(currentTrade || {
        tradeid: "",
        asset: "",
        tradetype: "LONG",
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
            const response = await getTradeStockOrders(tradeid);
            if (response && Array.isArray(response)) {
                setallOrders(response.map(order => ({
                    ...order,
                    ordertype: normalizeOrderType(order.ordertype)
                })));
            } else {
                console.error('Invalid response format from getTradeStockOrders:', response);
                setallOrders([]);
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
            setallOrders([]);
        }
    }

    async function fetchStrategies() {
        try {
            const response = await getStrategies();
            if (response && Array.isArray(response)) {
                setStrategies(response);
            } else {
                console.error('Invalid response format from getStrategies:', response);
                setStrategies([]);
            }
        } catch (err) {
            console.error('Error fetching strategies:', err);
            setStrategies([]);
        }
    }

    useEffect(() => {
        if (isUpdate && tradeDetails.tradeid) {
            fetchOrders(tradeDetails.tradeid);
            if (strategyid) {
                fetchStrategies();
            }
        }
    }, [isUpdate, tradeDetails.tradeid, strategyid]);

    // Update total when other fields change
    useEffect(() => {
        updateTradeDetails()
    }, [allorders]);

    const updateTradeDetails = useCallback(() => {
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
            quantity: entryorderquantity,
            openquantity: entryorderquantity - exitorderquantity,
            closedquantity: exitorderquantity,
            entryprice: parseFloat(entryavgprice).toFixed(2),
            exitaverageprice: parseFloat(exitavgprice).toFixed(2),
            "status": (entryorderquantity - exitorderquantity === 0) ? "CLOSED" : "OPEN",
            entrydate: allorders[0].date,
            finalexitprice: (entryorderquantity - exitorderquantity === 0) ? parseFloat(exitavgprice).toFixed(2) : 0,
            capitalused: (entryorderquantity - exitorderquantity !== 0) ? parseFloat((entryorderquantity * entryavgprice) - (exitorderquantity * exitavgprice)).toFixed(2) : 0,
            overallreturn: parseFloat((tradeDetails.tradetype.toUpperCase() === "LONG" ? (exitorderquantity * exitavgprice) - (exitorderquantity * entryavgprice) : (exitorderquantity * entryavgprice) - (exitorderquantity * exitavgprice))).toFixed(2),
            exitdate: (entryorderquantity - exitorderquantity === 0) ? allorders[allorders.length - 1].date : "",
            lastmodifieddate: getCurrentDateTime()
        }));
    }, [allorders, tradeDetails.tradetype]);

    async function createNewOrder(orderdetails) {
        if (isUpdate) {
            orderdetails.tradeid = tradeDetails.tradeid;
        } else
            orderdetails.tradeid = newTradeId;

        orderdetails.asset = tradeDetails.asset;
        let response = await addStockOrder(orderdetails)
        if (response?.created) {
            setShowAddNewOrder(false);
            console.log("Order Created: ", response)
            await fetchOrders(orderdetails.tradeid);
            updateTradeDetails()
        }
        else {
            setShowOrderFailedAlertPopup(true)
        }
    }

    async function updateOrder(order) {
        let response = await updateStockOrder(order)
        if (response) {
            await fetchOrders(order.tradeid);
            setShowUpdateOrder(false);
        }
        else {
            setShowOrderFailedAlertPopup(true)
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
        let response = await deleteTradeStockOrder(e.id)
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
    };

    const handleOnDelete = (e) => {
        e.preventDefault();
        setShowTradeDeleteConfirmPopup(true);
    };

    async function deleteCompleteTrade() {
        let response = await deleteAllTradeStockOrders(tradeDetails.tradeid)
        if (response) {
            let response1 = await deleteStockTrade(tradeDetails.tradeid)
            if (response1) {
                setShowTradeDeleteConfirmPopup(false)
                if (onDelete) {
                    onDelete()
                }
                onCancel()
            } else {
                setShowTradeDeleteConfirmPopup(false)
                setShowTradeFailedAlertPopup(true)
            }
            if (strategyid !== undefined) {
                let response2 = await getStrategies({ id: strategyid })
                if (response2 && response2[0] && Array.isArray(response2[0].option_trades)) {
                response2[0].option_trades = response2[0].option_trades.filter(trade => trade !== tradeDetails.tradeid);
                await updateStrategy(response2[0])
                }
            }
        } else {
            setShowTradeDeleteConfirmPopup(false)
            setShowTradeFailedAlertPopup(true)
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
                                    value={tradeDetails.asset || ""}
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
                                        <MenuItem value="LONG">Long</MenuItem>
                                        <MenuItem value="SHORT">Short</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <TextField
                                    label="Trade Quantity"
                                    name="quantity"
                                    value={tradeDetails.quantity ?? ""}
                                    disabled
                                    fullWidth
                                />
                                <TextField
                                    label="Entry Average Price"
                                    name="entryprice"
                                    value={tradeDetails.entryprice ?? ""}
                                    disabled
                                    fullWidth
                                />
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <TextField
                                    label="Entry Date"
                                    name="entrydate"
                                    value={tradeDetails.entrydate || ""}
                                    disabled
                                    fullWidth
                                />
                                <TextField
                                    label="Open Quantity"
                                    name="openquantity"
                                    value={tradeDetails.openquantity ?? ""}
                                    disabled
                                    fullWidth
                                />
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <TextField
                                    label="Closed Quantity"
                                    name="closedquantity"
                                    value={tradeDetails.closedquantity ?? ""}
                                    disabled
                                    fullWidth
                                />
                                <TextField
                                    label="Exit Average Price"
                                    name="exitaverageprice"
                                    value={tradeDetails.exitaverageprice ?? ""}
                                    disabled
                                    fullWidth
                                />
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <TextField
                                    label="Capital Used"
                                    name="capitalused"
                                    value={tradeDetails.capitalused ?? ""}
                                    disabled
                                    fullWidth
                                />
                                <TextField
                                    label="Overall Return"
                                    name="overallreturn"
                                    value={tradeDetails.overallreturn ?? ""}
                                    disabled
                                    fullWidth
                                />
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <TextField
                                    label="Status"
                                    name="status"
                                    value={tradeDetails.status || ""}
                                    disabled
                                    fullWidth
                                />
                                <TextField
                                    label="Last Traded Price"
                                    name="ltp"
                                    type="number"
                                    value={tradeDetails.ltp ?? ""}
                                    onChange={handleTextChange}
                                    inputProps={{ step: "0.01", min: "0" }}
                                    fullWidth
                                />
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <TextField
                                    label="Tags"
                                    name="tags"
                                    value={tradeDetails.tags || ""}
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
                            value={tradeDetails.notes || ""}
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

export { StockTradeForm };