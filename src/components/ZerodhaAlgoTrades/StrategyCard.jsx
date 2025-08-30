import React, { useEffect, useState, useCallback } from 'react';
import { 
    Box, 
    Card, 
    CardContent, 
    Typography, 
    Table, 
    TableHead, 
    TableRow, 
    TableCell, 
    TableBody, 
    Divider, 
    Grid, 
    Snackbar, 
    Alert, 
    TextField, 
    MenuItem, 
    Button, 
    IconButton, 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    TableContainer, 
    Paper,
    Link,
    CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import { updateAlgoStrategy, getStrategyNoteById, deleteStrategyNote, createStrategyNote } from '../../services/algoStrategies';
import { getAutomatedOrderById, updateAutomatedOrder } from '../../services/automatedOrders';
import { getOrders, getPositions } from '../../services/zerodha/api';
import { checkTargetAchievement, createTargetAchievement, resetTargetAchievement, getStrategyTarget, updateTargetValue } from '../../services/strategyTargetAchievements';
import { isMarketOpen } from '../../services/zerodha/utils';
import AutomatedOrdersTable from './AutomatedOrdersTable';
import CreateAutomatedOrderPopup from './CreateAutomatedOrderPopup';

const STATUS_OPTIONS = ['Open', 'Closed'];

const StrategyCard = ({ strategy, onStrategyUpdate, zerodhaWebSocketData }) => {
    // Add CSS animation for pulse effect
    React.useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        return () => {
            document.head.removeChild(style);
        };
    }, []);
    // Strategy Box States
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
    const [editState, setEditState] = useState({
        status: strategy.status,
        underlying_instrument: strategy.underlying_instrument,
        strategy_type: strategy.strategy_type,
        expected_return: ''
    });
    const [updating, setUpdating] = useState(false);
    const [orders, setOrders] = useState([]);
    const [showOrderPopup, setShowOrderPopup] = useState(false);
    const [orderPopupPositions, setOrderPopupPositions] = useState([]);
    const [orderPopupStrategyDetails, setOrderPopupStrategyDetails] = useState(null);
    const [showAddPositionPopup, setShowAddPositionPopup] = useState(false);
    const [openPositions, setOpenPositions] = useState([]);
    const [selectedPositions, setSelectedPositions] = useState([]);
    const [totalPL, setTotalPL] = useState(0);
    const [totalPLMP, setTotalPLMP] = useState(0);
    const [underlyingInstrumentToken, setUnderlyingInstrumentToken] = useState("");
    const [syncingPositions, setSyncingPositions] = useState(false);
    const [showClosedPositions, setShowClosedPositions] = useState(true);
    const [checkingOrderStatuses, setCheckingOrderStatuses] = useState(false);
    const [targetAchievements, setTargetAchievements] = useState(new Map());
    const [strategyTarget, setStrategyTarget] = useState(null);

    // Helper function for progress bar colors
    const getProgressColors = useCallback((totalPL, expectedReturn) => {
        if (totalPL < 0) return { main: 'error.main', light: 'error.50' }; // Red for negative P/L
        const progress = (totalPL / expectedReturn) * 100;
        if (progress < 50) return { main: 'warning.main', light: 'warning.50' }; // Orange for < 50%
        return { main: 'success.main', light: 'success.50' }; // Green for ≥ 50%
    }, []);

    // Strategy Notes States
    const [notes, setNotes] = useState([]);
    const [notesLoading, setNotesLoading] = useState(true);
    const [showNotesDialog, setShowNotesDialog] = useState(false);
    const [showDeleteNotesDialog, setShowDeleteNotesDialog] = useState(false);
    const [deletingNotes, setDeletingNotes] = useState(false);

    // Fetch notes for the strategy
    useEffect(() => {
        const fetchNotes = async () => {
            setNotesLoading(true);
            try {
                const data = await getStrategyNoteById(strategy.strategyid);
                setNotes(data);
            } catch (err) {
                setNotes([]);
            }
            setNotesLoading(false);
        };
        if (strategy.strategyid) fetchNotes();
    }, [strategy.strategyid]);

    // Fetch strategy target from database
    const fetchStrategyTarget = useCallback(async () => {
        try {
            const result = await getStrategyTarget(strategy.strategyid);
            if (result.success && result.data && result.data.target_value) {
                // Convert to number to ensure .toFixed() works
                const targetValue = parseFloat(result.data.target_value);
                setStrategyTarget(isNaN(targetValue) ? null : targetValue);
            } else {
                setStrategyTarget(null);
            }
        } catch (err) {
            console.error('Error fetching strategy target:', err);
            setStrategyTarget(null);
        }
    }, [strategy.strategyid]);

    // Check target achievements from database
    const checkTargetAchievements = useCallback(async (targetValue) => {
        try {
            if (!targetValue) return;
            
            const result = await checkTargetAchievement(strategy.strategyid, targetValue);
            if (result.success) {
                setTargetAchievements(prev => {
                    const newMap = new Map(prev);
                    newMap.set(targetValue, result.data.hasAchieved);
                    return newMap;
                });
            }
        } catch (err) {
            console.error('Error checking target achievements:', err);
        }
    }, [strategy.strategyid]);

    // Load target achievements when component mounts and handle target changes
    useEffect(() => {
        fetchStrategyTarget();
    }, [strategy.strategyid, fetchStrategyTarget]);

    // Handle target changes - check achievements and update editState
    useEffect(() => {
        if (strategyTarget) {
            checkTargetAchievements(strategyTarget);
            setEditState(prev => ({
                ...prev,
                expected_return: strategyTarget.toString()
            }));
        }
    }, [strategyTarget, checkTargetAchievements]);

    // Strategy Box Functions
    useEffect(() => {
        // Check if target has already been achieved to prevent spam
        const hasAchieved = targetAchievements.get(strategyTarget);
        
        if (typeof strategyTarget === 'number' && strategyTarget > 0 && totalPL > strategyTarget && !hasAchieved) {
            // Create achievement record in database
            createTargetAchievement(strategy.strategyid, strategyTarget)
                .then(() => {
                    // Update local state
                    setTargetAchievements(prev => {
                        const newMap = new Map(prev);
                        newMap.set(strategyTarget, true);
                        return newMap;
                    });
                    
                    // Create achievement note
                    createStrategyNote({ 
                        strategyid: strategy.strategyid, 
                        notes: `🎯 TARGET ACHIEVED! Total P/L (${totalPL.toFixed(2)}) exceeded expected return (${strategyTarget.toFixed(2)})` 
                    });
                    
                    // Show success notification
                    setSnackbar({
                        open: true,
                        message: `🎉 Strategy ${strategy.strategyid} exceeded target! P/L: ₹${totalPL.toFixed(2)} vs Target: ₹${strategyTarget.toFixed(2)}`,
                        severity: 'success'
                    });
                })
                .catch(err => {
                    console.error('Error creating target achievement:', err);
                });
        }
        
        // Reset achievement if P/L falls below target
        if (typeof strategyTarget === 'number' && strategyTarget > 0 && totalPL <= strategyTarget && hasAchieved) {
            resetTargetAchievement(strategy.strategyid, strategyTarget)
                .then(() => {
                    setTargetAchievements(prev => {
                        const newMap = new Map(prev);
                        newMap.set(strategyTarget, false);
                        return newMap;
                    });
                })
                .catch(err => {
                    console.error('Error resetting target achievement:', err);
                });
        }
    }, [totalPL, strategyTarget, targetAchievements, strategy.strategyid]);

    // Calculate total P/L for the strategy
    useEffect(() => {
        const calculateTotalPL = () => {
            if (!Array.isArray(strategy.instruments_details)) return 0;

            return strategy.instruments_details.reduce((total, inst) => {
                const ltp = zerodhaWebSocketData?.[inst.instrument_token]?.ltp;
                const askPrice = zerodhaWebSocketData?.[inst.instrument_token]?.tick_current_ask_price;
                const bidPrice = zerodhaWebSocketData?.[inst.instrument_token]?.tick_current_bid_price;
                const price = inst.price;
                if (!ltp || !price) return total;

                const pl = inst.quantity > 0
                    ? (ltp - price) * inst.quantity
                    : (ltp - price) * inst.quantity;

                return total + pl;
            }, 0);
        };

        const calculateTotalPLMP = () => {
            if (!Array.isArray(strategy.instruments_details)) return 0;

            return strategy.instruments_details.reduce((total, inst) => {
                const askPrice = zerodhaWebSocketData?.[inst.instrument_token]?.tick_current_ask_price;
                const bidPrice = zerodhaWebSocketData?.[inst.instrument_token]?.tick_current_bid_price;
                const price = inst.price;
                
                if (!askPrice || !bidPrice || !price) return total;

                const pl = inst.quantity > 0
                    ? (bidPrice - price) * inst.quantity
                    : (askPrice - price) * inst.quantity;

                return total + pl;
            }, 0);
        };

        

        const total = calculateTotalPL();
        const totalMP = calculateTotalPLMP();
        setTotalPL(total);
        setTotalPLMP(totalMP);
    }, [strategy, zerodhaWebSocketData]);

    // Fetch orders for the strategy
    const fetchOrders = async () => {
        try {
            if (Array.isArray(strategy.automated_order_ids) && strategy.automated_order_ids.length > 0) {
                const orders = await Promise.all(
                    strategy.automated_order_ids.map(async (orderId) => {
                        try {
                            return await getAutomatedOrderById(orderId);
                        } catch (err) {
                            console.warn(`Failed to fetch order ${orderId}:`, err);
                            return null;
                        }
                    })
                );
                setOrders(orders.filter(Boolean));
            } else {
                setOrders([]);
            }
        } catch (err) {
            console.error('Failed to fetch orders:', err);
            setOrders([]);
        }
    };

    // Manual refresh function for order statuses
    const handleManualStatusCheck = async () => {
        try {
            setCheckingOrderStatuses(true);
            await checkOrderStatuses(true); // Show notification for manual checks
        } catch (err) {
            console.error('Manual status check failed:', err);
        } finally {
            setCheckingOrderStatuses(false);
        }
    };

    // Check and update order statuses from Zerodha
    const checkOrderStatuses = async (showNotification = true) => {
        try {
            // Only check if we have orders with 'SENT TO ZERODHA' status
            const sentOrders = orders.filter(order => order.status === 'SENT TO ZERODHA' && order.zerodha_orderid);
            
            if (sentOrders.length === 0) {
                return; // No orders to check
            }

            setCheckingOrderStatuses(true);
            console.log(`Checking status for ${sentOrders.length} sent orders...`);
            
            // Get all orders from Zerodha
            const zerodhaOrders = await getOrders();
            if (!zerodhaOrders || !zerodhaOrders.data) {
                console.log('No Zerodha orders data received');
                return;
            }

            let statusUpdates = 0;
            
            // Check each sent order against Zerodha orders
            for (const sentOrder of sentOrders) {
                const zerodhaOrder = zerodhaOrders.data.find(
                    zo => zo.order_id === sentOrder.zerodha_orderid
                );
                
                if (zerodhaOrder) {
                    let newStatus = sentOrder.status;
                    
                    // Map Zerodha status to our status
                    switch (zerodhaOrder.status) {
                        case 'COMPLETE':
                            newStatus = 'COMPLETED';
                            break;
                        case 'CANCELLED':
                            newStatus = 'CANCELLED';
                            break;
                        case 'REJECTED':
                            newStatus = 'REJECTED';
                            break;
                        case 'OPEN':
                            newStatus = 'SENT TO ZERODHA';
                            break;
                        default:
                            newStatus = 'SENT TO ZERODHA';
                    }
                    
                    // Update order if status changed
                    if (newStatus !== sentOrder.status) {
                        try {
                            await updateAutomatedOrder(sentOrder.id, { status: newStatus });
                            statusUpdates++;
                            console.log(`Order ${sentOrder.id} status updated from ${sentOrder.status} to ${newStatus}`);
                        } catch (err) {
                            console.error(`Failed to update order ${sentOrder.id} status:`, err);
                        }
                    }
                }
            }
            
            // Refresh orders if any statuses were updated
            if (statusUpdates > 0) {
                console.log(`${statusUpdates} order statuses updated, refreshing orders...`);
                await fetchOrders();
                
                // Show notification only if requested
                if (showNotification) {
                    setSnackbar({
                        open: true,
                        message: `${statusUpdates} order status${statusUpdates > 1 ? 'es' : ''} updated from Zerodha`,
                        severity: 'info'
                    });
                }
            }
            
        } catch (err) {
            console.error('Error checking order statuses:', err);
            // Don't show error to user for background status checks
        } finally {
            setCheckingOrderStatuses(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        let underlyingInstrumentToken = "";
        
        // Only search if we have WebSocket data and strategy has underlying instrument
        if (zerodhaWebSocketData && strategy.underlying_instrument) {
            for (let key in zerodhaWebSocketData) {
                if (zerodhaWebSocketData[key] && 
                    zerodhaWebSocketData[key].tradingsymbol === strategy.underlying_instrument) {
                    underlyingInstrumentToken = key;
                    break;
                }
            }
        }
        
        setUnderlyingInstrumentToken(underlyingInstrumentToken);
        
        // Debug logging
        console.log('Strategy underlying_instrument:', strategy.underlying_instrument);
        console.log('WebSocket data keys:', Object.keys(zerodhaWebSocketData || {}));
    }, [strategy, zerodhaWebSocketData]);

    // Set up order status polling
    useEffect(() => {
        // Only start polling if we have orders with 'SENT TO ZERODHA' status
        const hasSentOrders = orders.some(order => order.status === 'SENT TO ZERODHA');
        
        if (!hasSentOrders) {
            return; // No need to poll
        }

        console.log('Starting order status polling...');
        
        // Initial check
        checkOrderStatuses(false); // Don't show notification for background checks
        
        // Set up interval for every 2 minutes (120000ms)
        const intervalId = setInterval(() => checkOrderStatuses(false), 120000);
        
        // Cleanup function
        return () => {
            console.log('Cleaning up order status polling...');
            clearInterval(intervalId);
        };
    }, [orders]); // Re-run when orders change



    const handleEditChange = (field, value) => {
        setEditState(prev => ({
            ...prev,
            [field]: value
        }));
    };

        const handleUpdate = async () => {
        setUpdating(true);
        try {
            // Validate target value
            if (!editState.expected_return || parseFloat(editState.expected_return) <= 0) {
                setSnackbar({
                    open: true,
                    message: 'Please enter a valid positive target value',
                    severity: 'error'
                });
                setUpdating(false);
                return;
            }

            const newTargetValue = parseFloat(editState.expected_return);
            
            // Update target in the new system
            try {
                // Check if target already exists
                const existingTarget = await getStrategyTarget(strategy.strategyid);
                
                if (existingTarget.success && existingTarget.data) {
                    // Update existing target
                    await updateTargetValue(strategy.strategyid, newTargetValue);
                } else {
                    // Create new target
                    await createTargetAchievement(strategy.strategyid, newTargetValue);
                }
                
                // Refresh target data
                await fetchStrategyTarget();
                
                setSnackbar({
                    open: true,
                    message: 'Target updated successfully!',
                    severity: 'success'
                });
            } catch (targetErr) {
                console.error('Error updating target:', targetErr);
                setSnackbar({
                    open: true,
                    message: 'Failed to update target',
                    severity: 'error'
                });
            }
        } catch (err) {
            setSnackbar({
                open: true,
                message: err?.response?.data?.error || err.message || 'An error occurred',
                severity: 'error'
            });
        }
        setUpdating(false);
    };

    const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

    const handleOpenOrderPopup = (positions, strategyDetails) => {
        setOrderPopupPositions(positions);
        setOrderPopupStrategyDetails(strategyDetails);
        setShowOrderPopup(true);
    };

    const handleCloseOrderPopup = () => {
        setShowOrderPopup(false);
        setTimeout(() => {
            setOrderPopupPositions([]);
            setOrderPopupStrategyDetails(null);
        }, 100);
    };

    const handleOrderPopupSuccess = async () => {
        // Refresh the strategy data to get updated automated_order_ids
        onStrategyUpdate && onStrategyUpdate();
        // Also fetch orders for immediate display
        await fetchOrders();
        handleCloseOrderPopup();
        
        // Show success message
        setSnackbar({
            open: true,
            message: 'Automated orders created successfully!',
            severity: 'success'
        });
    };

    const handleOpenAddPosition = async () => {
        setShowAddPositionPopup(true);
        try {
            const data = await getPositions();
            const openPositions = (data.data.net || []).filter(pos => pos.quantity !== 0);
            setOpenPositions(openPositions);
        } catch (err) {
            setSnackbar({
                open: true,
                message: err?.response?.data?.error || err.message || 'Failed to fetch positions',
                severity: 'error'
            });
        }
    };

    const handleCloseAddPosition = () => {
        setShowAddPositionPopup(false);
        setSelectedPositions([]);
    };

    const handleAddPosition = async () => {
        if (selectedPositions.length === 0) return;

        try {
            const updatedInstruments = [
                ...(strategy.instruments_details || []),
                ...selectedPositions.map(pos => ({
                    tradingsymbol: pos.tradingsymbol,
                    quantity: pos.quantity,
                    transaction_type: pos.quantity > 0 ? 'BUY' : 'SELL',
                    price: pos.average_price,
                    instrument_token: pos.instrument_token,
                    exchange: pos.exchange,
                    product: pos.product
                }))
            ];

            await updateAlgoStrategy(strategy.strategyid, {
                instruments_details: updatedInstruments
            });

            setSnackbar({
                open: true,
                message: 'Positions added successfully!',
                severity: 'success'
            });

            onStrategyUpdate && onStrategyUpdate();
            handleCloseAddPosition();
        } catch (err) {
            setSnackbar({
                open: true,
                message: err?.response?.data?.error || err.message || 'Failed to add positions',
                severity: 'error'
            });
        }
    };

    const handlePositionSelect = (position) => {
        setSelectedPositions(prev => {
            const isSelected = prev.some(p => p.tradingsymbol === position.tradingsymbol);
            if (isSelected) {
                return prev.filter(p => p.tradingsymbol !== position.tradingsymbol);
            } else {
                return [...prev, position];
            }
        });
    };

    const handleDeletePosition = async (positionIndex) => {
        try {
            const updatedInstruments = [...strategy.instruments_details];
            updatedInstruments.splice(positionIndex, 1);

            await updateAlgoStrategy(strategy.strategyid, {
                instruments_details: updatedInstruments
            });

            setSnackbar({
                open: true,
                message: 'Position removed successfully!',
                severity: 'success'
            });

            onStrategyUpdate && onStrategyUpdate();
        } catch (err) {
            setSnackbar({
                open: true,
                message: err?.response?.data?.error || err.message || 'Failed to remove position',
                severity: 'error'
            });
        }
    };

    const handleSyncPositions = async () => {
        setSyncingPositions(true);
        try {
            // Fetch latest positions from Zerodha
            const data = await getPositions();
            const currentZerodhaPositions = data.data.net || [];
            
            // Create a map of current Zerodha positions by trading symbol
            const zerodhaPositionMap = new Map();
            currentZerodhaPositions.forEach(pos => {
                if (pos.quantity !== 0) {
                    zerodhaPositionMap.set(pos.tradingsymbol, pos);
                }
            });

            // Get current strategy positions
            const currentStrategyPositions = strategy.instruments_details || [];
            
            // Update strategy positions based on Zerodha data
            const updatedInstruments = [];
            const changes = [];

            // Process each strategy position
            currentStrategyPositions.forEach(strategyPos => {
                const zerodhaPos = zerodhaPositionMap.get(strategyPos.tradingsymbol);
                
                if (zerodhaPos) {
                    // Position still exists in Zerodha
                    if (zerodhaPos.quantity !== strategyPos.quantity) {
                        // Quantity changed
                        const oldType = strategyPos.transaction_type;
                        const newType = zerodhaPos.quantity > 0 ? 'BUY' : 'SELL';
                        const typeChanged = oldType !== newType;
                        
                        if (typeChanged) {
                            changes.push(`${strategyPos.tradingsymbol}: ${strategyPos.quantity}(${oldType}) → ${zerodhaPos.quantity}(${newType})`);
                        } else {
                            changes.push(`${strategyPos.tradingsymbol}: ${strategyPos.quantity} → ${zerodhaPos.quantity}`);
                        }
                        
                        updatedInstruments.push({
                            ...strategyPos,
                            quantity: zerodhaPos.quantity,
                            price: zerodhaPos.average_price, // Update average price too
                            transaction_type: newType
                        });
                    } else {
                        // No change, keep as is
                        updatedInstruments.push(strategyPos);
                    }
                    // Remove from map to avoid duplicates
                    zerodhaPositionMap.delete(strategyPos.tradingsymbol);
                } else {
                    // Position closed in Zerodha (quantity = 0)
                    changes.push(`${strategyPos.tradingsymbol}: ${strategyPos.quantity} → CLOSED`);
                    // Don't add to updatedInstruments (position is closed)
                }
            });

            // Add new positions from Zerodha that weren't in strategy
            zerodhaPositionMap.forEach((zerodhaPos, symbol) => {
                changes.push(`NEW: ${symbol} (${zerodhaPos.quantity})`);
                updatedInstruments.push({
                    tradingsymbol: zerodhaPos.tradingsymbol,
                    quantity: zerodhaPos.quantity,
                    transaction_type: zerodhaPos.quantity > 0 ? 'BUY' : 'SELL',
                    price: zerodhaPos.average_price,
                    instrument_token: zerodhaPos.instrument_token,
                    exchange: zerodhaPos.exchange,
                    product: zerodhaPos.product
                });
            });

            // Update strategy with new positions
            await updateAlgoStrategy(strategy.strategyid, {
                instruments_details: updatedInstruments
            });

            // Show summary of changes
            if (changes.length > 0) {
                setSnackbar({
                    open: true,
                    message: `Positions synced! Changes: ${changes.join(', ')}`,
                    severity: 'success'
                });
            } else {
                setSnackbar({
                    open: true,
                    message: 'Positions are already in sync!',
                    severity: 'info'
                });
            }

            onStrategyUpdate && onStrategyUpdate();
        } catch (err) {
            setSnackbar({
                open: true,
                message: err?.response?.data?.error || err.message || 'Failed to sync positions',
                severity: 'error'
            });
        }
        setSyncingPositions(false);
    };

    // Strategy Notes Functions
    const handleViewMoreNotes = () => setShowNotesDialog(true);
    const handleCloseNotesDialog = () => setShowNotesDialog(false);
    const handleDeleteAllNotes = () => setShowDeleteNotesDialog(true);
    const handleCloseDeleteNotesDialog = () => setShowDeleteNotesDialog(false);

    const confirmDeleteAllNotes = async () => {
        setShowDeleteNotesDialog(false);
        setDeletingNotes(true);
        
        try {
            if (notes && notes.length > 0) {
                // Delete each note
                const deletePromises = notes.map(note => deleteStrategyNote(note.id));
                await Promise.all(deletePromises);
                
                setSnackbar({
                    open: true,
                    message: `Successfully deleted ${notes.length} note${notes.length > 1 ? 's' : ''}`,
                    severity: 'success'
                });
                
                // Clear notes locally
                setNotes([]);
                
                // Refresh strategy
                onStrategyUpdate && onStrategyUpdate();
            } else {
                setSnackbar({
                    open: true,
                    message: 'No notes found to delete',
                    severity: 'info'
                });
            }
        } catch (err) {
            setSnackbar({
                open: true,
                message: err?.response?.data?.error || err.message || 'Failed to delete notes',
                severity: 'error'
            });
        }
        setDeletingNotes(false);
    };

    const latestNotes = notes.slice(0, 5);
    const hasMoreNotes = notes.length > 5;

    return (
        <Card sx={{ mb: 3, width: '100%' }}>
            <CardContent>
                {/* Target Achievement Summary */}
                {typeof strategyTarget === 'number' && strategyTarget > 0 ? (
                    <Box sx={{ 
                        mb: 2,
                        p: 1.5,
                        borderRadius: 2,
                        border: '2px solid',
                        borderColor: targetAchievements.get(strategyTarget) ? 'success.main' : 'warning.main',
                        bgcolor: targetAchievements.get(strategyTarget) ? 'success.50' : 'warning.50',
                        boxShadow: 1
                    }}>
                        {/* Header Row */}
                        <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            mb: 1.5
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box sx={{
                                    width: 16,
                                    height: 16,
                                    borderRadius: '50%',
                                    bgcolor: targetAchievements.get(strategyTarget) ? 'success.main' : 'warning.main',
                                    animation: targetAchievements.get(strategyTarget) ? 'pulse 2s infinite' : 'none'
                                }} />
                                <Box>
                                    <Typography 
                                        variant="h6" 
                                        sx={{ 
                                            fontWeight: 800,
                                            color: targetAchievements.get(strategyTarget) ? 'success.main' : 'warning.main',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            fontSize: '1.1rem'
                                        }}
                                    >
                                        {targetAchievements.get(strategyTarget) ? '🎯 TARGET ACHIEVED!' : '🎯 TARGET PENDING'}
                                    </Typography>
                                    <Typography 
                                        variant="body2" 
                                        sx={{ 
                                            color: 'text.primary',
                                            fontWeight: 600
                                        }}
                                    >
                                        {targetAchievements.get(strategyTarget) 
                                            ? `Congratulations! Your strategy has exceeded the expected return of ₹${typeof strategyTarget === 'number' ? strategyTarget.toFixed(2) : '0.00'}`
                                            : `Working towards target: ₹${typeof strategyTarget === 'number' ? strategyTarget.toFixed(2) : '0.00'} | Current P/L: ₹${totalPL?.toFixed(2)}`
                                        }
                                    </Typography>
                                </Box>
                            </Box>
                            
                            {/* Compact P/L Display */}
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography 
                                    variant="h5" 
                                    sx={{ 
                                        fontWeight: 900,
                                        color: targetAchievements.get(strategyTarget) ? 'success.main' : 'warning.main',
                                        lineHeight: 1
                                    }}
                                >
                                    ₹{totalPL?.toFixed(2)}
                                </Typography>
                                <Typography 
                                    variant="caption" 
                                    sx={{ 
                                        color: 'text.primary',
                                        fontWeight: 600
                                    }}
                                >
                                    Current P/L
                                </Typography>
                            </Box>
                        </Box>

                        {/* Compact Target Management Row */}
                        <Box sx={{ 
                            display: 'grid',
                            gridTemplateColumns: '1fr auto auto',
                            gap: 2,
                            alignItems: 'center',
                            p: 1.5,
                            bgcolor: 'grey.50',
                            borderRadius: 1.5,
                            border: '1px solid',
                            borderColor: 'grey.200'
                        }}>
                            {/* Progress Bar */}
                            <Box sx={{ width: '100%' }}>
                                {!targetAchievements.get(strategyTarget) && typeof strategyTarget === 'number' && strategyTarget > 0 && (
                                    <>
                                        <Box sx={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            mb: 0.5
                                        }}>
                                            <Typography 
                                                variant="caption" 
                                                sx={{ 
                                                    color: typeof strategyTarget === 'number' ? getProgressColors(totalPL, strategyTarget).main : 'text.secondary',
                                                    fontWeight: 600
                                                }}
                                            >
                                                Progress to Target
                                            </Typography>
                                            <Typography 
                                                variant="caption" 
                                                sx={{ 
                                                    color: typeof strategyTarget === 'number' ? getProgressColors(totalPL, strategyTarget).main : 'text.secondary',
                                                    fontWeight: 600
                                                }}
                                            >
                                                {typeof strategyTarget === 'number' && strategyTarget > 0 ? Math.min(100, Math.max(0, (totalPL / strategyTarget) * 100)).toFixed(1) : '0.0'}%
                                            </Typography>
                                        </Box>
                                        <Box sx={{ 
                                            width: '100%', 
                                            height: 6, 
                                            bgcolor: 'grey.300',
                                            borderRadius: 3,
                                            overflow: 'hidden'
                                        }}>
                                            <Box sx={{ 
                                                width: `${typeof strategyTarget === 'number' && strategyTarget > 0 ? Math.min(100, Math.max(0, (totalPL / strategyTarget) * 100)) : 0}%`,
                                                height: '100%',
                                                bgcolor: typeof strategyTarget === 'number' ? getProgressColors(totalPL, strategyTarget).main : 'grey.400',
                                                borderRadius: 3,
                                                transition: 'width 0.5s ease-in-out'
                                            }} />
                                        </Box>
                                    </>
                                )}
                            </Box>

                            {/* Target Input */}
                            <TextField
                                label="Expected Return"
                                type="number"
                                value={editState.expected_return}
                                onChange={e => handleEditChange('expected_return', e.target.value)}
                                size="small"
                                sx={{ minWidth: 120 }}
                                inputProps={{ min: 0, step: 0.01 }}
                                placeholder="Target value"
                            />

                            {/* Update Button */}
                            <Button
                                variant="outlined"
                                color="primary"
                                size="small"
                                onClick={handleUpdate}
                                disabled={updating}
                                sx={{ minWidth: 80 }}
                            >
                                {updating ? '...' : 'Update'}
                            </Button>
                        </Box>
                    </Box>
                ) : (
                    /* Set New Target Section */
                    <Box sx={{ 
                        mb: 2,
                        p: 1.5,
                        borderRadius: 2,
                        border: '2px dashed',
                        borderColor: 'grey.400',
                        bgcolor: 'grey.50',
                        textAlign: 'center'
                    }}>
                        <Typography variant="h6" sx={{ mb: 1.5, color: 'text.secondary', fontWeight: 600 }}>
                            🎯 No Target Set
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1.5, color: 'text.secondary' }}>
                            Set a target to start tracking your strategy's performance
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', maxWidth: 350, mx: 'auto' }}>
                            <TextField
                                label="Expected Return"
                                type="number"
                                value={editState.expected_return}
                                onChange={e => handleEditChange('expected_return', e.target.value)}
                                size="small"
                                sx={{ flexGrow: 1 }}
                                inputProps={{ min: 0, step: 0.01 }}
                                placeholder="Enter target value"
                            />
                            <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                onClick={handleUpdate}
                                disabled={updating}
                                sx={{ minWidth: 80 }}
                            >
                                {updating ? '...' : 'Set Target'}
                            </Button>
                        </Box>
                    </Box>
                )}
                
                {/* Strategy Configuration Section */}
                <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2fr 2fr 1fr auto' },
                    gap: 1, 
                    mb: 2, 
                    alignItems: 'center' 
                }}>
                    <TextField
                        label="Strategy Type"
                        value={editState.strategy_type || ''}
                        onChange={e => handleEditChange('strategy_type', e.target.value)}
                        size="small"
                        fullWidth
                    />
                    <TextField
                        label="Underlying Instrument"
                        value={editState.underlying_instrument || ''}
                        onChange={e => handleEditChange('underlying_instrument', e.target.value)}
                        size="small"
                        fullWidth
                    />
                    <TextField
                        select
                        label="Status"
                        value={editState.status || ''}
                        onChange={e => handleEditChange('status', e.target.value)}
                        size="small"
                        fullWidth
                    >
                        {STATUS_OPTIONS.map(opt => (
                            <MenuItem key={opt} value={opt}>
                                {opt}
                            </MenuItem>
                        ))}
                    </TextField>
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={handleUpdate}
                        disabled={updating}
                        sx={{ minWidth: 80 }}
                    >
                        {updating ? '...' : 'Update'}
                    </Button>
                </Box>

                {/* Tracking Positions Section */}
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' }, 
                    gap: 2, 
                    mb: 2,
                    flexWrap: 'wrap'
                }}>
                    <Typography sx={{ fontWeight: 1000 }}>
                        Tracking Positions
                    </Typography>
                    <Typography sx={{ fontWeight: 1000 }}>
                        LTP: {underlyingInstrumentToken && zerodhaWebSocketData?.[underlyingInstrumentToken]?.ltp ? 
                            zerodhaWebSocketData[underlyingInstrumentToken].ltp : 
                            'Loading...'}
                        {!isMarketOpen() && 
                         <span style={{ fontSize: '0.8em', color: 'orange', marginLeft: '8px' }}>
                             (Market Closed)
                         </span>}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, ml: { xs: 0, sm: 'auto' } }}>
                        <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            onClick={handleOpenAddPosition}
                            startIcon={<AddIcon />}
                        >
                            Add Position
                        </Button>
                        <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            onClick={handleSyncPositions}
                            disabled={syncingPositions}
                        >
                            {syncingPositions ? 'Syncing...' : 'Sync Positions'}
                        </Button>
                        <Button
                            variant="contained"
                            color="secondary"
                            size="small"
                            onClick={() => handleOpenOrderPopup(strategy.instruments_details, strategy)}
                        >
                            Create Orders
                        </Button>
                    </Box>
                </Box>

                {/* Positions Table */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                        {Array.isArray(strategy.instruments_details) ? 
                            `${strategy.instruments_details.filter(inst => inst.quantity !== 0).length} Active, ${strategy.instruments_details.filter(inst => inst.quantity === 0).length} Closed` : 
                            'No positions'}
                    </Typography>
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setShowClosedPositions(!showClosedPositions)}
                        sx={{ fontSize: '0.75rem' }}
                    >
                        {showClosedPositions ? 'Hide Closed' : 'Show Closed'}
                    </Button>
                </Box>
                <Table size="small" sx={{ mb: 2, borderRadius: 2, overflow: 'hidden', boxShadow: 1 }}>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: 'primary.main' }}>
                            <TableCell sx={{ p: 1, fontWeight: 700, color: 'white', fontSize: '0.875rem', textAlign: 'left' }}>
                                Trading Symbol
                            </TableCell>
                            <TableCell sx={{ p: 1, fontWeight: 700, color: 'white', fontSize: '0.875rem', textAlign: 'center' }}>
                                Quantity
                            </TableCell>
                            <TableCell sx={{ p: 1, fontWeight: 700, color: 'white', fontSize: '0.875rem', textAlign: 'center' }}>
                                Type
                            </TableCell>
                            <TableCell sx={{ p: 1, fontWeight: 700, color: 'white', fontSize: '0.875rem', textAlign: 'right' }}>
                                Entry Price
                            </TableCell>
                            <TableCell sx={{ p: 1, fontWeight: 700, color: 'white', fontSize: '0.875rem', textAlign: 'right' }}>
                                LTP
                            </TableCell>
                            <TableCell sx={{ p: 1, fontWeight: 700, color: 'white', fontSize: '0.875rem', textAlign: 'right' }}>
                                Ask Price
                            </TableCell>
                            <TableCell sx={{ p: 1, fontWeight: 700, color: 'white', fontSize: '0.875rem', textAlign: 'right' }}>
                                Bid Price
                            </TableCell>
                            <TableCell sx={{ p: 1, fontWeight: 700, color: 'white', fontSize: '0.875rem', textAlign: 'right' }}>
                                P/L
                            </TableCell>
                            <TableCell sx={{ p: 1, fontWeight: 700, color: 'white', fontSize: '0.875rem', textAlign: 'right' }}>
                                P/L(MP)
                            </TableCell>
                            <TableCell sx={{ p: 1, fontWeight: 700, color: 'white', fontSize: '0.875rem', textAlign: 'center' }}>
                                Actions
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Array.isArray(strategy.instruments_details) && 
                         strategy.instruments_details
                             .filter(inst => showClosedPositions || inst.quantity !== 0)
                             .map((inst, idx) => (
                            <TableRow key={idx} sx={{
                                backgroundColor: inst.quantity === 0 ? 'grey.100' : 
                                               idx % 2 === 0 ? 'grey.50' : 'white',
                                opacity: inst.quantity === 0 ? 0.6 : 1,
                                '&:hover': {
                                    backgroundColor: inst.quantity === 0 ? 'grey.200' : 'grey.100',
                                    transition: 'background-color 0.2s ease'
                                }
                            }}>
                                <TableCell sx={{
                                    p: 0.5, fontSize: 14,
                                    color: inst.quantity === 0 ? 'text.secondary' : 'text.primary',
                                    fontWeight: 500,
                                    textDecoration: inst.quantity === 0 ? 'line-through' : 'none',
                                    textAlign: 'left'
                                }}>{inst.tradingsymbol} {inst.quantity === 0 && '(CLOSED)'}</TableCell>
                                <TableCell sx={{
                                    p: 0.5, fontSize: 14,
                                    color: inst.quantity === 0 ? 'text.secondary' : 
                                           inst.quantity < 0 ? 'error.main' : 'success.main',
                                    fontWeight: inst.quantity < 0 ? 700 : 600,
                                    textAlign: 'center'
                                }}>{inst.quantity}</TableCell>
                                <TableCell sx={{ p: 0.5, fontSize: 14, textAlign: 'center' }}>
                                    <Box sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        px: 1.5,
                                        py: 0.5,
                                        borderRadius: 1,
                                        backgroundColor: inst.transaction_type === 'BUY' ? 'success.light' : 'error.light',
                                        color: inst.transaction_type === 'BUY' ? 'success.dark' : 'error.dark',
                                        fontWeight: 600,
                                        fontSize: '0.75rem',
                                        textTransform: 'uppercase'
                                    }}>
                                        {inst.transaction_type}
                                    </Box>
                                </TableCell>
                                <TableCell sx={{ p: 0.5, fontSize: 14, textAlign: 'right' }}>
                                    {inst.price}
                                </TableCell>
                                <TableCell sx={{ p: 0.5, fontSize: 14, textAlign: 'right' }}>
                                    {zerodhaWebSocketData?.[inst.instrument_token]?.ltp}
                                </TableCell>
                                <TableCell sx={{ p: 0.5, fontSize: 14, textAlign: 'right' }}>
                                    {zerodhaWebSocketData?.[inst.instrument_token]?.tick_current_ask_price || 
                                     (isMarketOpen() ? 'No Data' : 'Market Closed')}
                                </TableCell>
                                <TableCell sx={{ p: 0.5, fontSize: 14, textAlign: 'right' }}>
                                    {zerodhaWebSocketData?.[inst.instrument_token]?.tick_current_bid_price || 
                                     (isMarketOpen() ? 'No Data' : 'Market Closed')}
                                </TableCell>
                                <TableCell sx={{ p: 0.5, fontSize: 14, textAlign: 'right' }}>
                                    {(() => {
                                        const ltp = zerodhaWebSocketData?.[inst.instrument_token]?.ltp;
                                        const price = inst.price;
                                        if (!ltp || !price) return '-';

                                        const pl = inst.quantity > 0
                                            ? (ltp - price) * inst.quantity
                                            : (ltp - price) * inst.quantity;

                                        return (
                                            <Box sx={{
                                                color: pl >= 0 ? 'success.main' : 'error.main',
                                                fontWeight: 600,
                                                fontSize: '0.875rem'
                                            }}>
                                                {pl >= 0 ? '+' : ''}{pl.toFixed(2)}
                                            </Box>
                                        );
                                    })()}
                                </TableCell>
                                <TableCell sx={{ p: 0.5, fontSize: 14, textAlign: 'right' }}>
                                    {(() => {
                                        const askPrice = zerodhaWebSocketData?.[inst.instrument_token]?.tick_current_ask_price;
                                        const bidPrice = zerodhaWebSocketData?.[inst.instrument_token]?.tick_current_bid_price;
                                        const price = inst.price;
                                        
                                        if (!askPrice || !bidPrice || !price) {
                                            return (
                                                <Box sx={{
                                                    color: 'text.secondary',
                                                    fontSize: '0.75rem',
                                                    fontStyle: 'italic'
                                                }}>
                                                    {isMarketOpen() ? 'No Data' : 'Market Closed'}
                                                </Box>
                                            );
                                        }

                                        const pl = inst.quantity > 0
                                            ? (bidPrice - price) * inst.quantity
                                            : (askPrice - price) * inst.quantity;

                                        return (
                                            <Box sx={{
                                                color: pl >= 0 ? 'success.main' : 'error.main',
                                                fontWeight: 600,
                                                fontSize: '0.875rem'
                                            }}>
                                                {pl >= 0 ? '+' : ''}{pl.toFixed(2)}
                                            </Box>
                                        );
                                    })()}
                                </TableCell>
                                <TableCell sx={{ p: 0.5, textAlign: 'center' }}>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleDeletePosition(idx)}
                                        sx={{ color: 'error.main' }}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        <TableRow sx={{ backgroundColor: 'grey.100', borderTop: '2px solid', borderTopColor: 'primary.main' }}>
                            <TableCell colSpan={7} sx={{ p: 1, fontWeight: 700, textAlign: 'right', fontSize: '0.875rem' }}>
                                Total P/L:
                            </TableCell>
                            <TableCell sx={{
                                p: 1,
                                fontWeight: 700,
                                color: totalPL < 0 ? 'error.main' : 'success.main',
                                fontSize: '1rem',
                                textAlign: 'center'
                            }}>
                                {totalPL >= 0 ? '+' : ''}{totalPL?.toFixed(2) || '-'}
                            </TableCell>
                            <TableCell sx={{
                                p: 1,
                                fontWeight: 700,
                                color: totalPLMP < 0 ? 'error.main' : 'success.main',
                                fontSize: '1rem',
                                textAlign: 'center'
                            }}>
                                {totalPLMP >= 0 ? '+' : ''}{totalPLMP?.toFixed(2) || '-'}
                            </TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                {/* Automated Orders Section */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography sx={{ fontWeight: 1000 }}>
                        Automated Orders
                    </Typography>
                    {/* Status Polling Indicator */}
                    {orders.some(order => order.status === 'SENT TO ZERODHA') && (
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            px: 1.5,
                            py: 0.5,
                            bgcolor: 'info.50',
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'info.200'
                        }}>
                            <Box sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: 'info.main',
                                animation: 'pulse 2s infinite'
                            }} />
                            <Typography variant="caption" color="info.main" sx={{ fontWeight: 600 }}>
                                Live Status Monitoring
                            </Typography>
                        </Box>
                    )}
                </Box>
                {Array.isArray(strategy.automated_order_ids) && strategy.automated_order_ids.length > 0 ? (
                    <AutomatedOrdersTable
                        orders={orders}
                        onRefresh={fetchOrders}
                        onStatusCheck={handleManualStatusCheck}
                        checkingStatus={checkingOrderStatuses}
                        strategyId={strategy.strategyid}
                    />
                ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        No automated orders found for this strategy.
                    </Typography>
                )}

                <Divider sx={{ my: 2 }} />

                {/* Strategy Notes Section */}
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 2
                }}>
                    <Typography variant="h6">
                        Strategy Notes
                    </Typography>
                    {notes.length > 0 && (
                        <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={handleDeleteAllNotes}
                            disabled={deletingNotes}
                            startIcon={<DeleteIcon />}
                        >
                            {deletingNotes ? 'Deleting...' : 'Delete All'}
                        </Button>
                    )}
                </Box>

                {notesLoading ? (
                    <CircularProgress size={24} />
                ) : latestNotes.length === 0 ? (
                    <Typography color="text.secondary">No notes yet.</Typography>
                ) : (
                    <>
                        {latestNotes.map(note => (
                            <Box key={note.id} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1, boxShadow: 1 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
                                    {new Date(note.timestamp).toLocaleString()}
                                </Typography>
                                <Typography variant="body1">{note.notes}</Typography>
                            </Box>
                        ))}
                        {hasMoreNotes && (
                            <Link component="button" onClick={handleViewMoreNotes} sx={{ mt: 1 }}>
                                View More
                            </Link>
                        )}
                    </>
                )}

                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Strategy ID: {strategy.strategyid}
                </Typography>
            </CardContent>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Create Automated Order Popup */}
            <CreateAutomatedOrderPopup
                open={showOrderPopup}
                onClose={handleCloseOrderPopup}
                positions={orderPopupPositions}
                onSuccess={handleOrderPopupSuccess}
                strategyDetails={orderPopupStrategyDetails}
            />

            {/* Add Position Popup */}
            <Dialog
                open={showAddPositionPopup}
                onClose={handleCloseAddPosition}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Add Positions to Strategy</DialogTitle>
                <DialogContent>
                    <TableContainer component={Paper} sx={{ mt: 2 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox"></TableCell>
                                    <TableCell>Trading Symbol</TableCell>
                                    <TableCell>Quantity</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Average Price</TableCell>
                                    <TableCell>LTP</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {openPositions.map((position) => {
                                    const isSelected = selectedPositions.some(p => p.tradingsymbol === position.tradingsymbol);
                                    return (
                                        <TableRow
                                            key={position.tradingsymbol}
                                            hover
                                            onClick={() => handlePositionSelect(position)}
                                            sx={{
                                                cursor: 'pointer',
                                                backgroundColor: isSelected ? 'action.selected' : 'inherit'
                                            }}
                                        >
                                            <TableCell padding="checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handlePositionSelect(position)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </TableCell>
                                            <TableCell>{position.tradingsymbol}</TableCell>
                                            <TableCell sx={{
                                                color: position.quantity < 0 ? 'error.main' : 'text.primary',
                                                fontWeight: position.quantity < 0 ? 700 : 500
                                            }}>
                                                {position.quantity}
                                            </TableCell>
                                            <TableCell>
                                                {position.quantity > 0 ? 'BUY' : 'SELL'}
                                            </TableCell>
                                            <TableCell>{position.average_price}</TableCell>
                                            <TableCell>
                                                {zerodhaWebSocketData?.[position.instrument_token]?.ltp}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseAddPosition}>Cancel</Button>
                    <Button
                        onClick={handleAddPosition}
                        variant="contained"
                        disabled={selectedPositions.length === 0}
                    >
                        Add Selected Positions
                    </Button>
                </DialogActions>
            </Dialog>

            {/* All Notes Dialog */}
            <Dialog open={showNotesDialog} onClose={handleCloseNotesDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    All Notes
                    <IconButton
                        aria-label="close"
                        onClick={handleCloseNotesDialog}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ maxHeight: 500 }}>
                    {notes.length === 0 ? (
                        <Typography color="text.secondary">No notes yet.</Typography>
                    ) : (
                        notes.map(note => (
                            <Box key={note.id} sx={{ mb: 2, p: 1, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
                                    {new Date(note.timestamp).toLocaleString()}
                                </Typography>
                                <Typography variant="body1">{note.notes}</Typography>
                            </Box>
                        ))
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete All Notes Confirmation Dialog */}
            <Dialog
                open={showDeleteNotesDialog}
                onClose={handleCloseDeleteNotesDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ color: 'error.main' }}>
                    Delete All Notes
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Are you sure you want to delete all notes for this strategy?
                    </Typography>
                    <Typography variant="body2" color="error.main" sx={{ fontWeight: 500 }}>
                        ⚠️ This action cannot be undone and will permanently remove all {notes.length} strategy note{notes.length > 1 ? 's' : ''}.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={handleCloseDeleteNotesDialog}
                        disabled={deletingNotes}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={confirmDeleteAllNotes}
                        variant="contained"
                        color="error"
                        disabled={deletingNotes}
                        startIcon={<DeleteIcon />}
                    >
                        {deletingNotes ? 'Deleting...' : 'Delete All Notes'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
};

export default StrategyCard;
