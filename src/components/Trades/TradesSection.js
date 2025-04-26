import React, { useState, useEffect } from "react";
import {
    Button,
    Typography,
    Box,
    Stack,
    Card,
    CardContent,
    Dialog,
    Divider,
    Grid,
    Paper,
    Tooltip,
    Chip,
    CircularProgress,
} from "@mui/material";
import { addNewStockTrade, getStockTrades, updateStockTrade, addNewOptionTrade, getOptionTrades, updateOptionTrade } from "../../services/trades.js";
import { AlertPopup } from "../Generic/Popup.jsx";
import { CreateStrategy } from "../Strategies/CreateStrategyPopup.jsx";
import { StockTradeForm } from "./StockTradeForm.jsx";
import OptionTradeForm from "./OptionTradeForm.jsx";
import TradesTable from "./TradesTable";
import AddIcon from '@mui/icons-material/Add';
import CreateIcon from '@mui/icons-material/Create';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';

// Constants for trade options
const TRADE_OPTIONS = [
    {
        title: "Open Trades",
        icon: <LockOpenIcon sx={{ fontSize: 40 }} />,
        status: "OPEN",
        description: "View all currently open trades",
        color: "warning",
        gradient: "linear-gradient(45deg, #FF9800 30%, #FFB74D 90%)"
    },
    {
        title: "Closed Trades",
        icon: <LockIcon sx={{ fontSize: 40 }} />,
        status: "CLOSED",
        description: "View all completed trades",
        color: "info",
        gradient: "linear-gradient(45deg, #2196F3 30%, #64B5F6 90%)"
    },
    {
        title: "Loss Trades",
        icon: <TrendingDownIcon sx={{ fontSize: 40 }} />,
        filter: { maximumreturn: 0, status: "CLOSED" },
        description: "View trades that resulted in losses",
        color: "error",
        gradient: "linear-gradient(45deg, #F44336 30%, #E57373 90%)"
    },
    {
        title: "Profitable Trades",
        icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
        filter: { minimumreturn: 0, status: "CLOSED" },
        description: "View trades that resulted in profits",
        color: "success",
        gradient: "linear-gradient(45deg, #4CAF50 30%, #81C784 90%)"
    },
];

// Constants for table columns configuration
const TABLE_COLUMNS = {
    OPEN_TRADES: {
        columns: ["asset", "tradetype", 'quantity', 'openquantity', 'entryprice', 'exitaverageprice', 'entrydate', 'lastmodifieddate'],
        aliases: {
                    "asset": "Asset Name",
                    "tradetype": "Trade Type",
                    "quantity": "Total Quantity",
                    "openquantity": "Open Quantity",
                    "entryprice": "Entry Price",
                    "entrydate": "Entry Date",
                    'exitaverageprice': "Exit Avg. Price",
                    "lastmodifieddate": "Last Modified Date",
        }
    },
    CLOSED_TRADES: {
        columns: ["asset", "tradetype", 'quantity', 'entryprice', 'entrydate', 'finalexitprice', "exitdate", "overallreturn"],
        aliases: {
                    "asset": "Asset Name",
                    "tradetype": "Trade Type",
                    "quantity": "Total Quantity",
                    "entryprice": "Entry Price",
                    "entrydate": "Entry Date",
                    "exitdate": "Exit Date",
                    'finalexitprice': "Exit Price",
                    "overallreturn": "Return"
        }
    },
    PROFITABLE_TRADES: {
        columns: ["asset", "tradetype", 'quantity', 'entryprice', 'entrydate', 'finalexitprice', "exitdate", "overallreturn", 'status'],
        aliases: {
                    "asset": "Asset Name",
                    "tradetype": "Trade Type",
                    "quantity": "Total Quantity",
                    "entryprice": "Entry Price",
                    "entrydate": "Entry Date",
                    "status": "Current Status",
                    "exitdate": "Exit Date",
                    'finalexitprice': "Exit Price",
                    "overallreturn": "Return"
        }
    },
    LOSS_TRADES: {
        columns: ["asset", "tradetype", 'quantity', 'openquantity', 'entryprice', 'entrydate', 'finalexitprice', "exitdate", "overallreturn", 'status'],
        aliases: {
                    "asset": "Asset Name",
                    "tradetype": "Trade Type",
                    "quantity": "Total Quantity",
                    "entryprice": "Entry Price",
                    "entrydate": "Entry Date",
                    "status": "Current Status",
                    "exitdate": "Exit Date",
                    'finalexitprice': "Exit Price",
                    "overallreturn": "Return"
        }
    }
};

