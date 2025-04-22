import React, { useState, useEffect } from "react";
import { TextField, Box } from "@mui/material";
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const DateTimeComponent = ({ label, value, onChange, error, helperText }) => {
    const [dateTime, setDateTime] = useState(value);

    useEffect(() => {
        setDateTime(value);
    }, [value, onChange]);

    const handleDateTimeChange = (newValue) => {
        setDateTime(newValue);
        if (onChange) {
            onChange(newValue);
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ width: '100%' }}>
                <DateTimePicker
                    label={label}
                    value={dateTime}
                    onChange={handleDateTimeChange}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            fullWidth
                            error={error}
                            helperText={helperText}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '&:hover fieldset': {
                                        borderColor: 'primary.main',
                                    },
                                },
                            }}
                        />
                    )}
                />
            </Box>
        </LocalizationProvider>
    );
};

export default DateTimeComponent;