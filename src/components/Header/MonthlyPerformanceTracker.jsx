import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Chip,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    Save as SaveIcon,
    TrendingUp as TrendingUpIcon,
    CalendarMonth as CalendarMonthIcon
} from '@mui/icons-material';
import { getCurrentMonthPerformance, saveMonthlyPerformance } from '../../services/monthlyPerformance';

/**
 * Monthly Performance Tracker Component
 * Displays and allows editing of current month performance metrics
 * Shows: Current Month, Expected Return, Actual Return, Account Balance
 */
const MonthlyPerformanceTracker = () => {
    const [performanceData, setPerformanceData] = useState({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        month_name: '',
        expected_return: 0,
        actual_return: 0,
        account_balance: 0
    });
    
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Load current month performance data on component mount
    useEffect(() => {
        loadCurrentMonthPerformance();
    }, []);

    const loadCurrentMonthPerformance = async () => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('🔄 Loading monthly performance data...');
            const response = await getCurrentMonthPerformance();
            console.log('📊 API Response:', response);
            
            if (response.success && response.data) {
                setPerformanceData({
                    year: response.data.year,
                    month: response.data.month,
                    month_name: response.data.month_name,
                    expected_return: response.data.expected_return || 0,
                    actual_return: response.data.actual_return || 0,
                    account_balance: response.data.account_balance || 0
                });
                console.log('✅ Performance data loaded successfully:', response.data);
            } else {
                console.error('❌ API returned unsuccessful response:', response);
                throw new Error('Failed to load performance data');
            }
        } catch (error) {
            console.error('❌ Error loading performance data:', error);
            setError(`Failed to load performance data: ${error.message}. Please check if the backend is running.`);
            
            // Set fallback data for current month
            const currentDate = new Date();
            const monthNames = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
            
            setPerformanceData({
                year: currentDate.getFullYear(),
                month: currentDate.getMonth() + 1,
                month_name: monthNames[currentDate.getMonth()],
                expected_return: 0,
                actual_return: 0,
                account_balance: 0
            });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        // For numeric fields, allow free typing during editing
        if (field === 'expected_return' || field === 'actual_return' || field === 'account_balance') {
            // Allow empty string, numbers, and decimal points
            if (value === '' || value === '.') {
                setPerformanceData(prev => ({ ...prev, [field]: value }));
                return;
            }
            
            // Check if it's a valid number format
            let isValidNumberFormat;
            if (field === 'actual_return') {
                // Allow negative values for actual_return (for losses)
                isValidNumberFormat = /^-?\d*\.?\d{0,2}$/.test(value);
            } else {
                // Only positive values for expected_return and account_balance
                isValidNumberFormat = /^\d*\.?\d{0,2}$/.test(value);
            }
            
            if (isValidNumberFormat) {
                setPerformanceData(prev => ({ ...prev, [field]: value }));
            }
            // If invalid format, don't update (user can't type invalid characters)
        } else {
            setPerformanceData(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccess(null);

            // Validate required fields
            if (performanceData.expected_return === '' || 
                performanceData.actual_return === '' || 
                performanceData.account_balance === '') {
                setError('All fields are required. Please fill in all values.');
                return;
            }

            // Convert string values to numbers and handle empty strings
            const dataToSave = {
                ...performanceData,
                expected_return: performanceData.expected_return === '' ? 0 : parseFloat(performanceData.expected_return),
                actual_return: performanceData.actual_return === '' ? 0 : parseFloat(performanceData.actual_return),
                account_balance: performanceData.account_balance === '' ? 0 : parseFloat(performanceData.account_balance)
            };

            console.log('💾 Saving performance data:', dataToSave);
            const response = await saveMonthlyPerformance(dataToSave);
            console.log('💾 Save response:', response);
            
            if (response.success) {
                setSuccess('Performance data saved successfully!');
                setEditing(false);
                // Reload data to ensure consistency
                await loadCurrentMonthPerformance();
                
                // Clear success message after 3 seconds
                setTimeout(() => setSuccess(null), 3000);
            } else {
                throw new Error(response.error || 'Failed to save performance data');
            }
        } catch (error) {
            console.error('❌ Error saving performance data:', error);
            setError(error.message || 'Failed to save performance data. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = () => {
        setEditing(true);
        setError(null);
        setSuccess(null);
    };

    const handleCancel = () => {
        setEditing(false);
        setError(null);
        setSuccess(null);
        // Reload original data
        loadCurrentMonthPerformance();
    };

    const getWorkingDaysRemaining = () => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        
        // Get the last day of the current month
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
        
        let workingDays = 0;
        const currentDate = new Date(today);
        
        // Count working days from today to end of month
        while (currentDate <= lastDayOfMonth) {
            const dayOfWeek = currentDate.getDay();
            // Monday = 1, Tuesday = 2, ..., Friday = 5
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                workingDays++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return workingDays;
    };



    if (loading) {
        return (
            <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 80 }}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                        Loading performance data...
                    </Typography>
                </Box>
            </Paper>
        );
    }

    return (
        <Paper elevation={1} sx={{ p: 1.5, mb: 1, backgroundColor: "#1a237e" }}>
            {/* Compact Single Line Layout */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                {/* Title */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 'fit-content' }}>
                    <CalendarMonthIcon sx={{ fontSize: 18, color: 'white' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'white' }}>
                        Monthly Performance:
                    </Typography>
                </Box>

                {/* Current Month */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ color: 'white' }}>Month:</Typography>
                    <Chip
                        label={performanceData.month_name || 'Loading...'}
                        color="primary"
                        variant="filled"
                        size="small"
                        sx={{ fontWeight: 600, height: 24, fontSize: '0.75rem' }}
                    />
                </Box>

                {/* Expected Return */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ color: 'white' }}>Expected (₹):</Typography>
                    {editing ? (
                        <TextField
                            size="small"
                            value={performanceData.expected_return}
                            onChange={(e) => handleInputChange('expected_return', e.target.value)}
                            placeholder="0.00"
                            inputProps={{
                                step: "0.01",
                                min: "0",
                                max: "100",
                                style: { textAlign: 'center', fontSize: '0.75rem', padding: '4px 8px' }
                            }}
                            sx={{
                                width: 60,
                                '& .MuiInputBase-root': { 
                                    height: 24,
                                    backgroundColor: 'white',
                                    borderRadius: 1,
                                    '& fieldset': {
                                        borderColor: 'white',
                                        borderWidth: 1
                                    },
                                    '&:hover fieldset': {
                                        borderColor: 'white',
                                        borderWidth: 1
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: 'white',
                                        borderWidth: 2
                                    }
                                },
                                '& .MuiInputBase-input': { 
                                    textAlign: 'center',
                                    fontWeight: 600,
                                    color: '#1a237e'
                                }
                            }}
                        />
                    ) : (
                        <Chip
                            label={`${performanceData.expected_return}`}
                            color="info"
                            variant="outlined"
                            size="small"
                            sx={{ fontWeight: 600, height: 24, fontSize: '0.75rem', minWidth: 70 }}
                        />
                    )}
                </Box>

                {/* Actual Return */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ color: 'white' }}>Actual (₹):</Typography>
                    {editing ? (
                        <TextField
                            size="small"
                            value={performanceData.actual_return}
                            onChange={(e) => handleInputChange('actual_return', e.target.value)}
                            placeholder="0.00"
                            inputProps={{
                                step: "0.01",
                                min: "-999999",
                                max: "999999",
                                style: { textAlign: 'center', fontSize: '0.75rem', padding: '4px 8px' }
                            }}
                            sx={{
                                width: 60,
                                '& .MuiInputBase-root': { 
                                    height: 24,
                                    backgroundColor: 'white',
                                    borderRadius: 1,
                                    '& fieldset': {
                                        borderColor: 'white',
                                        borderWidth: 1
                                    },
                                    '&:hover fieldset': {
                                        borderColor: 'white',
                                        borderWidth: 1
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: 'white',
                                        borderWidth: 2
                                    }
                                },
                                '& .MuiInputBase-input': { 
                                    textAlign: 'center',
                                    fontWeight: 600,
                                    color: '#1a237e'
                                }
                            }}
                        />
                    ) : (
                        <Chip
                            label={`${performanceData.actual_return}`}
                            color={performanceData.actual_return >= performanceData.expected_return ? "success" : performanceData.actual_return < 0 ? "error" : "warning"}
                            variant="outlined"
                            size="small"
                            sx={{ fontWeight: 600, height: 24, fontSize: '0.75rem', minWidth: 70 }}
                        />
                    )}
                </Box>

                {/* Variance: Expected - Actual */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ color: 'white' }}>Variance (₹):</Typography>
                    <Chip
                        label={`${(performanceData.expected_return - performanceData.actual_return).toFixed(2)}`}
                        color={performanceData.actual_return >= performanceData.expected_return ? "success" : "error"}
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 600, height: 24, fontSize: '0.75rem', minWidth: 70 }}
                    />
                </Box>

                 {/* Pending Trading Days Remaining */}
                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ color: 'white' }}>Pending Trading Days:</Typography>
                    <Chip
                        label={getWorkingDaysRemaining()}
                        color="info"
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 600, height: 24, fontSize: '0.75rem', minWidth: 50 }}
                    />
                </Box>

                {/* Account Balance */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ color: 'white' }}>Account Balance (₹):</Typography>
                    {editing ? (
                        <TextField
                            size="small"
                            value={performanceData.account_balance}
                            onChange={(e) => handleInputChange('account_balance', e.target.value)}
                            placeholder="0.00"
                            inputProps={{
                                step: "0.01",
                                min: "0",
                                style: { textAlign: 'center', fontSize: '0.75rem', padding: '4px 8px' }
                            }}
                            sx={{
                                width: 80,
                                '& .MuiInputBase-root': { 
                                    height: 24,
                                    backgroundColor: 'white',
                                    borderRadius: 1,
                                    '& fieldset': {
                                        borderColor: 'white',
                                        borderWidth: 1
                                    },
                                    '&:hover fieldset': {
                                        borderColor: 'white',
                                        borderWidth: 1
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: 'white',
                                        borderWidth: 2
                                    }
                                },
                                '& .MuiInputBase-input': { 
                                    textAlign: 'center',
                                    fontWeight: 600,
                                    color: '#1a237e'
                                }
                            }}
                        />
                    ) : (
                        <Chip
                            label={`${performanceData.account_balance}`}
                            color="success"
                            variant="outlined"
                            size="small"
                            sx={{ fontWeight: 600, height: 24, fontSize: '0.75rem', minWidth: 70 }}
                        />
                    )}
                </Box>

               

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
                    {!editing ? (
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={handleEdit}
                            startIcon={<TrendingUpIcon />}
                            sx={{ height: 24, fontSize: '0.75rem', px: 1 }}
                        >
                            Edit
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={handleCancel}
                                disabled={saving}
                                sx={{ 
                                    height: 24, 
                                    fontSize: '0.75rem', 
                                    px: 1,
                                    color: 'white',
                                    borderColor: 'white',
                                    '&:hover': {
                                        borderColor: 'white',
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                    }
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                size="small"
                                onClick={handleSave}
                                disabled={saving}
                                startIcon={saving ? <CircularProgress size={12} /> : <SaveIcon />}
                                sx={{ height: 24, fontSize: '0.75rem', px: 1 }}
                            >
                                {saving ? 'Saving...' : 'Save'}
                        </Button>
                        </>
                    )}
                </Box>
            </Box>

            {/* Error/Success Messages - Compact */}
            {(error || success) && (
                <Box sx={{ mt: 1 }}>
                    {error && (
                        <Alert severity="error" sx={{ py: 0.5, fontSize: '0.75rem' }}>
                            {error}
                        </Alert>
                    )}
                    {success && (
                        <Alert severity="success" sx={{ py: 0.5, fontSize: '0.75rem' }}>
                            {success}
                        </Alert>
                    )}
                </Box>
            )}
        </Paper>
    );
};

export default MonthlyPerformanceTracker;