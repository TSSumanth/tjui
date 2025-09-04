import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    Box,
    Button,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    Grid,
    Card,
    CardContent,
    Divider,
    Tab,
    Tabs,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TableContainer,
    Table,
    TextField,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Snackbar,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    Stack,
    LinearProgress,
} from "@mui/material";
import { getStrategies, updateStrategy, getStrategyNotes, deleteStrategy, getOpenStrategies, addStrategyNote } from "../../services/strategies";
import { getStockTradesbyId, getOptionTradesbyId, addNewStockTrade, updateStockTrade, addNewOptionTrade, updateOptionTrade } from "../../services/trades";
import { addActionItem, getActionItems } from "../../services/actionitems";
import { StockTradeForm } from "../Trades/StockTradeForm";
import OptionTradeForm from "../Trades/OptionTradeForm";
import NotesTable from "./NotesTable";
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import { CreateActionItem } from "../ActionItems/ActionModelPopup";
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import SyncIcon from '@mui/icons-material/Sync';
import EditIcon from '@mui/icons-material/Edit';
import { calculateBreakEven } from '../../utils/breakEvenCalculator';
import { fetchLTPs } from '../../services/zerodha/api';

const TABLE_STYLES = {
    container: {
        padding: 2,
        borderRadius: 2,
        boxShadow: 3,
        width: '100%',
        overflowX: 'auto'
    },
    header: {
        backgroundColor: "primary.light",
        '& th': {
            fontWeight: 'bold',
            color: 'primary.contrastText',
            whiteSpace: 'nowrap'
        }
    },
    row: {
        cursor: 'pointer',
        '&:hover': {
            backgroundColor: 'action.hover'
        }
    },
    selectedRow: {
        backgroundColor: 'primary.light',
        '&:hover': {
            backgroundColor: 'primary.light'
        }
    },
    evenRow: {
        backgroundColor: 'background.default'
    },
    oddRow: {
        backgroundColor: 'background.paper'
    }
};

