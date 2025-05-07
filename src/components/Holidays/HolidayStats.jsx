import React from 'react';
import {
    Paper,
    Grid,
    Typography,
    Box
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import WarningIcon from '@mui/icons-material/Warning';

const HolidayStats = ({ holidays }) => {
    const stats = {
        total: holidays.length,
        upcoming: holidays.filter(h => new Date(h.date) > new Date()).length,
        past: holidays.filter(h => new Date(h.date) < new Date()).length
    };

    return (
        <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <EventIcon color="primary" sx={{ fontSize: 40 }} />
                    <Box>
                        <Typography variant="h6" color="text.secondary">
                            Total Holidays
                        </Typography>
                        <Typography variant="h4">
                            {stats.total}
                        </Typography>
                    </Box>
                </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CalendarMonthIcon color="success" sx={{ fontSize: 40 }} />
                    <Box>
                        <Typography variant="h6" color="text.secondary">
                            Upcoming Holidays
                        </Typography>
                        <Typography variant="h4">
                            {stats.upcoming}
                        </Typography>
                    </Box>
                </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <WarningIcon color="warning" sx={{ fontSize: 40 }} />
                    <Box>
                        <Typography variant="h6" color="text.secondary">
                            Past Holidays
                        </Typography>
                        <Typography variant="h4">
                            {stats.past}
                        </Typography>
                    </Box>
                </Paper>
            </Grid>
        </Grid>
    );
};

export default HolidayStats; 