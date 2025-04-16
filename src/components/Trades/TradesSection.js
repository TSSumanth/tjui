import React, { useState } from "react";
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
    IconButton,
    Chip,
    LinearProgress
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
    const [selectedDataType, setSelectedDataType] = useState("All Trades");
    const [showStockTradeForm, setShowStockTradeForm] = useState(false);
    const [showOptionTradeForm, setShowOptionTradeForm] = useState(false);
    const [showCreateStrategyPopup, setShowCreateStrategyPopup] = useState(false);
    const [updateTradeDetails, setUpdateTradeDetails] = useState(null);
    const [showTradeFailedAlertPopup, setShowTradeFailedAlertPopup] = useState(false);

    // Fetch trades based on filter
    const fetchTrades = async (filter) => {
        const stockTrades = await getStockTrades(filter);
        const optionTrades = await getOptionTrades(filter);
        setSelectedData([...stockTrades, ...optionTrades]);
    };

    // Handle trade type selection
    const handleTradeTypeClick = async (tradeType) => {
        setSelectedDataType(tradeType.title);
        if (tradeType.filter) {
            await fetchTrades(tradeType.filter);
        } else {
            await fetchTrades({ status: tradeType.status });
        }
    };

    // Handle trade update
    const clickOnUpdateTrade = (tradedetails) => {
        setUpdateTradeDetails(tradedetails);
    };

    // Handle trade submission
    const handleSubmitTrade = async (tradeDetails, isStock, isUpdate = false) => {
        const tradeFunction = isStock ? (isUpdate ? updateStockTrade : addNewStockTrade) : (isUpdate ? updateOptionTrade : addNewOptionTrade);
        const response = await tradeFunction(tradeDetails);
        if (response?.created) {
            if (isUpdate) {
                setUpdateTradeDetails(null);
            } else {
                setShowStockTradeForm(false);
                setShowOptionTradeForm(false);
            }
        } else {
            setShowTradeFailedAlertPopup(true);
        }
        await fetchTrades(selectedDataType);
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
            {selectedData && selectedData.length > 0 ? (
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
            <Dialog open={!!showStockTradeForm} onClose={() => setShowStockTradeForm(false)} maxWidth="md" fullWidth>
                <StockTradeForm
                    title='New Stock Trade'
                    buttonText='Submit'
                    onSubmit={(details) => handleSubmitTrade(details, true)}
                    onCancel={() => setShowStockTradeForm(false)}
                />
            </Dialog>

            <Dialog open={!!showOptionTradeForm} onClose={() => setShowOptionTradeForm(false)} maxWidth="md" fullWidth>
                <OptionTradeForm
                    title='New Option Trade'
                    buttonText='Submit'
                    onSubmit={(details) => handleSubmitTrade(details, false)}
                    onCancel={() => setShowOptionTradeForm(false)}
                />
            </Dialog>

            <Dialog open={!!updateTradeDetails} onClose={() => setUpdateTradeDetails(null)} maxWidth="md" fullWidth>
                {updateTradeDetails?.lotsize === undefined ? (
                    <StockTradeForm
                        title='Update Stock Trade'
                        buttonText='Submit'
                        onSubmit={(details) => handleSubmitTrade(details, true, true)}
                        onCancel={() => setUpdateTradeDetails(null)}
                        isUpdate={true}
                        currentTrade={updateTradeDetails}
                    />
                ) : (
                    <OptionTradeForm
                        title='Update Option Trade'
                        buttonText='Submit'
                        onSubmit={(details) => handleSubmitTrade(details, false, true)}
                        onCancel={() => setUpdateTradeDetails(null)}
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