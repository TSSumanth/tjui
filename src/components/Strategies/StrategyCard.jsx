import React, { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    Typography,
    Box,
    Button,
    Stack,
    CircularProgress,
    Alert,
    Chip,
    Divider,
    useTheme,
    Dialog,
} from "@mui/material";
import { Link } from "react-router-dom";
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { updateStrategy, getOpenStrategies } from '../../services/strategies';
import { getStockTradesbyId, getOptionTradesbyId, addNewOptionTrade, addNewStockTrade, updateStockTrade, updateOptionTrade } from '../../services/trades';
import { StockTradeForm } from "../Trades/StockTradeForm.jsx";
import OptionTradeForm from "../Trades/OptionTradeForm.jsx";

const StrategyCard = ({ strategy }) => {
    const theme = useTheme();
    const [showCreateStockTrade, setShowCreateStockTrade] = useState(false);
    const [showCreateOptionTrade, setShowCreateOptionTrade] = useState(false);
    const [showUpdateTrade, setShowUpdateTrade] = useState(false);
    const [selectedTrade, setSelectedTrade] = useState(null);
    const [trades, setTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [overallReturn, setOverallReturn] = useState(0);

    const fetchTrades = async () => {
        try {
            setLoading(true);

            // Get trade IDs from the strategy object
            const stockTradeIds = strategy.stock_trades || [];
            const optionTradeIds = strategy.option_trades || [];

            console.log('Strategy trade IDs:', {
                stock_trades: stockTradeIds,
                option_trades: optionTradeIds
            });

            // Only fetch trades if there are trade IDs
            if (stockTradeIds.length === 0 && optionTradeIds.length === 0) {
                console.log('No trade IDs found in strategy');
                setTrades([]);
                setOverallReturn(0);
                return;
            }

            // Fetch trades in parallel
            const [stockTrades, optionTrades] = await Promise.all([
                Promise.all(stockTradeIds.map(async (id) => {
                    try {
                        const trade = await getStockTradesbyId(id);
                        console.log(`Stock trade ${id}:`, trade);
                        return trade;
                    } catch (error) {
                        console.error(`Error fetching stock trade ${id}:`, error);
                        return null;
                    }
                })),
                Promise.all(optionTradeIds.map(async (id) => {
                    try {
                        const trade = await getOptionTradesbyId(id);
                        console.log(`Option trade ${id}:`, trade);
                        return trade;
                    } catch (error) {
                        console.error(`Error fetching option trade ${id}:`, error);
                        return null;
                    }
                }))
            ]);

            // Process and sort trades
            const processedTrades = [
                ...stockTrades
                    .filter(trade => trade && (Array.isArray(trade) ? trade.length > 0 : true))
                    .map(trade => {
                        const tradeData = Array.isArray(trade) ? trade[0] : trade;
                        console.log('Processing stock trade:', tradeData);
                        return {
                            ...tradeData,
                            type: 'stock',
                            status: tradeData.status || 'OPEN',
                            tradeid: tradeData.tradeid || tradeData.id,
                            displayQuantity: tradeData.lotsize && tradeData.lotsize > 0
                                ? (tradeData.openquantity / tradeData.lotsize)
                                : tradeData.openquantity
                        };
                    }),
                ...optionTrades
                    .filter(trade => trade && (Array.isArray(trade) ? trade.length > 0 : true))
                    .map(trade => {
                        const tradeData = Array.isArray(trade) ? trade[0] : trade;
                        console.log('Processing option trade:', tradeData);
                        return {
                            ...tradeData,
                            type: 'option',
                            status: tradeData.status || 'OPEN',
                            tradeid: tradeData.tradeid || tradeData.id,
                            displayQuantity: tradeData.lotsize && tradeData.lotsize > 0
                                ? (tradeData.openquantity / tradeData.lotsize)
                                : tradeData.openquantity
                        };
                    })
            ].sort((a, b) => {
                // Sort by status (OPEN first) and then by entry date
                if (a.status === 'OPEN' && b.status !== 'OPEN') return -1;
                if (a.status !== 'OPEN' && b.status === 'OPEN') return 1;
                return new Date(b.entrydate || 0) - new Date(a.entrydate || 0);
            });

            console.log('Final processed trades:', processedTrades);

            if (processedTrades.length === 0) {
                console.log('No trades found after processing');
            }

            setTrades(processedTrades);
            setOverallReturn(processedTrades.reduce((sum, trade) => {
                const pl = parseFloat(trade.realizedpl || trade.overallreturn || 0);
                return sum + pl;
            }, 0));
        } catch (error) {
            console.error('Error in fetchTrades:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStockTradeSubmit = async (tradeDetails) => {
        try {
            const response = await addNewStockTrade({ ...tradeDetails, strategy_id: strategy.id });
            if (response?.created) {
                await updateStrategy(strategy.id, { stock_trades: [...(strategy.stock_trades || []), response.data.tradeid] });
                setShowCreateStockTrade(false);
                fetchTrades();
            }
        } catch (error) {
            console.error("Error creating stock trade:", error);
        }
    };

    const handleOptionTradeSubmit = async (tradeDetails) => {
        try {
            const response = await addNewOptionTrade({ ...tradeDetails, strategy_id: strategy.id });
            if (response?.created) {
                await updateStrategy(strategy.id, { option_trades: [...(strategy.option_trades || []), response.data.tradeid] });
                setShowCreateOptionTrade(false);
                fetchTrades();
            }
        } catch (error) {
            console.error("Error creating option trade:", error);
        }
    };

    const handleTradeClick = (trade) => {
        console.log('Trade clicked:', trade);
        // Prepare trade data for the update form   
        const tradeData = {
            ...trade,
            tradeid: trade.tradeid || trade.id,
            tradetype: trade.tradetype || 'LONG',
            quantity: trade.quantity || trade.openquantity,
            entryprice: trade.entryprice || 0,
            capitalused: trade.capitalused || 0,
            entrydate: trade.entrydate || '',
            openquantity: trade.openquantity || 0,
            closedquantity: trade.closedquantity || 0,
            exitaverageprice: trade.exitaverageprice || 0,
            finalexitprice: trade.finalexitprice || '',
            status: trade.status || 'OPEN',
            overallreturn: trade.overallreturn || '',
            exitdate: trade.exitdate || '',
            lastmodifieddate: trade.lastmodifieddate || '',
            notes: trade.notes || '',
            tags: trade.tags || '',
            ltp: trade.ltp || 0
        };
        setSelectedTrade(tradeData);
        setShowUpdateTrade(true);
    };

    const handleUpdateTrade = async (updatedTrade) => {
        try {
            console.log('Updating trade:', updatedTrade);
            if (selectedTrade.lotsize === undefined) {
                await updateStockTrade(updatedTrade);
            } else {
                await updateOptionTrade(updatedTrade);
            }
            // Refresh trades after update
            fetchTrades();
            setShowUpdateTrade(false);
        } catch (error) {
            console.error('Error updating trade:', error);
        }
    };

    const TradeCard = ({ trade }) => {
        const theme = useTheme();
        const isPLPositive = (trade.unrealizedpl || 0) >= 0;

        return (
            <Box
                onClick={() => handleTradeClick(trade)}
                sx={{
                    p: 2.5,
                    bgcolor: '#ffffff',
                    borderRadius: 2,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    height: '100%',
                    minHeight: '120px',
                    width: '100%',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    border: `1px solid ${theme.palette.divider}`,
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                        bgcolor: '#f8f9fa',
                        border: `1px solid ${theme.palette.primary.main}`
                    }
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <ShowChartIcon sx={{ mr: 1.5, color: theme.palette.primary.main }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: "bold", flexGrow: 1, mr: 2, color: '#2c3e50' }}>
                        {trade.asset}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                            label={`${trade.displayQuantity} units`}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ minWidth: '80px', borderColor: theme.palette.primary.main }}
                        />
                        <Chip
                            label={trade.status}
                            size="small"
                            color={trade.status === 'OPEN' ? "success" : "default"}
                            variant="outlined"
                            sx={{ minWidth: '70px', borderColor: trade.status === 'OPEN' ? theme.palette.success.main : theme.palette.grey[400] }}
                        />
                    </Box>
                </Box>
                <Divider sx={{ my: 1.5, borderColor: theme.palette.divider }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Type
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#2c3e50' }}>
                            {trade.type}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Entry Price
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#2c3e50' }}>
                            ₹{trade.entryprice}
                        </Typography>
                    </Box>
                    {trade.lotsize && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Lot Size
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#2c3e50' }}>
                                {trade.lotsize} units
                            </Typography>
                        </Box>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            {trade.status === 'OPEN' ? 'Unrealized P/L' : 'Realized P/L'}
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                fontWeight: 'bold',
                                color: isPLPositive ? theme.palette.success.main : theme.palette.error.main
                            }}
                        >
                            {isPLPositive ? '+' : ''}₹{(trade.status === 'OPEN' ? trade.unrealizedpl : trade.realizedpl) || 0}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        );
    };

    return (
        <Card
            sx={{
                width: '100%',
                borderRadius: 3,
                boxShadow: 3,
                transition: 'transform 0.2s, box-shadow 0.2s',
                background: 'linear-gradient(145deg, #f8f9fa 0%, #e9ecef 100%)',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                }
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: "bold", display: 'flex', alignItems: 'center', color: '#2c3e50' }}>
                        <Typography component="span" sx={{ mr: 1.5, color: theme.palette.primary.main, fontWeight: 'bold' }}>₹</Typography>
                        {strategy.name}
                    </Typography>
                    <Chip
                        label="Active"
                        color="success"
                        size="small"
                        variant="outlined"
                        sx={{ px: 1, borderColor: theme.palette.success.main }}
                    />
                </Box>

                <Box
                    sx={{
                        mt: 3,
                        mb: 4,
                        p: 3,
                        borderRadius: 2,
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        border: `1px solid ${theme.palette.divider}`,
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: "bold", display: 'flex', alignItems: 'center' }}>
                            <ShowChartIcon sx={{ mr: 1.5, color: theme.palette.primary.main }} />
                            Open Positions
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                onClick={() => setShowCreateStockTrade(true)}
                            >
                                Add Stock Trade
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                onClick={() => setShowCreateOptionTrade(true)}
                            >
                                Add Option Trade
                            </Button>
                        </Box>
                    </Box>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : trades.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                            No open trades found
                        </Typography>
                    ) : (
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: {
                                    xs: '1fr',
                                    sm: 'repeat(2, minmax(0, 1fr))',
                                    md: 'repeat(3, minmax(0, 1fr))',
                                    lg: 'repeat(4, minmax(0, 1fr))',
                                    xl: 'repeat(5, minmax(0, 1fr))'
                                },
                                gap: 3,
                                width: '100%'
                            }}
                        >
                            {trades.map((trade) => (
                                <Box key={trade.tradeid} sx={{ width: '100%' }}>
                                    <TradeCard trade={trade} />
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box>

                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 3,
                        borderRadius: 2,
                        bgcolor: overallReturn >= 0 ? theme.palette.success.light : theme.palette.error.light,
                        color: overallReturn >= 0 ? theme.palette.success.contrastText : theme.palette.error.contrastText
                    }}
                >
                    <Typography variant="h6" sx={{ fontWeight: "bold", display: 'flex', alignItems: 'center' }}>
                        {overallReturn >= 0 ? <TrendingUpIcon sx={{ mr: 1.5 }} /> : <TrendingDownIcon sx={{ mr: 1.5 }} />}
                        Overall Realized P/L
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                        {overallReturn >= 0 ? '+' : ''}₹{overallReturn.toLocaleString('en-IN')}
                    </Typography>
                </Box>

                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        component={Link}
                        to={`/updatestrategy/${strategy.id}`}
                        variant="contained"
                        color="primary"
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            px: 4,
                            py: 1.5,
                            fontSize: '1rem'
                        }}
                    >
                        View Details
                    </Button>
                </Box>
            </CardContent>

            <Dialog
                open={showCreateStockTrade}
                onClose={() => setShowCreateStockTrade(false)}
                maxWidth="md"
                fullWidth
            >
                <StockTradeForm
                    title='Create Stock Trade'
                    onSubmit={handleStockTradeSubmit}
                    onCancel={() => setShowCreateStockTrade(false)}
                    strategyid={strategy.id}
                />
            </Dialog>

            <Dialog
                open={showCreateOptionTrade}
                onClose={() => setShowCreateOptionTrade(false)}
                maxWidth="md"
                fullWidth
            >
                <OptionTradeForm
                    title='Create Option Trade'
                    onSubmit={handleOptionTradeSubmit}
                    onCancel={() => setShowCreateOptionTrade(false)}
                    strategyid={strategy.id}
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
                            title='Update Stock Trade'
                            onSubmit={handleUpdateTrade}
                            onCancel={() => setShowUpdateTrade(false)}
                            strategyid={strategy.id}
                            currentTrade={selectedTrade}
                            isUpdate={true}
                        />
                    ) : (
                        <OptionTradeForm
                            title='Update Option Trade'
                            onSubmit={handleUpdateTrade}
                            onCancel={() => setShowUpdateTrade(false)}
                            strategyid={strategy.id}
                            currentTrade={selectedTrade}
                            isUpdate={true}
                        />
                    )
                )}
            </Dialog>
        </Card>
    );
};

