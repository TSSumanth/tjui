import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Button,
    Box,
    Snackbar,
    Alert,
    AlertTitle
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import HolidayList from '../components/Holidays/HolidayList';
import HolidayForm from '../components/Holidays/HolidayForm';
import HolidaySearch from '../components/Holidays/HolidaySearch';
import HolidayStats from '../components/Holidays/HolidayStats';
import { getHolidays, createHoliday, updateHoliday, deleteHoliday } from '../services/holidays';

const Holidays = () => {
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [selectedHoliday, setSelectedHoliday] = useState(null);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    const fetchHolidays = async (params = {}) => {
        try {
            setLoading(true);
            const response = await getHolidays(params);
            setHolidays(response);
            setError(null);
        } catch (err) {
            setError(err.message);
            showSnackbar('Error fetching holidays', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Get current financial year
        const today = new Date();
        const currentMonth = today.getMonth() + 1; // JavaScript months are 0-based
        const currentYear = today.getFullYear();
        const financialYear = currentMonth >= 4
            ? `${currentYear}-${currentYear + 1}`
            : `${currentYear - 1}-${currentYear}`;

        fetchHolidays({ financialYear });
    }, []);

    const handleCreateHoliday = async (holidayData) => {
        try {
            await createHoliday(holidayData);
            showSnackbar('Holiday created successfully', 'success');
            fetchHolidays();
            setShowForm(false);
        } catch (err) {
            showSnackbar('Error creating holiday', 'error');
        }
    };

    const handleUpdateHoliday = async (holidayData) => {
        try {
            const holidayId = holidayData.id || holidayData._id;
            if (!holidayId) {
                throw new Error('No valid holiday ID found');
            }
            await updateHoliday(holidayId, holidayData);
            showSnackbar('Holiday updated successfully', 'success');
            fetchHolidays();
            setShowForm(false);
            setSelectedHoliday(null);
        } catch (err) {
            showSnackbar(err.message || 'Error updating holiday', 'error');
        }
    };

    const handleDeleteHoliday = async (id) => {
        try {
            await deleteHoliday(id);
            showSnackbar('Holiday deleted successfully', 'success');
            fetchHolidays();
        } catch (err) {
            showSnackbar('Error deleting holiday', 'error');
        }
    };

    const handleEdit = (holiday) => {
        setSelectedHoliday(holiday);
        setShowForm(true);
    };

    const handleSearch = (params) => {
        fetchHolidays(params);
    };

    const handleClear = () => {
        // Get current financial year
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();
        const financialYear = currentMonth >= 4
            ? `${currentYear}-${currentYear + 1}`
            : `${currentYear - 1}-${currentYear}`;

        fetchHolidays({ financialYear });
    };

    const showSnackbar = (message, severity) => {
        setSnackbar({
            open: true,
            message,
            severity
        });
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    return (
        <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Holidays
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                        setSelectedHoliday(null);
                        setShowForm(true);
                    }}
                >
                    Add New
                </Button>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
                <AlertTitle>Current Financial Year</AlertTitle>
                Holidays for the current financial year (April to March) are displayed by default. Use the search filters to view holidays for different periods.
            </Alert>

            <HolidayStats holidays={holidays} />
            <HolidaySearch onSearch={handleSearch} onClear={handleClear} />
            <HolidayList
                holidays={holidays}
                onEdit={handleEdit}
                onDelete={handleDeleteHoliday}
            />

            <HolidayForm
                open={showForm}
                onClose={() => {
                    setShowForm(false);
                    setSelectedHoliday(null);
                }}
                onSubmit={selectedHoliday ? handleUpdateHoliday : handleCreateHoliday}
                initialData={selectedHoliday}
            />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default Holidays; 