function TradeTypeSection() {
    // State management
    const [selectedData, setSelectedData] = useState([]);
    const [selectedDataType, setSelectedDataType] = useState("Open Trades");
    const [showStockTradeForm, setShowStockTradeForm] = useState(false);
    const [showOptionTradeForm, setShowOptionTradeForm] = useState(false);
    const [showCreateStrategyPopup, setShowCreateStrategyPopup] = useState(false);
    const [updateTradeDetails, setUpdateTradeDetails] = useState(null);
    const [showTradeFailedAlertPopup, setShowTradeFailedAlertPopup] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch trades based on filter
    const fetchTrades = async (filter, tradeType) => {
        setIsLoading(true);
        try {
            console.log('Fetching trades with filter:', filter, 'tradeType:', tradeType);
            // Fetch both stock and option trades in parallel
            const [stockTrades, optionTrades] = await Promise.all([
                getStockTrades(filter),
                getOptionTrades(filter)
            ]);

            console.log('Received stock trades:', stockTrades);
            console.log('Received option trades:', optionTrades);

            // Combine and format the trades
            const combinedTrades = [
                ...(Array.isArray(stockTrades) ? stockTrades : []).map(trade => ({
                    ...trade,
                    tradetype: trade.tradetype || 'LONG',
                    status: trade.status?.toUpperCase() || 'OPEN'  // Ensure status is uppercase
                })),
                ...(Array.isArray(optionTrades) ? optionTrades : []).map(trade => ({
                    ...trade,
                    tradetype: trade.tradetype || 'LONG',
                    status: trade.status?.toUpperCase() || 'OPEN'  // Ensure status is uppercase
                }))
            ];

            console.log('Combined trades before filtering:', combinedTrades);

            // Apply additional frontend filtering based on the trade type
            let filteredTrades = combinedTrades;
            if (tradeType === "Open Trades") {
                filteredTrades = combinedTrades.filter(trade => {
                    const isOpen = trade.status === "OPEN";
                    console.log(`Trade ${trade.tradeid}: status=${trade.status}, isOpen=${isOpen}`);
                    return isOpen;
                });
            } else if (tradeType === "Closed Trades") {
                filteredTrades = combinedTrades.filter(trade => {
                    const isClosed = trade.status === "CLOSED";
                    console.log(`Trade ${trade.tradeid}: status=${trade.status}, isClosed=${isClosed}`);
                    return isClosed;
                });
            } else if (tradeType === "Loss Trades") {
                filteredTrades = combinedTrades.filter(trade => {
                    const isLoss = trade.status === "CLOSED" && (trade.overallreturn || 0) < 0;
                    console.log(`Trade ${trade.tradeid}: status=${trade.status}, return=${trade.overallreturn}, isLoss=${isLoss}`);
                    return isLoss;
                });
            } else if (tradeType === "Profitable Trades") {
                filteredTrades = combinedTrades.filter(trade => {
                    const isProfit = trade.status === "CLOSED" && (trade.overallreturn || 0) > 0;
                    console.log(`Trade ${trade.tradeid}: status=${trade.status}, return=${trade.overallreturn}, isProfit=${isProfit}`);
                    return isProfit;
                });
            }

            console.log('Filtered trades:', filteredTrades);

            // Sort trades by entry date (newest first)
            const sortedTrades = filteredTrades.sort((a, b) => {
                const dateA = new Date(a.entrydate || 0);
                const dateB = new Date(b.entrydate || 0);
                return dateB - dateA;
            });

            setSelectedData(sortedTrades);
        } catch (error) {
            console.error('Error fetching trades:', error);
            setSelectedData([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch open trades when component mounts
    useEffect(() => {
        fetchTrades({ status: "OPEN" }, "Open Trades");
    }, []);

    // Handle trade type selection
    const handleTradeTypeClick = async (tradeType) => {
        const newSelectedType = tradeType.title;
        setSelectedDataType(newSelectedType);

        let filter = {};
        if (newSelectedType === "Open Trades") {
            filter = { status: "OPEN" };
        } else if (newSelectedType === "Closed Trades") {
            filter = { status: "CLOSED" };
        } else if (newSelectedType === "Loss Trades") {
            filter = { status: "CLOSED", maximumreturn: 0 };
        } else if (newSelectedType === "Profitable Trades") {
            filter = { status: "CLOSED", minimumreturn: 0 };
        }

        await fetchTrades(filter, newSelectedType);
    };

    // Handle dialog close
    const handleDialogClose = (event, reason) => {
        // Prevent closing on backdrop click and escape key
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
            return;
        }
        setUpdateTradeDetails(null);
    };

    // Handle trade update
    const clickOnUpdateTrade = (tradedetails) => {
        setUpdateTradeDetails(tradedetails);
    };

    // Handle trade submission
    const handleSubmitTrade = async (tradeDetails, isStock, isUpdate = false, isDelete = false) => {
        let response = { created: false };
        if (!isDelete) {
            const tradeFunction = isStock ? (isUpdate ? updateStockTrade : addNewStockTrade) : (isUpdate ? updateOptionTrade : addNewOptionTrade);
            response = await tradeFunction(tradeDetails);
        }
        if (response?.created || response?.tradeid || isDelete) {
            if (isUpdate) {
                setUpdateTradeDetails(null);
            } else {
                setShowStockTradeForm(false);
                setShowOptionTradeForm(false);
            }
            // Maintain the current filter state when refreshing trades
            if (selectedDataType === "Open Trades") {
                await fetchTrades({ status: "OPEN" }, "Open Trades");
            } else if (selectedDataType === "Closed Trades") {
                await fetchTrades({ status: "CLOSED" }, "Closed Trades");
            } else if (selectedDataType === "Profitable Trades") {
                await fetchTrades({ minimumreturn: 0 }, "Profitable Trades");
            } else if (selectedDataType === "Loss Trades") {
                await fetchTrades({ maximumreturn: 0 }, "Loss Trades");
            } else {
                await fetchTrades({}, selectedDataType);
            }
        } else {
            setShowTradeFailedAlertPopup(true);
        }
    };

    // Get table configuration based on selected type
    const getTableConfig = (type) => {
        switch (type) {
            case "Open Trades":
                return TABLE_COLUMNS.OPEN_TRADES;
            case "Closed Trades":
                return TABLE_COLUMNS.CLOSED_TRADES;
            case "Profitable Trades":
                return TABLE_COLUMNS.PROFITABLE_TRADES;
            case "Loss Trades":
                return TABLE_COLUMNS.LOSS_TRADES;
            default:
                return TABLE_COLUMNS.OPEN_TRADES;
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* Action Buttons Section */}
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="h6" color="primary" sx={{ flexGrow: 1 }}>
                        Trade Management
                    </Typography>
                    <Tooltip title="Add a new stock trade">
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={() => setShowStockTradeForm(true)}
                        >
                            Add Stock Trade
                        </Button>
                    </Tooltip>
                    <Tooltip title="Add a new option trade">
                        <Button
                            variant="contained"
                            color="secondary"
                            startIcon={<AddIcon />}
                            onClick={() => setShowOptionTradeForm(true)}
                        >
                            Add Option Trade
                        </Button>
                    </Tooltip>
                    <Tooltip title="Create a new trading strategy">
                        <Button
                            variant="contained"
                            startIcon={<CreateIcon />}
                            onClick={() => setShowCreateStrategyPopup(true)}
                        >
                            Create Strategy
                        </Button>
                    </Tooltip>
            </Stack>
            </Paper>

            <Divider sx={{ my: 2 }} />

            {/* Trade Type Cards Section */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                {TRADE_OPTIONS.map((option, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <Tooltip title={option.description}>
                            <Card
                                onClick={() => handleTradeTypeClick(option)}
                                sx={{
                                    cursor: "pointer",
                                    height: '100%',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    background: option.gradient,
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 3,
                                    }
                                }}
                            >
                                <CardContent sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    color: 'white',
                                    p: 3
                                }}>
                                    <Box sx={{ mb: 2 }}>
                                        {option.icon}
                                    </Box>
                                    <Typography variant="h5" align="center" sx={{ mb: 1, fontWeight: 'bold' }}>
                                        {option.title}
                                    </Typography>
                                    <Typography variant="body2" align="center" sx={{ opacity: 0.9 }}>
                                        {option.description}
                                    </Typography>
                                    <Chip
                                        label={option.status || (option.title === "Loss Trades" ? "LOSS" : "PROFIT")}
                                        color={option.color}
                                        sx={{
                                            mt: 2,
                                            color: 'white',
                                            fontWeight: 'bold',
                                            backgroundColor: 'rgba(255, 255, 255, 0.2)'
                                        }}
                                    />
                                </CardContent>
                            </Card>
                        </Tooltip>
                    </Grid>
                ))}
            </Grid>

            {/* Trades Table Section */}
            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                    <CircularProgress />
                </Box>
            ) : selectedData && selectedData.length > 0 ? (
                <TradesTable
                    data={selectedData}
                    includeColumns={getTableConfig(selectedDataType).columns}
                    columnAliases={getTableConfig(selectedDataType).aliases}
                    updateTrade={clickOnUpdateTrade}
                />
            ) : (
                <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary">
                        No trades available for {selectedDataType}
                    </Typography>
                </Paper>
            )}

            {/* Dialogs */}
            <Dialog
                open={!!showStockTradeForm}
                onClose={() => setShowStockTradeForm(false)}
                maxWidth="md"
                fullWidth
                disableEscapeKeyDown
            >
                <StockTradeForm
                    title='New Stock Trade'
                    buttonText='Submit'
                    onSubmit={(details) => handleSubmitTrade(details, true)}
                    onCancel={() => setShowStockTradeForm(false)}
                />
            </Dialog>

            <Dialog
                open={!!showOptionTradeForm}
                onClose={() => setShowOptionTradeForm(false)}
                maxWidth="md"
                fullWidth
                disableEscapeKeyDown
            >
                <OptionTradeForm
                    title='New Option Trade'
                    buttonText='Submit'
                    onSubmit={(details) => handleSubmitTrade(details, false)}
                    onCancel={() => setShowOptionTradeForm(false)}
                />
            </Dialog>

            <Dialog
                open={!!updateTradeDetails}
                onClose={handleDialogClose}
                maxWidth="md"
                fullWidth
                disableEscapeKeyDown
            >
                {updateTradeDetails?.lotsize === undefined ? (
                    <StockTradeForm
                        title='Update Stock Trade'
                        buttonText='Update'
                        onSubmit={(details) => handleSubmitTrade(details, true, true)}
                        onCancel={handleDialogClose}
                        isUpdate={true}
                        currentTrade={updateTradeDetails}
                    />
                ) : (
                    <OptionTradeForm
                        title='Update Option Trade'
                        buttonText='Update'
                        onSubmit={(details) => handleSubmitTrade(details, false, true)}
                        onCancel={handleDialogClose}
                        isUpdate={true}
                        currentTrade={updateTradeDetails}
                    />
                )}
            </Dialog>

            {/* Alert and Strategy Popups */}
            {showTradeFailedAlertPopup && (
                <AlertPopup
                    trigger={showTradeFailedAlertPopup}
                    onConfirm={() => setShowTradeFailedAlertPopup(false)}
                    message="Unable to Create Trade."
                />
            )}
            {showCreateStrategyPopup && (
                <CreateStrategy
                    title='Create Strategy'
                    onSubmit={() => setShowCreateStrategyPopup(false)}
                    onCancel={() => setShowCreateStrategyPopup(false)}
                />
            )}
        </Box>
    );
}

export default TradeTypeSection;