const StrategyCards = () => {
    const [openStrategies, setOpenStrategies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStrategies = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await getOpenStrategies();
                console.log('Fetched strategies response:', response);

                const strategies = await Promise.all(
                    response.map(async (element) => {
                        console.log('Processing strategy:', element);
                        return {
                            id: element.id,
                            name: element.name,
                            description: element.description,
                            stock_trades: element.stock_trades || [],
                            option_trades: element.option_trades || []
                        };
                    })
                );

                console.log('Final strategies:', strategies);
                setOpenStrategies(strategies);
            } catch (error) {
                console.error("Error fetching strategies:", error);
                setError("Failed to fetch strategies. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchStrategies();
    }, []);

    return (
        <Stack spacing={4}>
            <Typography variant="h4" sx={{
                fontWeight: "bold",
                textAlign: "center",
                color: 'primary.main',
                mb: 6,
                mt: 4
            }}>
                Open Strategies
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mx: 3 }}>
                    {error}
                </Alert>
            )}

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", my: 6 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        px: 3,
                        pb: 4
                    }}
                >
                    {openStrategies.length > 0 ? (
                        openStrategies.map((strategy) => (
                            <StrategyCard key={strategy.id} strategy={strategy} />
                        ))
                    ) : (
                        <Box
                            sx={{
                                p: 6,
                                textAlign: 'center',
                                bgcolor: 'background.paper',
                                borderRadius: 2,
                                boxShadow: 1
                            }}
                        >
                            <Typography variant="h6" color="text.secondary">
                                No Open Strategies Found
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                                Create a new strategy to get started
                            </Typography>
                        </Box>
                    )}
                </Box>
            )}
        </Stack>
    );
};

export default StrategyCards;