function UpdateStrategy({ id }) {
    // const { sessionActive, holdings, positions } = useZerodha();
    const [strategy, setStrategy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stockTrades, setStockTrades] = useState([]);
    const [optionTrades, setOptionTrades] = useState([]);
    const [notes, setNotes] = useState([]);
    const [activeTab, setActiveTab] = useState(0);
    const [showCreateStockTrade, setShowCreateStockTrade] = useState(false);
    const [showCreateOptionTrade, setShowCreateOptionTrade] = useState(false);
    const [showUpdateTrade, setShowUpdateTrade] = useState(false);
    const [selectedTrade, setSelectedTrade] = useState(null);
    const [nameError, setNameError] = useState("");
    const [showLTPDialog, setShowLTPDialog] = useState(false);
    const [plSummary, setPlSummary] = useState({
        realizedPL: 0,
        unrealizedPL: 0,
        expenses: 0,
        hasAllLTP: true
    });
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState(null);
    const [selectedTradeForMenu, setSelectedTradeForMenu] = useState(null);
    const [showActionItemPopup, setShowActionItemPopup] = useState(false);
    const [selectedTradeForAction, setSelectedTradeForAction] = useState(null);
    const [tradeActionItems, setTradeActionItems] = useState({});
    const [isFetchingZerodhaLTP, setIsFetchingZerodhaLTP] = useState(false);
    const [showZerodhaConfirmDialog, setShowZerodhaConfirmDialog] = useState(false);
    const [syncProgress, setSyncProgress] = useState({
        total: 0,
        current: 0,
        status: 'idle' // 'idle' | 'syncing' | 'complete'
    });
    const navigate = useNavigate();
    const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
    const [openStrategies, setOpenStrategies] = useState([]);
    const [showRemoveTradeConfirmDialog, setShowRemoveTradeConfirmDialog] = useState(false);
    const [tradeToRemove, setTradeToRemove] = useState(null);
    const [breakEvenPoints, setBreakEvenPoints] = React.useState(null);
    const [showAddNoteDialog, setShowAddNoteDialog] = useState(false);
    const [newNoteContent, setNewNoteContent] = useState('');

    const hasOpenTradesWithZeroLTP = React.useMemo(() => {
        const openTrades = [...stockTrades, ...optionTrades].filter(trade => trade.status === 'OPEN');
        return openTrades.some(trade => !trade.ltp || parseFloat(trade.ltp) === 0 || parseFloat(trade.ltp) === 0.00);
    }, [stockTrades, optionTrades]);

    const fetchNotes = useCallback(async (strategyId) => {
        try {
            const notesData = await getStrategyNotes(strategyId);
            setNotes(notesData);
        } catch (error) {
            console.error("Error fetching notes:", error);
            setError("Failed to load notes data.");
        }
    }, []);

    const fetchTrades = useCallback(async () => {
        if (!strategy) {
            return;
        }

        try {
            const stockTradeIds = Array.isArray(strategy.stock_trades) ? strategy.stock_trades : [];
            const optionTradeIds = Array.isArray(strategy.option_trades) ? strategy.option_trades : [];


            let stockTradesData = [];
            let optionTradesData = [];
            let overallReturn = 0;

            if (stockTradeIds.length > 0) {
                stockTradesData = await getStockTradesbyId(stockTradeIds);
                if (Array.isArray(stockTradesData)) {
                    overallReturn += stockTradesData.reduce((sum, trade) => sum + (Number(trade.return) || 0), 0);
                }
            }

            if (optionTradeIds.length > 0) {
                optionTradesData = await getOptionTradesbyId(optionTradeIds);
                if (Array.isArray(optionTradesData)) {
                    overallReturn += optionTradesData.reduce((sum, trade) => sum + (Number(trade.return) || 0), 0);
                }
            }

            // Format dates for all trades
            const formatTrades = (trades) => {
                if (!Array.isArray(trades)) return [];
                return trades.map(trade => {
                    const formatDate = (dateString) => {
                        if (!dateString) return null;
                        try {
                            // First try parsing as ISO string
                            const date = new Date(dateString);
                            if (!isNaN(date.getTime())) {
                                return moment(date).format('YYYY-MM-DD HH:mm:ss');
                            }
                            return null;
                        } catch (error) {
                            console.error('Invalid date format:', dateString);
                            return null;
                        }
                    };

                    return {
                        ...trade,
                        entrydate: formatDate(trade.entrydate),
                        exitdate: formatDate(trade.exitdate),
                        lastmodifieddate: formatDate(trade.lastmodifieddate),
                        return: Number(trade.return) || 0,
                        overallreturn: Number(trade.overallreturn) || 0
                    };
                });
            };

            const formattedStockTrades = formatTrades(stockTradesData || []);
            const formattedOptionTrades = formatTrades(optionTradesData || []);

            setStockTrades(formattedStockTrades);
            setOptionTrades(formattedOptionTrades);
        } catch (error) {
            console.error('Error fetching trades:', error);
            setError('Failed to fetch trades. Please try again later.');
        }
    }, [strategy]);

    const fetchStrategy = useCallback(async () => {
        if (!id) {
            setError("No strategy ID provided");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            // Get strategy by ID
            const response = await getStrategies({ id });

            if (response) {
                // Handle both array and single object responses
                const strategyData = Array.isArray(response) ? response[0] : response;

                if (strategyData && strategyData.id) {

                    // Ensure trades are arrays
                    if (!Array.isArray(strategyData.stock_trades)) {
                        strategyData.stock_trades = [];
                    }
                    if (!Array.isArray(strategyData.option_trades)) {
                        strategyData.option_trades = [];
                    }

                    setStrategy(strategyData);
                } else {
                    setError("Strategy not found");
                }
            } else {
                setError("No response from server");
            }
        } catch (error) {
            console.error('Error fetching strategy:', error);
            setError("Failed to load strategy data");
        } finally {
            setLoading(false);
        }
    }, [id]);

    const handleTradeClick = (trade) => {
        setSelectedTrade(trade);
        setShowUpdateTrade(true);
    };

    const handleUpdateTrade = async (updatedTrade) => {
        try {
            const response = updatedTrade.lotsize === undefined
                ? await updateStockTrade(updatedTrade)
                : await updateOptionTrade(updatedTrade);

            if (response) {
                await fetchTrades();
                setShowUpdateTrade(false);
            }
        } catch (error) {
            console.error('Error updating trade:', error);
            setError("Failed to update trade.");
        }
    };

    const handleSubmitTrade = async (tradeDetails, isStock) => {
        try {
            const response = isStock
                ? await addNewStockTrade({ ...tradeDetails, strategy_id: id })
                : await addNewOptionTrade({ ...tradeDetails, strategy_id: id });


            if (response?.tradeid) {
                // Create a new array of trade IDs
                const updatedStrategy = {
                    ...strategy,
                    [isStock ? 'stock_trades' : 'option_trades']: [
                        ...(Array.isArray(strategy[isStock ? 'stock_trades' : 'option_trades'])
                            ? strategy[isStock ? 'stock_trades' : 'option_trades']
                            : []),
                        response.tradeid
                    ]
                };

                // Update the strategy in the database
                const updateResponse = await updateStrategy(updatedStrategy);

                if (updateResponse) {
                    // Fetch the updated strategy to ensure we have the latest data
                    const refreshedStrategy = await getStrategies({ id });
                    const strategyData = Array.isArray(refreshedStrategy) ? refreshedStrategy[0] : refreshedStrategy;

                    if (strategyData) {
                        setStrategy(strategyData);
                        await fetchTrades();
                    }

                    isStock ? setShowCreateStockTrade(false) : setShowCreateOptionTrade(false);
                } else {
                    setError("Failed to update strategy with new trade");
                }
            } else {
                setError("Failed to create trade");
            }
        } catch (error) {
            console.error("Error creating trade:", error);
            setError("Failed to create trade: " + error.message);
        }
    };

    const handleNameChange = (event) => {
        const newName = event.target.value.trim();
        setNameError(newName === strategy?.name ? "Strategy name is already in use" : "");

        setStrategy((prev) => ({
            ...prev,
            name: newName,
        }));
    };

    const handleStatusChange = (event) => {
        setStrategy((prev) => ({
            ...prev,
            status: event.target.value,
        }));
    };

    const handleExpensesChange = (event) => {
        setStrategy((prev) => ({
            ...prev,
            expenses: parseFloat(event.target.value) || 0,
        }));
    };

    const handleUpdateStrategy = async () => {
        try {
            // Include P/L values in the strategy update
            const updatedStrategy = {
                ...strategy,
                realized_pl: plSummary.realizedPL,
                unrealized_pl: plSummary.unrealizedPL,
                expenses: strategy.expenses || 0,
                symbol_ltp: strategy.symbol_ltp !== undefined ? strategy.symbol_ltp : ''
            };

            await updateStrategy(updatedStrategy);
            await fetchTrades();
            setSnackbar({
                open: true,
                message: 'Strategy updated successfully!',
                severity: 'success'
            });
        } catch (error) {
            console.error("Strategy update failed:", error);
            setSnackbar({
                open: true,
                message: 'Failed to update strategy. Please try again.',
                severity: 'error'
            });
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    const calculateUnrealizedPL = useCallback((trade) => {
        if (!trade || trade.status !== 'OPEN' || !trade.ltp || !trade.openquantity) return 0;

        const ltp = parseFloat(trade.ltp);
        // Return 0 if LTP is 0 or 0.00
        if (ltp === 0 || ltp === 0.00) return 0;

        const quantity = parseInt(trade.openquantity);
        const entryPrice = parseFloat(trade.entryprice);

        // For options, quantity is already adjusted with lot size in the database
        // So we don't need to multiply by lot size here
        if (trade.tradetype === 'LONG') {
            return quantity * (ltp - entryPrice);
        } else {
            return quantity * (entryPrice - ltp);
        }
    }, []);

    const checkAllTradesHaveLTP = useCallback(() => {
        const openStockTrades = stockTrades.filter(trade => trade.status === 'OPEN');
        const openOptionTrades = optionTrades.filter(trade => trade.status === 'OPEN');

        const allTradesHaveLTP = [...openStockTrades, ...openOptionTrades]
            .every(trade => trade.ltp && trade.ltp !== '');

        return allTradesHaveLTP;
    }, [stockTrades, optionTrades]);

    const calculatePLSummary = useCallback(() => {
        let realizedPL = 0;
        let unrealizedPL = 0;
        const hasAllLTP = checkAllTradesHaveLTP();
        const expenses = parseFloat(strategy?.expenses || 0);

        // Realized P/L: sum of overallreturn for all trades (open and closed)
        stockTrades.forEach(trade => {
            realizedPL += parseFloat(trade.overallreturn || 0);
        });
        optionTrades.forEach(trade => {
            realizedPL += parseFloat(trade.overallreturn || 0);
        });

        // Unrealized P/L: only for open trades with LTP
        stockTrades.forEach(trade => {
            if (trade.status === 'OPEN' && hasAllLTP) {
                unrealizedPL += calculateUnrealizedPL(trade);
            }
        });
        optionTrades.forEach(trade => {
            if (trade.status === 'OPEN' && hasAllLTP) {
                unrealizedPL += calculateUnrealizedPL(trade);
            }
        });

        // Update local state
        setPlSummary({
            realizedPL,
            unrealizedPL,
            expenses,
            hasAllLTP
        });

        // Update strategy with new P/L values
        if (strategy && (strategy.realized_pl !== realizedPL || strategy.unrealized_pl !== unrealizedPL)) {
            setStrategy(prev => ({
                ...prev,
                realized_pl: realizedPL,
                unrealized_pl: unrealizedPL
            }));
        }

        // Calculate break-even points after P/L summary is updated
        const calculateBreakEvenPoints = async () => {
            if (!strategy?.symbol_ltp) {
                setBreakEvenPoints(null);
                return;
            }

            const openOptionAndFutureTrades = optionTrades
                .filter(trade => trade.status === 'OPEN' && (
                    trade.asset.endsWith('CE') ||
                    trade.asset.endsWith('PE') ||
                    trade.asset.endsWith('FUT')
                ))
                .map(trade => ({
                    instrument_type: trade.asset,
                    price: parseFloat(trade.entryprice),
                    quantity: parseInt(trade.openquantity),
                    position: trade.tradetype === 'LONG' ? 'BUY' : 'SELL',
                    lot_size: trade.lotsize ? parseInt(trade.lotsize) : 0
                }));

            if (openOptionAndFutureTrades.length === 0) {
                setBreakEvenPoints(null);
                return;
            }

            try {
                const result = await calculateBreakEven({
                    current_price: parseFloat(strategy.symbol_ltp),
                    manual_pl: realizedPL,
                    options: openOptionAndFutureTrades
                });
                setBreakEvenPoints(result);
            } catch (error) {
                console.error('Error calculating break-even points:', error);
                setBreakEvenPoints(null);
            }
        };

        calculateBreakEvenPoints();
    }, [stockTrades, optionTrades, calculateUnrealizedPL, checkAllTradesHaveLTP, strategy]);

    const sortTrades = useCallback((trades) => {
        return [...trades].sort((a, b) => {
            // First sort by status (OPEN first)
            if (a.status === 'OPEN' && b.status !== 'OPEN') return -1;
            if (a.status !== 'OPEN' && b.status === 'OPEN') return 1;

            // Then sort by entry date (newest first)
            const dateA = new Date(a.entrydate);
            const dateB = new Date(b.entrydate);
            return dateB - dateA;
        });
    }, []);

    const handleActionMenuClick = (event, trade) => {
        setActionMenuAnchorEl(event.currentTarget);
        setSelectedTradeForMenu(trade);
    };

    const handleActionMenuClose = () => {
        setActionMenuAnchorEl(null);
        setSelectedTradeForMenu(null);
    };

    const handleCreateActionItem = () => {
        if (selectedTradeForMenu) {
            setSelectedTradeForAction(selectedTradeForMenu);
            setShowActionItemPopup(true);
        }
        handleActionMenuClose();
    };

    const handleSaveActionItem = async (actionItem) => {
        try {
            await addActionItem(actionItem);
            setSnackbar({
                open: true,
                message: 'Action item created successfully',
                severity: 'success'
            });
            setShowActionItemPopup(false);
        } catch (error) {
            console.error('Error creating action item:', error);
            setSnackbar({
                open: true,
                message: 'Failed to create action item',
                severity: 'error'
            });
        }
    };

    // const handleGetLTPFromZerodha = async () => {
    //     if (!sessionActive) {
    //         setSnackbar({
    //             open: true,
    //             message: 'No active session available for Zerodha. Please connect to Zerodha and try again.',
    //             severity: 'error'
    //         });
    //         return;
    //     }

    //     setShowZerodhaConfirmDialog(true);
    // };

    const handleConfirmZerodhaSync = async () => {
        setShowZerodhaConfirmDialog(false);
        setIsFetchingZerodhaLTP(true);
        setSyncProgress({ total: 0, current: 0, status: 'syncing' });

        try {
            // if (!sessionActive) {
            //     throw new Error('No active Zerodha session');
            // }

            const openStockTrades = stockTrades.filter(trade => trade.status === 'OPEN');
            const openOptionTrades = optionTrades.filter(trade => trade.status === 'OPEN');
            const totalTrades = openStockTrades.length + openOptionTrades.length;
            setSyncProgress(prev => ({ ...prev, total: totalTrades }));

            // Create instruments array for LTP fetch
            const updatedStockTrades = [];
            const updatedOptionTrades = [];

            // Process stock trades one by one
            for (const trade of openStockTrades) {
                if (trade.symbol) {
                    const instrument = {
                        exchange: 'NSE',
                        tradingsymbol: trade.symbol
                    };

                    try {
                        const ltpMap = await fetchLTPs([instrument]);

                        const ltp = ltpMap[trade.symbol];
                        if (ltp) {
                            const updatedTrade = {
                                ...trade,
                                ltp: ltp.toString()
                            };
                            const unrealizedPL = calculateUnrealizedPL(updatedTrade);
                            updatedTrade.unrealizedpl = unrealizedPL;
                            updatedStockTrades.push(updatedTrade);
                        }
                    } catch (err) {
                        console.error('Error fetching LTP for stock:', trade.symbol, err);
                    }
                }
                setSyncProgress(prev => ({ ...prev, current: prev.current + 1 }));
            }

            // Process option trades one by one
            for (const trade of openOptionTrades) {
                const instrument = {
                    exchange: 'NFO',
                    tradingsymbol: trade.asset
                };

                try {
                    const ltpMap = await fetchLTPs([instrument]);

                    const ltp = ltpMap[trade.asset];
                    if (ltp) {
                        const updatedTrade = {
                            ...trade,
                            ltp: ltp.toString()
                        };
                        const unrealizedPL = calculateUnrealizedPL(updatedTrade);
                        updatedTrade.unrealizedpl = unrealizedPL;
                        updatedOptionTrades.push(updatedTrade);
                    }
                } catch (err) {
                    console.error('Error fetching LTP for option:', trade.asset, err);
                }
                setSyncProgress(prev => ({ ...prev, current: prev.current + 1 }));
            }

            // Update symbol LTP if strategy has a symbol
            if (strategy?.symbol) {
                try {
                    const symbolInstrument = {
                        exchange: 'NSE',
                        tradingsymbol: strategy.symbol
                    };
                    const symbolLtpMap = await fetchLTPs([symbolInstrument]);

                    const symbolLTP = symbolLtpMap[strategy.symbol];
                    if (symbolLTP !== undefined) {
                        // Update strategy with new symbol LTP
                        const updatedStrategy = {
                            ...strategy,
                            symbol_ltp: symbolLTP.toString()
                        };
                        await updateStrategy(updatedStrategy);

                        // Update local state
                        setStrategy(updatedStrategy);

                        setSnackbar({
                            open: true,
                            message: `Fetched LTP ₹${symbolLTP} for ${strategy.symbol}`,
                            severity: 'success'
                        });
                    }
                } catch (err) {
                    console.error('Error fetching LTP for strategy symbol:', strategy.symbol, err);
                }
            }

            // Update all trades in database
            await Promise.all([
                ...updatedStockTrades.map(trade => updateStockTrade(trade)),
                ...updatedOptionTrades.map(trade => updateOptionTrade(trade))
            ]);

            await fetchTrades();
            calculatePLSummary();

            const totalUpdated = updatedStockTrades.length + updatedOptionTrades.length;
            const totalOpen = openStockTrades.length + openOptionTrades.length;

            if (totalUpdated === 0) {
                setSnackbar({
                    open: true,
                    message: 'Unable to get LPT from Zerodha for the Open Trades',
                    severity: 'warning'
                });
            } else {
                setSnackbar({
                    open: true,
                    message: totalUpdated > 0
                        ? `Successfully synced LTP from Zerodha for ${totalUpdated} out of ${totalOpen} open trades`
                        : 'Unable to get LPT from Zerodha',
                    severity: totalUpdated > 0 ? 'success' : 'info'
                });
            }
        } catch (error) {
            console.error('Error updating LTP from Zerodha:', error);
            setSnackbar({
                open: true,
                message: error.message || 'Failed to update LTP from Zerodha',
                severity: 'error'
            });
        } finally {
            setIsFetchingZerodhaLTP(false);
            setSyncProgress({ total: 0, current: 0, status: 'complete' });
        }
    };

    const handleDeleteStrategy = async () => {
        try {
            await deleteStrategy(id);
            setSnackbar({
                open: true,
                message: 'Strategy deleted successfully',
                severity: 'success'
            });
            navigate('/mystrategies');
        } catch (error) {
            console.error('Error deleting strategy:', error);
            setSnackbar({
                open: true,
                message: 'Failed to delete strategy',
                severity: 'error'
            });
        }
        setShowDeleteConfirmDialog(false);
    };

    const handleRemoveTrade = async () => {
        if (!tradeToRemove) return;

        try {
            const updatedStrategy = { ...strategy };
            // Check if it's an option trade by looking for lotsize property
            const isOptionTrade = tradeToRemove.lotsize !== undefined;

            if (isOptionTrade) {
                updatedStrategy.option_trades = updatedStrategy.option_trades.filter(id => id !== tradeToRemove.tradeid);
            } else {
                updatedStrategy.stock_trades = updatedStrategy.stock_trades.filter(id => id !== tradeToRemove.tradeid);
            }

            await updateStrategy(updatedStrategy);
            setStrategy(updatedStrategy);
            await fetchTrades(); // Refresh the trades list
            setSnackbar({
                open: true,
                message: 'Trade removed from strategy successfully',
                severity: 'success'
            });
        } catch (error) {
            console.error('Error removing trade:', error);
            setSnackbar({
                open: true,
                message: 'Failed to remove trade from strategy',
                severity: 'error'
            });
        } finally {
            setShowRemoveTradeConfirmDialog(false);
            setTradeToRemove(null);
        }
    };

    const handleRemoveTradeClick = () => {
        setTradeToRemove(selectedTradeForMenu);
        setShowRemoveTradeConfirmDialog(true);
        handleActionMenuClose();
    };

    const handleAddNote = async () => {
        try {
            await addStrategyNote(strategy.id, newNoteContent);
            setNewNoteContent('');
            setShowAddNoteDialog(false);
            fetchNotes(strategy.id);
            setSnackbar({
                open: true,
                message: 'Note added successfully',
                severity: 'success'
            });
        } catch (error) {
            console.error('Error adding note:', error);
            setSnackbar({
                open: true,
                message: 'Failed to add note',
                severity: 'error'
            });
        }
    };

    useEffect(() => {
        fetchStrategy();
    }, [id, fetchStrategy]);

    useEffect(() => {
        if (strategy && strategy.id) {
            fetchTrades();
            fetchNotes(strategy.id);
        }
    }, [strategy, fetchTrades, fetchNotes]);

    useEffect(() => {
        calculatePLSummary();
    }, [calculatePLSummary]);


    useEffect(() => {
        const fetchAllTradeActionItems = async () => {
            if (!stockTrades.length && !optionTrades.length) return;
            const actionItemsByTrade = {};
            // Fetch for stock trades
            for (const trade of stockTrades) {
                const items = await getActionItems({ stock_trade_id: trade.tradeid });
                if (items && items.length > 0) {
                    actionItemsByTrade[trade.tradeid] = items;
                }
            }
            // Fetch for option trades
            for (const trade of optionTrades) {
                const items = await getActionItems({ option_trade_id: trade.tradeid });
                if (items && items.length > 0) {
                    actionItemsByTrade[trade.tradeid] = items;
                }
            }
            setTradeActionItems(actionItemsByTrade);
        };
        fetchAllTradeActionItems();
    }, [stockTrades, optionTrades]);

    useEffect(() => {
        const fetchOpenStrategies = async () => {
            try {
                const response = await getOpenStrategies();
                setOpenStrategies(response);
            } catch (err) {
                // Optionally handle error
            }
        };
        fetchOpenStrategies();
    }, []);

    const PLSummaryCard = () => {
        const hasOpenTrades = [...stockTrades, ...optionTrades].some(trade => trade.status === 'OPEN');
        const tradesNeedingUpdate = React.useMemo(() => {
            return [...stockTrades, ...optionTrades]
                .filter(trade => trade.status === 'OPEN' && (!trade.ltp || parseFloat(trade.ltp) === 0 || parseFloat(trade.ltp) === 0.00))
                .map(trade => `${trade.asset}${trade.strikeprize ? ` ${trade.strikeprize}` : ''}`);
        }, [stockTrades, optionTrades]);

        return (
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        P/L Summary
                    </Typography>

                    {hasOpenTrades && hasOpenTradesWithZeroLTP && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            Please update LTP for: {tradesNeedingUpdate.join(', ')}
                        </Alert>
                    )}

                    {hasOpenTrades && !plSummary.hasAllLTP && !hasOpenTradesWithZeroLTP && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Please update LTP of all open positions to view complete P/L Summary
                        </Alert>
                    )}

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Realized P/L
                            </Typography>
                            <Typography
                                variant="h6"
                                sx={{
                                    color: plSummary.realizedPL >= 0 ? 'success.main' : 'error.main',
                                    fontWeight: 'bold'
                                }}
                            >
                                {plSummary.realizedPL >= 0 ? '+' : ''}
                                ₹{plSummary.realizedPL.toFixed(2)}
                            </Typography>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Unrealized P/L
                            </Typography>
                            <Typography
                                variant="h6"
                                sx={{
                                    color: plSummary.unrealizedPL >= 0 ? 'success.main' : 'error.main',
                                    fontWeight: 'bold'
                                }}
                            >
                                {plSummary.hasAllLTP && !hasOpenTradesWithZeroLTP ? (
                                    <span>
                                        {plSummary.unrealizedPL >= 0 ? '+' : ''}
                                        ₹{plSummary.unrealizedPL.toFixed(2)}
                                    </span>
                                ) : '-'}
                            </Typography>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Total P/L (After Expenses)
                            </Typography>
                            <Typography
                                variant="h6"
                                sx={{
                                    color: (plSummary.realizedPL + plSummary.unrealizedPL - plSummary.expenses) >= 0 ? 'success.main' : 'error.main',
                                    fontWeight: 'bold'
                                }}
                            >
                                {plSummary.hasAllLTP && !hasOpenTradesWithZeroLTP ? (
                                    <span>
                                        {(plSummary.realizedPL + plSummary.unrealizedPL - plSummary.expenses) >= 0 ? '+' : ''}
                                        ₹{(plSummary.realizedPL + plSummary.unrealizedPL - plSummary.expenses).toFixed(2)}
                                    </span>
                                ) : (
                                    <span>
                                        ₹{(plSummary.realizedPL - plSummary.expenses).toFixed(2)}
                                        {hasOpenTrades && !hasOpenTradesWithZeroLTP && <span style={{ color: 'text.secondary' }}> (+ Unrealized P/L)</span>}
                                    </span>
                                )}
                            </Typography>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        );
    };

    const BreakEvenPointsCard = React.memo(() => {
        return (
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Break-even Points
                    </Typography>
                    {breakEvenPoints && (
                        <Grid item xs={12}>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle2" color="text.secondary">
                                Break-even Points (using Symbol LTP and Realized P/L)
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 4, mt: 1 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Lower Break-even
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                        ₹{breakEvenPoints.lower.toFixed(2)}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Upper Break-even
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                        ₹{breakEvenPoints.upper.toFixed(2)}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                    )}
                </CardContent>
            </Card>
        );
    }, [breakEvenPoints]);
    BreakEvenPointsCard.displayName = 'BreakEvenPointsCard';

    const LTPInput = React.memo(({ trade, value, onValueChange }) => {
        const handleChange = React.useCallback((e) => {
            onValueChange(trade.tradeid, e.target.value);
        }, [trade.tradeid, onValueChange]);

        return (
            <Box sx={{ mb: 2 }}>
                <TextField
                    label={`${trade.asset} ${trade.strikeprize ? trade.strikeprize : ''} (Entry: ${trade.entryprice})`}
                    type="number"
                    value={value || ''}
                    onChange={handleChange}
                    fullWidth
                    size="small"
                />
            </Box>
        );
    });
    LTPInput.displayName = 'LTPInput';

    const TradeSection = React.memo(({ trades, title, values, onValueChange }) => {
        if (trades.length === 0) return null;

        return (
            <>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                    {title}
                </Typography>
                {trades.map(trade => (
                    <LTPInput
                        key={trade.tradeid}
                        trade={trade}
                        value={values[trade.tradeid]}
                        onValueChange={onValueChange}
                    />
                ))}
            </>
        );
    });
    TradeSection.displayName = 'TradeSection';

    const LTPUpdateDialog = () => {
        const [ltpValues, setLtpValues] = React.useState({});

        const openStockTrades = React.useMemo(() =>
            stockTrades.filter(trade => trade.status === 'OPEN'),
            [stockTrades]
        );

        const openOptionTrades = React.useMemo(() =>
            optionTrades.filter(trade => trade.status === 'OPEN'),
            [optionTrades]
        );

        const hasOpenTrades = openStockTrades.length > 0 || openOptionTrades.length > 0;

        const handleClose = React.useCallback(() => {
            setShowLTPDialog(false);
            setLtpValues({});
        }, []);

        const handleValueChange = React.useCallback((tradeId, value) => {
            setLtpValues(prev => ({
                ...prev,
                [tradeId]: value
            }));
        }, []);

        const handleSubmit = React.useCallback(async () => {
            try {
                let totalUnrealized = 0;
                const updatedStockTrades = [];
                const updatedOptionTrades = [];

                // Update stock trades
                for (const trade of openStockTrades) {
                    if (ltpValues[trade.tradeid]) {
                        const updatedTrade = {
                            ...trade,
                            ltp: ltpValues[trade.tradeid]
                        };
                        const unrealizedPL = calculateUnrealizedPL(updatedTrade);
                        updatedTrade.unrealizedpl = unrealizedPL;
                        totalUnrealized += unrealizedPL;
                        updatedStockTrades.push(updatedTrade);
                    }
                }

                // Update option trades
                for (const trade of openOptionTrades) {
                    if (ltpValues[trade.tradeid]) {
                        const updatedTrade = {
                            ...trade,
                            ltp: ltpValues[trade.tradeid]
                        };
                        const unrealizedPL = calculateUnrealizedPL(updatedTrade);
                        updatedTrade.unrealizedpl = unrealizedPL;
                        totalUnrealized += unrealizedPL;
                        updatedOptionTrades.push(updatedTrade);
                    }
                }

                // Update trades in database
                await Promise.all([
                    ...updatedStockTrades.map(trade => updateStockTrade(trade)),
                    ...updatedOptionTrades.map(trade => updateOptionTrade(trade))
                ]);

                // Update local state
                setStockTrades(prevTrades =>
                    prevTrades.map(trade => {
                        const updated = updatedStockTrades.find(t => t.tradeid === trade.tradeid);
                        return updated || trade;
                    })
                );

                setOptionTrades(prevTrades =>
                    prevTrades.map(trade => {
                        const updated = updatedOptionTrades.find(t => t.tradeid === trade.tradeid);
                        return updated || trade;
                    })
                );

                setShowLTPDialog(false);
                calculatePLSummary();
                handleClose();
            } catch (error) {
                console.error('Error updating LTPs:', error);
                setError("Failed to update LTPs and calculate P/L.");
            }
        }, [openStockTrades, openOptionTrades, ltpValues, calculateUnrealizedPL, calculatePLSummary, handleClose]);

        // Reset form when dialog opens
        React.useEffect(() => {
            if (showLTPDialog) {
                setLtpValues({});
            }
        }, [showLTPDialog]);

        return (
            <Dialog
                open={showLTPDialog}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
                keepMounted={false}
            >
                <Box sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Update Last Traded Prices
                    </Typography>

                    {!hasOpenTrades && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            No open positions found.
                        </Alert>
                    )}

                    <TradeSection
                        trades={openStockTrades}
                        title="Stock Trades"
                        values={ltpValues}
                        onValueChange={handleValueChange}
                    />

                    <TradeSection
                        trades={openOptionTrades}
                        title="Option Trades"
                        values={ltpValues}
                        onValueChange={handleValueChange}
                    />

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={!hasOpenTrades || Object.keys(ltpValues).length === 0}
                        >
                            Generate Unrealized P/L
                        </Button>
                    </Box>
                </Box>
            </Dialog>
        );
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={4}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Top bar: Dropdown left, Back button right */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <FormControl sx={{ minWidth: 300 }}>
                    <InputLabel id="strategy-select-label">Select Strategy</InputLabel>
                    <Select
                        labelId="strategy-select-label"
                        value={strategy?.id || ""}
                        label="Select Strategy"
                        onChange={e => {
                            const selectedId = e.target.value;
                            if (selectedId !== strategy?.id) {
                                navigate(`/updatestrategy/${selectedId}`);
                            }
                        }}
                    >
                        {openStrategies.map(s => (
                            <MenuItem key={s.id} value={s.id}>
                                {s.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/mystrategies')}
                    variant="contained"
                    color="secondary"
                    sx={{ ml: 2, fontWeight: 'bold', textTransform: 'none' }}
                >
                    Back to Strategies
                </Button>
            </Box>
            <Grid container spacing={4}>
                {/* Combined Strategy Details and P/L Summary Section */}
                <Grid item xs={12}>
                    <Card elevation={2}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 3
                            }}>
                                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                    {strategy?.name || 'Strategy Details'}
                                </Typography>
                            </Box>

                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Name"
                                        value={strategy?.name || ""}
                                        fullWidth
                                        onChange={handleNameChange}
                                        error={!!nameError}
                                        helperText={nameError}
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Symbol"
                                        value={strategy?.symbol || ""}
                                        fullWidth
                                        onChange={(e) => setStrategy(prev => ({ ...prev, symbol: e.target.value }))}
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Symbol LTP (optional)"
                                        name="symbol_ltp"
                                        type="number"
                                        fullWidth
                                        value={strategy?.symbol_ltp || ''}
                                        onChange={e => setStrategy(prev => ({ ...prev, symbol_ltp: e.target.value }))}
                                        inputProps={{ step: "0.01", min: "0" }}
                                        sx={{ mb: 2 }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Expenses (₹)"
                                        name="expenses"
                                        type="number"
                                        fullWidth
                                        value={strategy?.expenses || 0}
                                        onChange={handleExpensesChange}
                                        inputProps={{ step: "0.01", min: "0" }}
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Status</InputLabel>
                                        <Select
                                            value={strategy?.status || ""}
                                            onChange={handleStatusChange}
                                            label="Status"
                                        >
                                            <MenuItem value="OPEN">OPEN</MenuItem>
                                            <MenuItem value="CLOSE">CLOSE</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>

                            <Box sx={{ mt: 3 }}>
                                <PLSummaryCard />
                                <BreakEvenPointsCard />
                            </Box>

                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                alignItems: 'center',
                                mt: 3,
                                gap: 2
                            }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<SyncIcon />}
                                    onClick={() => {
                                        // handleGetLTPFromZerodha();
                                        setShowZerodhaConfirmDialog(true);
                                    }}
                                    disabled={isFetchingZerodhaLTP}
                                >
                                    {isFetchingZerodhaLTP ? 'Fetching LTP...' : 'Get LTP from Zerodha'}
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<EditIcon />}
                                    onClick={() => setShowLTPDialog(true)}
                                >
                                    Update LTP Manually
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<SaveIcon />}
                                    onClick={handleUpdateStrategy}
                                >
                                    Save Changes
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    startIcon={<DeleteIcon />}
                                    onClick={() => setShowDeleteConfirmDialog(true)}
                                >
                                    Delete Strategy
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Tabs Section */}
                <Grid item xs={12}>
                    <Paper elevation={2}>
                        <Tabs
                            value={activeTab}
                            onChange={(e, newValue) => setActiveTab(newValue)}
                            sx={{
                                borderBottom: 1,
                                borderColor: 'divider',
                                '& .MuiTab-root': {
                                    textTransform: 'none',
                                    fontWeight: 'medium',
                                    minHeight: 48
                                }
                            }}
                        >
                            <Tab label="Open Trades" />
                            <Tab label="Closed Trades" />
                            <Tab label="Notes" />
                        </Tabs>

                        {/* Open Trades Tab */}
                        {activeTab === 0 && (
                            <Box sx={{ p: 3 }}>
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: 2,
                                    mb: 3
                                }}>
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => setShowCreateStockTrade(true)}
                                        size="large"
                                    >
                                        Add Stock Trade
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        startIcon={<AddIcon />}
                                        onClick={() => setShowCreateOptionTrade(true)}
                                        size="large"
                                    >
                                        Add Option Trade
                                    </Button>
                                </Box>

                                {/* Stock Trades Table */}
                                {stockTrades.filter(trade => trade.status === 'OPEN').length > 0 && (
                                    <TableContainer component={Paper} sx={{ ...TABLE_STYLES.container, mb: 3 }}>
                                        <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                                            Stock Trades
                                        </Typography>
                                        <Table>
                                            <TableHead sx={TABLE_STYLES.header}>
                                                <TableRow>
                                                    <TableCell>Status</TableCell>
                                                    <TableCell>Entry Date</TableCell>
                                                    <TableCell>Asset</TableCell>
                                                    <TableCell>Quantity</TableCell>
                                                    <TableCell>Trade Type</TableCell>
                                                    <TableCell>Entry Price</TableCell>
                                                    <TableCell>Exit Price</TableCell>
                                                    <TableCell>LTP</TableCell>
                                                    <TableCell>Unrealized P/L</TableCell>
                                                    <TableCell>Overall P/L</TableCell>
                                                    <TableCell>Actions</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {sortTrades(stockTrades.filter(trade => trade.status === 'OPEN')).map((trade) => {
                                                    const unrealizedPL = calculateUnrealizedPL(trade);
                                                    return (
                                                        <TableRow
                                                            key={trade.tradeid}
                                                            onClick={() => handleTradeClick(trade)}
                                                            sx={TABLE_STYLES.row}
                                                        >
                                                            <TableCell>
                                                                <Chip
                                                                    label={trade.status}
                                                                    color="success"
                                                                    size="small"
                                                                />
                                                            </TableCell>
                                                            <TableCell>{moment(trade.entrydate).format('YYYY-MM-DD')}</TableCell>
                                                            <TableCell>{trade.asset}</TableCell>
                                                            <TableCell>{trade.quantity}</TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={trade.tradetype}
                                                                    color={trade.tradetype === 'LONG' ? 'primary' : 'secondary'}
                                                                    size="small"
                                                                />
                                                            </TableCell>
                                                            <TableCell>{trade.entryprice}</TableCell>
                                                            <TableCell>{trade.exitaverageprice || '-'}</TableCell>
                                                            <TableCell>{trade.ltp || '-'}</TableCell>
                                                            <TableCell
                                                                sx={{
                                                                    color: unrealizedPL >= 0 ? 'success.main' : 'error.main',
                                                                    fontWeight: 'bold'
                                                                }}
                                                            >
                                                                {`${unrealizedPL >= 0 ? '+' : ''}${unrealizedPL.toFixed(2)}`}
                                                            </TableCell>
                                                            <TableCell
                                                                sx={{
                                                                    color: trade.overallreturn >= 0 ? 'success.main' : 'error.main',
                                                                    fontWeight: 'bold'
                                                                }}
                                                            >
                                                                {trade.overallreturn >= 0 ? '+' : ''}{trade.overallreturn}
                                                            </TableCell>
                                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={(e) => handleActionMenuClick(e, trade)}
                                                                >
                                                                    <MoreVertIcon />
                                                                </IconButton>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}

                                {/* Option Trades Table */}
                                {optionTrades.filter(trade => trade.status === 'OPEN').length > 0 && (
                                    <TableContainer component={Paper} sx={TABLE_STYLES.container}>
                                        <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                                            Option Trades
                                        </Typography>
                                        <Table>
                                            <TableHead sx={TABLE_STYLES.header}>
                                                <TableRow>
                                                    <TableCell>Status</TableCell>
                                                    <TableCell>Entry Date</TableCell>
                                                    <TableCell>Asset</TableCell>
                                                    <TableCell>Strike Price</TableCell>
                                                    <TableCell>Lots</TableCell>
                                                    <TableCell>Trade Type</TableCell>
                                                    <TableCell>Entry Price</TableCell>
                                                    <TableCell>Exit Price</TableCell>
                                                    <TableCell>LTP</TableCell>
                                                    <TableCell>Unrealized P/L</TableCell>
                                                    <TableCell>Overall P/L</TableCell>
                                                    <TableCell>Actions</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {sortTrades(optionTrades.filter(trade => trade.status === 'OPEN')).map((trade) => {
                                                    const unrealizedPL = calculateUnrealizedPL(trade);
                                                    return (
                                                        <TableRow
                                                            key={trade.tradeid}
                                                            onClick={() => handleTradeClick(trade)}
                                                            sx={TABLE_STYLES.row}
                                                        >
                                                            <TableCell>
                                                                <Chip
                                                                    label={trade.status}
                                                                    color="success"
                                                                    size="small"
                                                                />
                                                            </TableCell>
                                                            <TableCell>{moment(trade.entrydate).format('YYYY-MM-DD')}</TableCell>
                                                            <TableCell>{trade.asset}</TableCell>
                                                            <TableCell>{trade.strikeprize}</TableCell>
                                                            <TableCell>{trade.openquantity / trade.lotsize}</TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={trade.tradetype}
                                                                    color={trade.tradetype === 'LONG' ? 'primary' : 'secondary'}
                                                                    size="small"
                                                                />
                                                            </TableCell>
                                                            <TableCell>{trade.entryprice}</TableCell>
                                                            <TableCell>{trade.exitaverageprice || '-'}</TableCell>
                                                            <TableCell>{trade.ltp || '-'}</TableCell>
                                                            <TableCell
                                                                sx={{
                                                                    color: unrealizedPL >= 0 ? 'success.main' : 'error.main',
                                                                    fontWeight: 'bold'
                                                                }}
                                                            >
                                                                {`${unrealizedPL >= 0 ? '+' : ''}${unrealizedPL.toFixed(2)}`}
                                                            </TableCell>
                                                            <TableCell
                                                                sx={{
                                                                    color: trade.overallreturn >= 0 ? 'success.main' : 'error.main',
                                                                    fontWeight: 'bold'
                                                                }}
                                                            >
                                                                {trade.overallreturn >= 0 ? '+' : ''}{trade.overallreturn}
                                                            </TableCell>
                                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={(e) => handleActionMenuClick(e, trade)}
                                                                >
                                                                    <MoreVertIcon />
                                                                </IconButton>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </Box>
                        )}

                        {/* Closed Trades Tab */}
                        {activeTab === 1 && (
                            <Box sx={{ p: 3 }}>
                                {/* Stock Trades Table */}
                                {stockTrades.filter(trade => trade.status === 'CLOSED').length > 0 && (
                                    <TableContainer component={Paper} sx={{ ...TABLE_STYLES.container, mb: 3 }}>
                                        <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                                            Closed Stock Trades
                                        </Typography>
                                        <Table>
                                            <TableHead sx={TABLE_STYLES.header}>
                                                <TableRow>
                                                    <TableCell>Status</TableCell>
                                                    <TableCell>Entry Date</TableCell>
                                                    <TableCell>Exit Date</TableCell>
                                                    <TableCell>Asset</TableCell>
                                                    <TableCell>Quantity</TableCell>
                                                    <TableCell>Trade Type</TableCell>
                                                    <TableCell>Entry Price</TableCell>
                                                    <TableCell>Exit Price</TableCell>
                                                    <TableCell>Overall P/L</TableCell>
                                                    <TableCell>Actions</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {sortTrades(stockTrades.filter(trade => trade.status === 'CLOSED')).map((trade) => (
                                                    <TableRow
                                                        key={trade.tradeid}
                                                        onClick={() => handleTradeClick(trade)}
                                                        sx={TABLE_STYLES.row}
                                                    >
                                                        <TableCell>
                                                            <Chip
                                                                label={trade.status}
                                                                color="default"
                                                                size="small"
                                                            />
                                                        </TableCell>
                                                        <TableCell>{moment(trade.entrydate).format('YYYY-MM-DD')}</TableCell>
                                                        <TableCell>{moment(trade.exitdate).format('YYYY-MM-DD')}</TableCell>
                                                        <TableCell>{trade.asset}</TableCell>
                                                        <TableCell>{trade.quantity}</TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={trade.tradetype}
                                                                color={trade.tradetype === 'LONG' ? 'primary' : 'secondary'}
                                                                size="small"
                                                            />
                                                        </TableCell>
                                                        <TableCell>{trade.entryprice}</TableCell>
                                                        <TableCell>{trade.exitaverageprice}</TableCell>
                                                        <TableCell
                                                            sx={{
                                                                color: trade.overallreturn >= 0 ? 'success.main' : 'error.main',
                                                                fontWeight: 'bold'
                                                            }}
                                                        >
                                                            {trade.overallreturn >= 0 ? '+' : ''}{trade.overallreturn}
                                                        </TableCell>
                                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={(e) => handleActionMenuClick(e, trade)}
                                                            >
                                                                <MoreVertIcon />
                                                            </IconButton>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}

                                {/* Option Trades Table */}
                                {optionTrades.filter(trade => trade.status === 'CLOSED').length > 0 && (
                                    <TableContainer component={Paper} sx={TABLE_STYLES.container}>
                                        <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                                            Closed Option Trades
                                        </Typography>
                                        <Table>
                                            <TableHead sx={TABLE_STYLES.header}>
                                                <TableRow>
                                                    <TableCell>Status</TableCell>
                                                    <TableCell>Entry Date</TableCell>
                                                    <TableCell>Exit Date</TableCell>
                                                    <TableCell>Asset</TableCell>
                                                    <TableCell>Strike Price</TableCell>
                                                    <TableCell>Lots</TableCell>
                                                    <TableCell>Trade Type</TableCell>
                                                    <TableCell>Entry Price</TableCell>
                                                    <TableCell>Exit Price</TableCell>
                                                    <TableCell>Overall P/L</TableCell>
                                                    <TableCell>Actions</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {sortTrades(optionTrades.filter(trade => trade.status === 'CLOSED')).map((trade) => (
                                                    <TableRow
                                                        key={trade.tradeid}
                                                        onClick={() => handleTradeClick(trade)}
                                                        sx={TABLE_STYLES.row}
                                                    >
                                                        <TableCell>
                                                            <Chip
                                                                label={trade.status}
                                                                color="default"
                                                                size="small"
                                                            />
                                                        </TableCell>
                                                        <TableCell>{moment(trade.entrydate).format('YYYY-MM-DD')}</TableCell>
                                                        <TableCell>{moment(trade.exitdate).format('YYYY-MM-DD')}</TableCell>
                                                        <TableCell>{trade.asset}</TableCell>
                                                        <TableCell>{trade.strikeprize}</TableCell>
                                                        <TableCell>{trade.openquantity / trade.lotsize}</TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={trade.tradetype}
                                                                color={trade.tradetype === 'LONG' ? 'primary' : 'secondary'}
                                                                size="small"
                                                            />
                                                        </TableCell>
                                                        <TableCell>{trade.entryprice}</TableCell>
                                                        <TableCell>{trade.exitaverageprice}</TableCell>
                                                        <TableCell
                                                            sx={{
                                                                color: trade.overallreturn >= 0 ? 'success.main' : 'error.main',
                                                                fontWeight: 'bold'
                                                            }}
                                                        >
                                                            {trade.overallreturn >= 0 ? '+' : ''}{trade.overallreturn}
                                                        </TableCell>
                                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={(e) => handleActionMenuClick(e, trade)}
                                                            >
                                                                <MoreVertIcon />
                                                            </IconButton>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </Box>
                        )}

                        {/* Notes Tab */}
                        {activeTab === 2 && (
                            <Box p={3}>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => setShowAddNoteDialog(true)}
                                    >
                                        Add Note
                                    </Button>
                                </Box>
                                <NotesTable
                                    notes={notes}
                                    onUpdate={() => fetchNotes(strategy.id)}
                                />
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Dialogs */}
            <Dialog
                open={showCreateStockTrade}
                onClose={() => setShowCreateStockTrade(false)}
                maxWidth="md"
                fullWidth
            >
                <StockTradeForm
                    title="Create Stock Trade"
                    onSubmit={(details) => handleSubmitTrade(details, true)}
                    onCancel={() => setShowCreateStockTrade(false)}
                    strategyid={strategy?.id}
                />
            </Dialog>

            <Dialog
                open={showCreateOptionTrade}
                onClose={() => setShowCreateOptionTrade(false)}
                maxWidth="md"
                fullWidth
            >
                <OptionTradeForm
                    title="Create Option Trade"
                    onSubmit={(details) => handleSubmitTrade(details, false)}
                    onCancel={() => setShowCreateOptionTrade(false)}
                    strategyid={strategy?.id}
                />
            </Dialog>

            <Dialog
                open={showUpdateTrade}
                onClose={() => setShowUpdateTrade(false)}
                maxWidth="md"
                fullWidth
            >
                {selectedTrade && (
                    selectedTrade.lotsize === undefined ? (
                        <StockTradeForm
                            title="Update Stock Trade"
                            onSubmit={handleUpdateTrade}
                            onCancel={() => setShowUpdateTrade(false)}
                            strategyid={strategy?.id}
                            currentTrade={selectedTrade}
                            isUpdate={true}
                        />
                    ) : (
                        <OptionTradeForm
                            title="Update Option Trade"
                            onSubmit={handleUpdateTrade}
                            onCancel={() => setShowUpdateTrade(false)}
                            strategyid={strategy?.id}
                            currentTrade={selectedTrade}
                            isUpdate={true}
                        />
                    )
                )}
            </Dialog>

            <LTPUpdateDialog />

            {/* Action Menu */}
            <Menu
                anchorEl={actionMenuAnchorEl}
                open={Boolean(actionMenuAnchorEl)}
                onClose={handleActionMenuClose}
            >
                <MenuItem onClick={() => { handleActionMenuClose(); handleTradeClick(selectedTradeForMenu); }}>
                    <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit Trade
                </MenuItem>
                <MenuItem onClick={() => { handleActionMenuClose(); handleCreateActionItem(); }}>
                    <AssignmentIcon fontSize="small" sx={{ mr: 1 }} /> Create Action Item
                </MenuItem>
                <MenuItem onClick={handleRemoveTradeClick}>
                    <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Remove from Strategy
                </MenuItem>
            </Menu>

            {/* Create Action Item Dialog */}
            <Dialog
                open={showActionItemPopup}
                onClose={() => setShowActionItemPopup(false)}
                maxWidth="md"
                fullWidth
            >
                {selectedTradeForAction && (
                    <CreateActionItem
                        isOpen={showActionItemPopup}
                        onClose={() => setShowActionItemPopup(false)}
                        onSave={handleSaveActionItem}
                        tradeId={selectedTradeForAction.tradeid}
                        tradeType={selectedTradeForAction.lotsize === undefined ? 'stock' : 'option'}
                        asset={selectedTradeForAction.asset}
                    />
                )}
            </Dialog>

            {Object.keys(tradeActionItems).length > 0 && (
                <Box sx={{ mt: 6 }}>
                    <Typography
                        variant="h6"
                        sx={{
                            mb: 1,
                            color: 'text.secondary',
                            fontWeight: 600,
                            letterSpacing: 1,
                            textTransform: 'uppercase',
                        }}
                    >
                        Trade Action Items
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    <Grid container spacing={3}>
                        {Object.entries(tradeActionItems).map(([tradeId, items]) => {
                            // Find the trade details for better context
                            const trade = stockTrades.find(t => t.tradeid === tradeId) || optionTrades.find(t => t.tradeid === tradeId);
                            if (!trade) return null;
                            // Sort items: TODO first, then completed
                            const sortedItems = [...items].sort((a, b) => {
                                if (a.status === 'TODO' && b.status !== 'TODO') return -1;
                                if (a.status !== 'TODO' && b.status === 'TODO') return 1;
                                return 0;
                            });
                            return (
                                <Grid item xs={12} md={6} lg={4} key={tradeId}>
                                    <Card elevation={3} sx={{ borderRadius: 2 }}>
                                        <CardContent>
                                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                                <AssignmentIcon color="primary" />
                                                <Typography variant="subtitle1" fontWeight="bold">
                                                    {trade.asset} {trade.strikeprize ? trade.strikeprize : ''}
                                                </Typography>
                                                <Chip
                                                    label={trade.tradetype}
                                                    color={trade.tradetype === 'LONG' ? 'primary' : 'secondary'}
                                                    size="small"
                                                    icon={trade.tradetype === 'LONG' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                                                />
                                                <Typography variant="body2" color="text.secondary">
                                                    {moment(trade.entrydate).format('YYYY-MM-DD')}
                                                </Typography>
                                            </Stack>
                                            <List dense>
                                                {sortedItems.map((item) => (
                                                    <ListItem key={item.id} alignItems="flex-start" sx={{ pl: 0 }}>
                                                        <ListItemIcon sx={{ minWidth: 32 }}>
                                                            {item.status === 'TODO' ? (
                                                                <PendingActionsIcon color="warning" />
                                                            ) : (
                                                                <CheckCircleIcon color="success" />
                                                            )}
                                                        </ListItemIcon>
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                                            <Typography variant="body1" component="span">
                                                                {item.description}
                                                            </Typography>
                                                            <Box sx={{ mt: 0.5 }}>
                                                                <Chip
                                                                    label={item.status}
                                                                    color={item.status === 'TODO' ? 'warning' : 'success'}
                                                                    size="small"
                                                                />
                                                            </Box>
                                                        </Box>
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                </Box>
            )}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Zerodha Sync Confirmation Dialog */}
            <Dialog
                open={showZerodhaConfirmDialog}
                onClose={() => setShowZerodhaConfirmDialog(false)}
            >
                <DialogTitle>Confirm LTP Sync</DialogTitle>
                <DialogContent>
                    <Typography>
                        This will sync the Last Traded Prices (LTP) from your Zerodha positions and holdings for all open trades in this strategy. Do you want to continue?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowZerodhaConfirmDialog(false)}>Cancel</Button>
                    <Button onClick={handleConfirmZerodhaSync} variant="contained" color="primary">
                        Sync LTP
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Sync Progress Dialog */}
            <Dialog
                open={syncProgress.status === 'syncing'}
                onClose={() => { }} // Prevent closing while syncing
            >
                <DialogContent>
                    <Box sx={{ width: '100%', minWidth: 300 }}>
                        <Typography variant="h6" gutterBottom>
                            Syncing LTP from Zerodha
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Processing trade {syncProgress.current} of {syncProgress.total}
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={(syncProgress.current / syncProgress.total) * 100}
                            sx={{ mt: 2 }}
                        />
                    </Box>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={showDeleteConfirmDialog}
                onClose={() => setShowDeleteConfirmDialog(false)}
            >
                <DialogTitle>Delete Strategy</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this strategy? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowDeleteConfirmDialog(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteStrategy}
                        variant="contained"
                        color="error"
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={showRemoveTradeConfirmDialog}
                onClose={() => setShowRemoveTradeConfirmDialog(false)}
            >
                <DialogTitle>Remove Trade from Strategy</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to remove this trade from the strategy? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowRemoveTradeConfirmDialog(false)}>Cancel</Button>
                    <Button onClick={handleRemoveTrade} color="error" variant="contained">
                        Remove
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add Note Dialog */}
            <Dialog
                open={showAddNoteDialog}
                onClose={() => setShowAddNoteDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Add New Note</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Note Content"
                        type="text"
                        fullWidth
                        multiline
                        rows={4}
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowAddNoteDialog(false)}>Cancel</Button>
                    <Button
                        onClick={handleAddNote}
                        variant="contained"
                        color="primary"
                        disabled={!newNoteContent.trim()}
                    >
                        Add
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default UpdateStrategy;