import React from 'react';
import {
    Paper,
    TextField,
    Box,
    Button,
    Grid
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

const HolidaySearch = ({ onSearch, onClear }) => {
    const [searchParams, setSearchParams] = React.useState({
        startDate: null,
        endDate: null,
        name: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSearchParams(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDateChange = (field) => (newValue) => {
        setSearchParams(prev => ({
            ...prev,
            [field]: newValue
        }));
    };

    const handleSearch = () => {
        onSearch(searchParams);
    };

    const handleClear = () => {
        setSearchParams({
            startDate: null,
            endDate: null,
            name: ''
        });
        onClear();
    };

    return (
        <Paper sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={4}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="Start Date"
                            value={searchParams.startDate}
                            onChange={handleDateChange('startDate')}
                            renderInput={(params) => <TextField {...params} fullWidth />}
                        />
                    </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="End Date"
                            value={searchParams.endDate}
                            onChange={handleDateChange('endDate')}
                            renderInput={(params) => <TextField {...params} fullWidth />}
                        />
                    </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <TextField
                        name="name"
                        label="Name"
                        value={searchParams.name}
                        onChange={handleChange}
                        fullWidth
                    />
                </Grid>
                <Grid item xs={12} sm={12} md={2}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="contained"
                            startIcon={<SearchIcon />}
                            onClick={handleSearch}
                            fullWidth
                        >
                            Search
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<ClearIcon />}
                            onClick={handleClear}
                            fullWidth
                        >
                            Clear
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default HolidaySearch; 