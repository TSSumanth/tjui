import React, { useState, useEffect } from "react";
import { TextField, Box } from "@mui/material";
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const DateTimeComponent = ({ value, onChange }) => {
    const [dateTime, setDateTime] = useState(value || new Date());

    useEffect(() => {
        if (!value) {
            onChange(new Date());
        }
    }, []);

    const handleChange = (newValue) => {
        setDateTime(newValue);
        onChange(newValue);
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ width: '100%' }}>
                <DateTimePicker
                    value={dateTime}
                    onChange={handleChange}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            fullWidth
                            variant="outlined"
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