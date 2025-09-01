import React, { useState } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';

const StrategyDropdown = ({ onStrategyChange }) => {
    const [selectedStrategy, setSelectedStrategy] = useState('');

    const strategies = [
        { value: 'Nifty Bear Call Spread', label: 'Nifty Bear Call Spread' },
        { value: 'Nifty Bull Put Spread', label: 'Nifty Bull Put Spread' }
    ];

    const handleChange = (event) => {
        const strategy = event.target.value;
        setSelectedStrategy(strategy);
        onStrategyChange(strategy);
    };

    return (
        <Box sx={{ minWidth: 150 }}>
            <FormControl size="small" fullWidth>
                <InputLabel>Strategy</InputLabel>
                <Select
                    value={selectedStrategy}
                    onChange={handleChange}
                    label="Strategy"
                >
                    {strategies.map((strategy) => (
                        <MenuItem key={strategy.value} value={strategy.value}>
                            {strategy.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );
};

export default StrategyDropdown;
