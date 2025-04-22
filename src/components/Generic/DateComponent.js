import React, { useState } from 'react';
import { Box } from "@mui/material";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { parseISO } from 'date-fns';

const DateComponent = ({ initialDate, onDateSelect }) => {
    const [selectedDate, setSelectedDate] = useState(
        initialDate ? (typeof initialDate === 'string' ? parseISO(initialDate) : initialDate) : new Date()
    );

    const handleDateChange = (newValue) => {
        setSelectedDate(newValue);
        if (onDateSelect) {
            onDateSelect(newValue);
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ width: '100%' }}>
                <DatePicker
                    value={selectedDate}
                    onChange={handleDateChange}
                    slotProps={{
                        textField: {
                            fullWidth: true,
                            variant: "outlined",
                            sx: {
                                '& .MuiOutlinedInput-root': {
                                    '&:hover fieldset': {
                                        borderColor: 'primary.main',
                                    },
                                },
                            }
                        }
                    }}
                />
            </Box>
        </LocalizationProvider>
    );
};

export default DateComponent;