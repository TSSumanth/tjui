import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Button,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Snackbar,
    CircularProgress
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { getHolidays, createHoliday, updateHoliday, deleteHoliday } from '../services/holidays';

export default function EventsAndHolidays() {
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedHoliday, setSelectedHoliday] = useState(null);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        date: null
    });

    // Get current financial year
    const getCurrentFinancialYear = () => {
        const today = new Date();
        const currentMonth = today.getMonth() + 1; // JavaScript months are 0-based
        const currentYear = today.getFullYear();

        // If current month is before April, financial year started in previous year
        if (currentMonth < 4) {
            return `${currentYear - 1}-${currentYear}`;
        }
        return `${currentYear}-${currentYear + 1}`;
    };

    const fetchHolidays = async (startDate, endDate) => {
        setLoading(true);
        try {
            const params = {};

            if (startDate && endDate) {
                params.startDate = startDate.toISOString().split('T')[0];
                params.endDate = endDate.toISOString().split('T')[0];
            } else {
                params.financialYear = getCurrentFinancialYear();
            }

            const data = await getHolidays(params);
            setHolidays(data);
        } catch (err) {
            setError(err.message || 'Failed to fetch holidays');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHolidays();
    }, []);

    const handleCreateHoliday = () => {
        setSelectedHoliday(null);
        setFormData({
            name: '',
            description: '',
            date: null
        });
        setOpenDialog(true);
    };

    const handleEditHoliday = (holiday) => {
        setSelectedHoliday(holiday);
        setFormData({
            name: holiday.name,
            description: holiday.description || '',
            date: new Date(holiday.date)
        });
        setOpenDialog(true);
    };

    const handleDeleteHoliday = async (id) => {
        if (!window.confirm('Are you sure you want to delete this holiday?')) return;

        try {
            await deleteHoliday(id);
            fetchHolidays(startDate, endDate);
        } catch (err) {
            setError(err.message || 'Failed to delete holiday');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedHoliday) {
                await updateHoliday(selectedHoliday.id, formData);
            } else {
                await createHoliday(formData);
            }
            setOpenDialog(false);
            fetchHolidays(startDate, endDate);
        } catch (err) {
            setError(err.message || 'Failed to save holiday');
        }
    };

    const handleSearch = () => {
        if (startDate && endDate) {
            fetchHolidays(startDate, endDate);
        }
    };

    return (
        <Container maxWidth="xl">
            <Box sx={{ my: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Events and Holidays
                </Typography>

                {/* Holidays Section */}
                <Paper sx={{ p: 3, mb: 4 }}>
                    <Typography variant="h5" gutterBottom>
                        Holidays
                    </Typography>

                    {/* Search Filters */}
                    <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="Start Date"
                                value={startDate}
                                onChange={setStartDate}
                                renderInput={(params) => <TextField {...params} />}
                            />
                            <DatePicker
                                label="End Date"
                                value={endDate}
                                onChange={setEndDate}
                                renderInput={(params) => <TextField {...params} />}
                            />
                        </LocalizationProvider>
                        <Button
                            variant="contained"
                            onClick={handleSearch}
                            disabled={!startDate || !endDate}
                        >
                            Search
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => {
                                setStartDate(null);
                                setEndDate(null);
                                fetchHolidays();
                            }}
                        >
                            Reset
                        </Button>
                    </Box>

                    {/* Create Button */}
                    <Box sx={{ mb: 3 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleCreateHoliday}
                        >
                            Create Holiday
                        </Button>
                    </Box>

                    {/* Holidays Table */}
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Description</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">
                                            <CircularProgress />
                                        </TableCell>
                                    </TableRow>
                                ) : holidays.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">
                                            No holidays found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    holidays.map((holiday) => (
                                        <TableRow key={holiday.id}>
                                            <TableCell>{holiday.name}</TableCell>
                                            <TableCell>{holiday.description}</TableCell>
                                            <TableCell>{new Date(holiday.date).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <IconButton
                                                    onClick={() => handleEditHoliday(holiday)}
                                                    color="primary"
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton
                                                    onClick={() => handleDeleteHoliday(holiday.id)}
                                                    color="error"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>

                {/* Events Section - Placeholder */}
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h5" gutterBottom>
                        Events
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Events management coming soon...
                    </Typography>
                </Paper>
            </Box>

            {/* Create/Edit Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>
                    {selectedHoliday ? 'Edit Holiday' : 'Create Holiday'}
                </DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            multiline
                            rows={3}
                            sx={{ mb: 2 }}
                        />
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="Date"
                                value={formData.date}
                                onChange={(date) => setFormData({ ...formData, date })}
                                renderInput={(params) => (
                                    <TextField {...params} fullWidth required />
                                )}
                            />
                        </LocalizationProvider>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        {selectedHoliday ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Error Snackbar */}
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={() => setError(null)} severity="error">
                    {error}
                </Alert>
            </Snackbar>
        </Container>
    );
} 