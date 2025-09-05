import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, ButtonGroup, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, IconButton
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import CloseIcon from '@mui/icons-material/Close';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUp from '@mui/icons-material/TrendingUp';
import { getStrategyPlHistory, formatPlHistoryForChart, getPlStatistics } from '../../services/strategyPlHistory';
import moment from 'moment';

const RegularStrategyPlHistoryChart = ({ strategyId, strategyName, isOpen }) => {
  const [showChart, setShowChart] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [statistics, setStatistics] = useState(null);

  const timeRangeOptions = [
    { value: '1d', label: '1 Day' },
    { value: '3d', label: '3 Days' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' }
  ];

  const getTimeRangeDates = (range) => {
    const now = moment();
    let startDate, endDate;

    switch (range) {
      case '1d':
        startDate = now.clone().subtract(1, 'day').startOf('day');
        endDate = now.clone().endOf('day');
        break;
      case '3d':
        startDate = now.clone().subtract(3, 'days').startOf('day');
        endDate = now.clone().endOf('day');
        break;
      case '7d':
        startDate = now.clone().subtract(7, 'days').startOf('day');
        endDate = now.clone().endOf('day');
        break;
      case '30d':
        startDate = now.clone().subtract(30, 'days').startOf('day');
        endDate = now.clone().endOf('day');
        break;
      case '90d':
        startDate = now.clone().subtract(90, 'days').startOf('day');
        endDate = now.clone().endOf('day');
        break;
      default:
        startDate = now.clone().subtract(7, 'days').startOf('day');
        endDate = now.clone().endOf('day');
    }

    return {
      startDate: startDate.format('YYYY-MM-DD'),
      endDate: endDate.format('YYYY-MM-DD')
    };
  };

  const fetchPlHistory = useCallback(async () => {
    if (!strategyId || !isOpen) return;
    setLoading(true);
    setError(null);
    try {
      const { startDate, endDate } = getTimeRangeDates(timeRange);
      const response = await getStrategyPlHistory(strategyId, { 
        startDate, 
        endDate, 
        limit: 1000,
        strategyType: 'regular'
      });
      const formattedData = formatPlHistoryForChart(response.data);
      const stats = getPlStatistics(response.data);
      console.log('Statistics calculated:', stats);
      setChartData(formattedData);
      setStatistics(stats);
    } catch (err) {
      console.error('Error fetching P/L history:', err);
      setError('Failed to fetch P/L history data');
      setChartData([]);
      setStatistics(null);
    } finally {
      setLoading(false);
    }
  }, [strategyId, isOpen, timeRange]);

  useEffect(() => {
    if (showChart && strategyId && isOpen) {
      fetchPlHistory();
    }
  }, [showChart, strategyId, isOpen, timeRange, fetchPlHistory]);

  const handleRefresh = () => {
    fetchPlHistory();
  };

  const formatXAxisLabel = (tickItem) => {
    return moment(tickItem).format('MMM DD HH:mm');
  };

  const formatTooltipValue = (value, name) => {
    return [`₹${value?.toFixed(2) || '0.00'}`, name];
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <IconButton
        size="small"
        onClick={() => setShowChart(true)}
        sx={{ 
          color: 'primary.main',
          '&:hover': { backgroundColor: 'primary.light', color: 'white' }
        }}
        title="View P/L History Chart"
      >
        <ShowChartIcon fontSize="small" />
      </IconButton>

      <Dialog
        open={showChart}
        onClose={() => setShowChart(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { minHeight: '600px' }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1
        }}>
          <Box>
            <Typography variant="h6" component="div">
              P/L History Chart
            </Typography>
            <Typography paddingTop={1} variant="body2" color="text.secondary">
              {strategyName + " - Strategy Id: " + strategyId}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ButtonGroup size="small" variant="outlined">
              {timeRangeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={timeRange === option.value ? 'contained' : 'outlined'}
                  onClick={() => setTimeRange(option.value)}
                  size="small"
                >
                  {option.label}
                </Button>
              ))}
            </ButtonGroup>
            <IconButton onClick={handleRefresh} disabled={loading} size="small">
              <RefreshIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!loading && !error && chartData && chartData.length > 0 && (
            <Box>
              {/* Statistics */}
              {statistics && (
                <Box sx={{ 
                  display: 'flex', 
                  gap: 2, 
                  mb: 3, 
                  flexWrap: 'wrap',
                  justifyContent: 'center'
                }}>
                  <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                    <Typography variant="caption" color="text.secondary">
                      Current
                    </Typography>
                    <Typography variant="h6" color={statistics.currentPl >= 0 ? 'success.main' : 'error.main'}>
                      ₹{statistics.currentPl?.toFixed(2) || '0.00'}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                    <Typography variant="caption" color="text.secondary">
                      Max
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      ₹{statistics.maxPl?.toFixed(2) || '0.00'}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                    <Typography variant="caption" color="text.secondary">
                      Min
                    </Typography>
                    <Typography variant="h6" color="error.main">
                      ₹{statistics.minPl?.toFixed(2) || '0.00'}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                    <Typography variant="caption" color="text.secondary">
                      Average
                    </Typography>
                    <Typography variant="h6" color="text.primary">
                      ₹{statistics.avgPl?.toFixed(2) || '0.00'}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Chart */}
              <Box sx={{ height: 400, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={formatXAxisLabel}
                      tick={{ fontSize: 12 }}
                      type="category"
                    />
                    <YAxis 
                      tickFormatter={(value) => `₹${value?.toFixed(0) || '0'}`}
                      tick={{ fontSize: 12 }}
                      domain={['dataMin - 1000', 'dataMax + 1000']}
                    />
                    <Tooltip 
                      formatter={formatTooltipValue}
                      labelFormatter={(label) => moment(label).format('MMM DD, YYYY HH:mm')}
                    />
                    <Legend />
                    <ReferenceLine y={0} stroke="#666" strokeDasharray="2 2" />
                    <Line
                      type="monotone"
                      dataKey="P/L (LTP)"
                      stroke="#1976d2"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#1976d2" }}
                      name="P/L (LTP)"
                      connectNulls={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="P/L (MP)"
                      stroke="#dc004e"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#dc004e" }}
                      name="P/L (MP)"
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          )}

          {!loading && !error && (!chartData || chartData.length === 0) && (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              py: 4,
              textAlign: 'center'
            }}>
              <TrendingUp sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No P/L History Data
              </Typography>
              <Typography variant="body2" color="text.secondary">
                P/L data will be collected every 5 minutes during market hours.
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowChart(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RegularStrategyPlHistoryChart;
