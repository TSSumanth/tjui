import React, { useState, useEffect, useRef } from 'react';
import { 
    Box, 
    TextField, 
    Button, 
    Grid, 
    Typography 
} from '@mui/material';
import { Search as SearchIcon, Lock as LockIcon } from '@mui/icons-material';
import SmartCMPInput from './SmartCMPInput';
import NiftySpreadStrikeGrid from './NiftySpreadStrikeGrid';

const StrategyInputForm = ({ selectedStrategy, onIdentifyTrades, onStrikeSelect }) => {
    const [formData, setFormData] = useState({});
    const [formFields, setFormFields] = useState([]);
    const [showStrikeGrid, setShowStrikeGrid] = useState(false);
    const formSubmittedRef = useRef(false);

    // Load saved form data from localStorage on component mount
    useEffect(() => {
        const savedData = localStorage.getItem('identifyTradesFormData');
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                setFormData(parsedData);
            } catch (error) {
                console.log('Error parsing saved form data:', error);
            }
        }
    }, []);

    // Save form data to localStorage whenever it changes
    useEffect(() => {
        if (Object.keys(formData).length > 0) {
            localStorage.setItem('identifyTradesFormData', JSON.stringify(formData));
        }
    }, [formData]);



    // Strategy configuration - defines what fields each strategy needs
    const strategyConfig = {
        'Nifty Bear Call Spread': {
            fields: [
                {
                    key: 'niftyCMP',
                    label: 'Nifty CMP',
                    type: 'smartCMP',
                    assetName: 'Nifty 50',
                    required: true,
                    width: 2.5
                },
                {
                    key: 'expiry',
                    label: 'Expiry',
                    type: 'date',
                    required: true,
                    width: 2.5
                },
                {
                    key: 'instrumentType',
                    label: 'Type (Auto)',
                    type: 'readonly',
                    value: 'CE',
                    width: 2
                }
            ]
        },
        'Nifty Bull Put Spread': {
            fields: [
                {
                    key: 'niftyCMP',
                    label: 'Nifty CMP',
                    type: 'smartCMP',
                    assetName: 'Nifty 50',
                    required: true,
                    width: 2.5
                },
                {
                    key: 'expiry',
                    label: 'Expiry',
                    type: 'date',
                    required: true,
                    width: 2.5
                },
                {
                    key: 'instrumentType',
                    label: 'Type (Auto)',
                    type: 'readonly',
                    value: 'PE',
                    width: 2
                }
            ]
        }
        // Example: Adding Bank Nifty strategies
        // 'Bank Nifty Bear Call Spread': {
        //     fields: [
        //         {
        //             key: 'bankNiftyCMP',
        //             label: 'Bank Nifty CMP',
        //             type: 'smartCMP',
        //             assetName: 'BANKNIFTY',
        //             required: true,
        //             width: 2.5
        //         },
        //         {
        //             key: 'expiry',
        //             label: 'Expiry',
        //             type: 'date',
        //             required: true,
        //             width: 2.5
        //         },
        //         {
        //             key: 'instrumentType',
        //             label: 'Type (Auto)',
        //             type: 'readonly',
        //             value: 'CE',
        //             width: 2
        //         }
        //     ]
        // }
        
    };

    // Initialize form fields when strategy changes
    useEffect(() => {
        if (selectedStrategy && strategyConfig[selectedStrategy]) {
            const config = strategyConfig[selectedStrategy];
            setFormFields(config.fields);
            
            // Try to load saved data from localStorage first
            const savedData = localStorage.getItem('identifyTradesFormData');
            let savedFormData = {};
            if (savedData) {
                try {
                    savedFormData = JSON.parse(savedData);
                    console.log('📦 Loaded saved form data from localStorage:', savedFormData);
                } catch (error) {
                    console.warn('⚠️ Failed to parse saved form data:', error);
                }
            }
            
            // Initialize form data with default values, but preserve existing data
            const initialData = {};
            config.fields.forEach(field => {
                if (field.type === 'readonly') {
                    initialData[field.key] = field.value;
                } else {
                    // Try saved data first, then existing form data, then empty
                    const savedValue = savedFormData[field.key];
                    const existingValue = formData[field.key];
                    const finalValue = (savedValue && savedValue.toString().trim() !== '') || 
                                     (existingValue && existingValue.toString().trim() !== '') ? 
                                     (savedValue || existingValue) : '';
                    
                    initialData[field.key] = finalValue;
                }
            });
            
            console.log('🔄 Form initialization:', {
                strategy: selectedStrategy,
                savedFormData,
                existingFormData: formData,
                newInitialData: initialData
            });
            
            setFormData(initialData);
            
            // Hide the strike grid when strategy changes
            setShowStrikeGrid(false);
            formSubmittedRef.current = false;
        }
    }, [selectedStrategy]); // Removed formData dependency to prevent infinite loop

    // Get minimum date (today)
    const getMinDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    const handleFieldChange = (key, value) => {
        console.log(`Field ${key} changed to:`, value, 'Type:', typeof value);
        setFormData(prev => {
            const newData = {
                ...prev,
                [key]: value
            };
            
            // Save to localStorage
            localStorage.setItem('identifyTradesFormData', JSON.stringify(newData));
            
            return newData;
        });
    };

    const isFormValid = () => {
        // Don't validate if form is not properly initialized
        if (!formFields || formFields.length === 0) {
            console.log('⚠️ Form not initialized yet');
            return false;
        }
        
        // Check if all required fields are filled
        const requiredFields = formFields.filter(field => field.required);
        
        // Debug logging
        console.log('🔍 Form validation check:');
        console.log('  - Form fields:', formFields);
        console.log('  - Required fields:', requiredFields);
        console.log('  - Form data:', formData);
        console.log('  - Form data keys:', Object.keys(formData));
        console.log('  - Form data values:', Object.values(formData));
        
        const isValid = requiredFields.every(field => {
            const fieldValue = formData[field.key];
            const hasValue = fieldValue && fieldValue.toString().trim() !== '';
            console.log(`  - Field ${field.key} (${field.type}):`, {
                value: fieldValue,
                type: typeof fieldValue,
                trimmed: fieldValue ? fieldValue.toString().trim() : 'undefined',
                valid: hasValue
            });
            return hasValue;
        });
        
        console.log('✅ Form validation result:', isValid);
        return isValid;
    };

    const handleSubmit = () => {
        if (isFormValid()) {
            console.log('✅ Form submitted, showing strike grid');
            // Mark form as submitted
            formSubmittedRef.current = true;
            // Show the strike grid
            setShowStrikeGrid(true);
            
            // Call the parent handler with form data
            onIdentifyTrades({
                strategy: selectedStrategy,
                ...formData
            });
        }
    };

    const clearFormData = () => {
        localStorage.removeItem('identifyTradesFormData');
        
        // Clear form data but preserve readonly fields (like instrumentType)
        const clearedData = {};
        formFields.forEach(field => {
            if (field.type === 'readonly') {
                clearedData[field.key] = field.value; // Preserve the default value
            }
        });
        
        setFormData(clearedData);
        setShowStrikeGrid(false);
        formSubmittedRef.current = false;
    };

    if (!selectedStrategy || !formFields.length) return null;

    return (
        <Box sx={{ mt: 1, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.secondary' }}>
                Strategy Parameters: {selectedStrategy}
            </Typography>
            
          
            <Grid container spacing={1.5} alignItems="center">
                {formFields.map((field) => (
                    <Grid item xs={12} md={field.width} key={field.key}>
                        {field.type === 'smartCMP' && (
                            <SmartCMPInput
                                value={formData[field.key] || ''}
                                onChange={(value) => handleFieldChange(field.key, value)}
                                onWebSocketData={(price) => {
                                    console.log('WebSocket CMP received:', price);
                                    handleFieldChange(field.key, price.toString());
                                }}
                                assetName={field.assetName || 'Nifty 50'}
                                label={field.label}
                            />
                        )}
                        
                        {field.type === 'date' && (
                            <TextField
                                fullWidth
                                label={field.label}
                                type="date"
                                value={formData[field.key] || ''}
                                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{ min: getMinDate() }}
                                size="small"
                                error={field.required && !formData[field.key]}
                            />
                        )}
                        
                        {field.type === 'readonly' && (
                            <TextField
                                fullWidth
                                label={field.label}
                                value={formData[field.key] || ''}
                                InputProps={{ 
                                    readOnly: true,
                                    endAdornment: (
                                        <LockIcon 
                                            fontSize="small" 
                                            sx={{ 
                                                color: 'text.disabled',
                                                mr: 1
                                            }} 
                                        />
                                    )
                                }}
                                size="small"
                                sx={{ 
                                    bgcolor: 'grey.100',
                                    '& .MuiInputBase-input': {
                                        color: 'text.secondary',
                                        fontWeight: 500
                                    }
                                }}
                            />
                        )}
                    </Grid>
                ))}
                
                <Grid item xs={12} md={1.5}>
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={!isFormValid() || !formFields || formFields.length === 0}
                        startIcon={<SearchIcon />}
                        size="small"
                        sx={{ height: 36 }}
                        title={!isFormValid() ? 'Please fill all required fields' : 'Click to identify trades'}
                    >
                        Identify
                    </Button>
                </Grid>
                
                <Grid item xs={12} md={0.5}>
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={clearFormData}
                        size="small"
                        sx={{ height: 36 }}
                        title="Clear form data"
                    >
                        Clear
                    </Button>
                </Grid>
            </Grid>

            {/* Strike Price Grid - Show only after Identify button is clicked */}
            {formSubmittedRef.current && formData.niftyCMP && formData.instrumentType && (
                <Box>
                    {/* Grid Header with Hide Button */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Strike Analysis Results
                        </Typography>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                                setShowStrikeGrid(false);
                                formSubmittedRef.current = false;
                            }}
                            sx={{ height: 32 }}
                        >
                            Hide Grid
                        </Button>
                    </Box>
                    
                    <NiftySpreadStrikeGrid
                        key={`${formData.niftyCMP}-${formData.expiry}-${formData.instrumentType}`}
                        niftyCMP={formData.niftyCMP}
                        expiry={formData.expiry}
                        type={formData.instrumentType}
                        onStrikeSelect={onStrikeSelect}
                        autoFetchOnMount={true}
                    />
                </Box>
            )}
        </Box>
    );
};

export default StrategyInputForm;
