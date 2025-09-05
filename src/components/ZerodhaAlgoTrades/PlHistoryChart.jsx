import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    LinearProgress,
    Alert,
    Tooltip
} from '@mui/material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    ReferenceLine,
    Legend
} from 'recharts';
import {
    TrendingUp,
    TrendingDown,
    ShowChart,
    Close,
    Refresh
} from '@mui/icons-material';
import { getStrategyPlHistory, formatPlHistoryForChart, getPlStatistics } from '../../services/strategyPlHistory';
import moment from 'moment';

const PlHistoryChart = ({ strategyId, strategyName, isOpen }) => {
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showChart, setShowChart] = useState(false);
    const [timeRange, setTimeRange] = useState('7d');
    const [statistics, setStatistics] = useState(null);

    // Time range options
    const timeRangeOptions = [
        { value: '1d', label: 'Last 24 Hours' },
        { value: '3d', label: 'Last 3 Days' },
        { value: '7d', label: 'Last 7 Days' },
        { value: '30d', label: 'Last 30 Days' },
        { value: '90d', label: 'Last 90 Days' }
    ];

    // Calculate date range based on selection
    const getDateRange = (range) => {
        const now = new Date();
        const startDate = new Date();
        
        switch (range) {
            case '1d':
                startDate.setDate(now.getDate() - 1);
                break;
            case '3d':
                startDate.setDate(now.getDate() - 3);
                break;
            case '7d':
                startDate.setDate(now.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(now.getDate() - 30);
                break;
            case '90d':
                startDate.setDate(now.getDate() - 90);
                break;
            default:
                startDate.setDate(now.getDate() - 7);
        }
        
        return {
            startDate: startDate.toISOString(),
            endDate: now.toISOString()
        };
    };

    // Fetch P/L history data
    const fetchPlHistory = useCallback(async () => {
        if (!strategyId || !isOpen) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const { startDate, endDate } = getDateRange(timeRange);
            const response = await getStrategyPlHistory(strategyId, {
                startDate,
                endDate,
                limit: 1000
            });
            
            if (response.success && response.data) {
                const formattedData = formatPlHistoryForChart(response.data);
                setChartData(formattedData);
                
                // Calculate statistics
                const stats = getPlStatistics(response.data);
                setStatistics(stats);
            } else {
                setChartData([]);
                setStatistics(null);
            }
        } catch (err) {
            console.error('Error fetching P/L history:', err);
            setError('Failed to fetch P/L history data');
            setChartData([]);
            setStatistics(null);
        } finally {
            setLoading(false);
        }
    }, [strategyId, isOpen, timeRange]);

    // Fetch data when component mounts or time range changes
    useEffect(() => {
        if (showChart && strategyId && isOpen) {
            fetchPlHistory();
        }
    }, [showChart, strategyId, isOpen, timeRange, fetchPlHistory]);


    // Custom tooltip for the chart
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <Box sx={{ 
                    bgcolor: 'background.paper', 
                    p: 1.5, 
                    borderRadius: 1, 
                    boxShadow: 2,
                    border: '1px solid',
                    borderColor: 'divider'
                }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        {label}
                    </Typography>
                    {payload.map((entry, index) => (
                        <Typography 
                            key={index} 
                            variant="body2" 
                            sx={{ color: entry.color }}
                        >
                            {entry.name}: ₹{entry.value?.toFixed(2)}
                        </Typography>
                    ))}
                </Box>
            );
        }
        return null;
    };

    // Handle chart dialog open/close
    const handleOpenChart = () => {
        setShowChart(true);
    };

    const handleCloseChart = () => {
        setShowChart(false);
    };

    // Handle refresh
    const handleRefresh = () => {
        fetchPlHistory();
    };

    // Don't render if strategy is not open
    if (!isOpen) {
        return null;
    }

    return (
        <>
            {/* Chart Button */}
            <Tooltip title="View P/L History Chart">
                <IconButton
                    onClick={handleOpenChart}
                    size="small"
                    sx={{ 
                        color: 'primary.main',
                        '&:hover': { bgcolor: 'primary.50' }
                    }}
                >
                    <ShowChart />
                </IconButton>
            </Tooltip>

            {/* Chart Dialog */}
            <Dialog
                open={showChart}
                onClose={handleCloseChart}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: { minHeight: '600px' }
                }}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ShowChart color="primary" />
                            <Typography variant="h6">
                                P/L History - {strategyName}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>Time Range</InputLabel>
                                <Select
                                    value={timeRange}
                                    label="Time Range"
                                    onChange={(e) => setTimeRange(e.target.value)}
                                >
                                    {timeRangeOptions.map(option => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <IconButton onClick={handleRefresh} disabled={loading}>
                                <Refresh />
                            </IconButton>
                            <IconButton onClick={handleCloseChart}>
                                <Close />
                            </IconButton>
                        </Box>
                    </Box>
                </DialogTitle>

                <DialogContent>
                    {loading && (
                        <Box sx={{ mb: 2 }}>
                            <LinearProgress />
                            <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                                Loading P/L history...
                            </Typography>
                        </Box>
                    )}

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Statistics Cards */}
                    {statistics && (
                        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                            <Chip
                                icon={<TrendingUp />}
                                label={`Current: ₹${statistics.currentPl.toFixed(2)}`}
                                color={statistics.currentPl >= 0 ? 'success' : 'error'}
                                variant="outlined"
                            />
                            <Chip
                                label={`Max: ₹${statistics.maxPl.toFixed(2)}`}
                                color="success"
                                variant="outlined"
                            />
                            <Chip
                                label={`Min: ₹${statistics.minPl.toFixed(2)}`}
                                color="error"
                                variant="outlined"
                            />
                            <Chip
                                label={`Avg: ₹${statistics.avgPl.toFixed(2)}`}
                                color="info"
                                variant="outlined"
                            />
                            <Chip
                                label={`Records: ${statistics.totalRecords}`}
                                color="default"
                                variant="outlined"
                            />
                        </Box>
                    )}

                    {/* Chart */}
                    {chartData.length > 0 ? (
                        <Box sx={{ height: '400px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis 
                                        dataKey="timestamp" 
                                        tick={{ fontSize: 12 }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                        tickFormatter={(tickItem) => moment(tickItem).format('MMM DD HH:mm')}
                                    />
                                    <YAxis 
                                        tick={{ fontSize: 12 }}
                                        tickFormatter={(value) => `₹${value.toFixed(0)}`}
                                    />
                                    <RechartsTooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <ReferenceLine y={0} stroke="#666" strokeDasharray="2 2" />
                                    
                                    <Line
                                        type="monotone"
                                        dataKey="P/L (LTP)"
                                        stroke="#1976d2"
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                        name="P/L (LTP)"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="P/L (MP)"
                                        stroke="#d32f2f"
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                        name="P/L (MP)"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </Box>
                    ) : !loading && !error && (
                        <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            height: '400px',
                            textAlign: 'center'
                        }}>
                            <ShowChart sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                No P/L History Available
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                P/L data will appear here as the strategy runs and data is collected every 5 minutes.
                            </Typography>
                        </Box>
                    )}
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleCloseChart}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default PlHistoryChart;
