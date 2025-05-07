import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    IconButton,
    Grid,
    Stack,
    useTheme
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EventIcon from '@mui/icons-material/Event';
import { format } from 'date-fns';

const HolidayList = ({ holidays, onEdit, onDelete }) => {
    const theme = useTheme();

    const isPastHoliday = (date) => {
        return new Date(date) < new Date();
    };

    // Sort holidays into upcoming and past
    const upcomingHolidays = holidays
        .filter(h => !isPastHoliday(h.date))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const pastHolidays = holidays
        .filter(h => isPastHoliday(h.date))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    const handleEdit = (holiday) => {
        // Check if we have a valid ID
        if (!holiday.id && !holiday._id) {
            console.error('No valid ID found for holiday:', holiday);
            return;
        }
        // Use either id or _id, depending on what's available
        const holidayId = holiday.id || holiday._id;
        onEdit({ ...holiday, id: holidayId });
    };

    const handleDelete = (holiday) => {
        // Check if we have a valid ID
        if (!holiday.id && !holiday._id) {
            console.error('No valid ID found for holiday:', holiday);
            return;
        }
        // Use either id or _id, depending on what's available
        const holidayId = holiday.id || holiday._id;
        onDelete(holidayId);
    };

    const renderHolidayCard = (holiday, isPast) => (
        <Card
            key={`${holiday.date}-${holiday.name}`}
            sx={{
                mb: 2,
                opacity: isPast ? 0.7 : 1,
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[4],
                    opacity: isPast ? 0.8 : 1
                }
            }}
        >
            <CardContent>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={8}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <EventIcon
                                color={isPast ? "disabled" : "primary"}
                                sx={{ fontSize: 28 }}
                            />
                            <Box>
                                <Typography
                                    variant="h6"
                                    component="div"
                                    sx={{
                                        color: isPast ? 'text.secondary' : 'text.primary',
                                        fontWeight: 500
                                    }}
                                >
                                    {holiday.name}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 0.5 }}
                                >
                                    {format(new Date(holiday.date), 'EEEE, MMMM d, yyyy')}
                                </Typography>
                                {holiday.description && (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ mt: 1 }}
                                    >
                                        {holiday.description}
                                    </Typography>
                                )}
                            </Box>
                        </Stack>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Box sx={{
                            display: 'flex',
                            justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                            gap: 1,
                            mt: { xs: 2, sm: 0 }
                        }}>
                            <IconButton
                                onClick={() => handleEdit(holiday)}
                                size="small"
                                sx={{
                                    color: theme.palette.primary.main,
                                    '&:hover': { backgroundColor: theme.palette.primary.light }
                                }}
                            >
                                <EditIcon />
                            </IconButton>
                            <IconButton
                                onClick={() => handleDelete(holiday)}
                                size="small"
                                sx={{
                                    color: theme.palette.error.main,
                                    '&:hover': { backgroundColor: theme.palette.error.light }
                                }}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Box>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );

    return (
        <Box sx={{ mt: 4 }}>
            {upcomingHolidays.length > 0 && (
                <Box sx={{ mb: 4 }}>
                    <Typography
                        variant="h5"
                        sx={{
                            mb: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            color: theme.palette.primary.main
                        }}
                    >
                        <EventIcon />
                        Upcoming Holidays
                    </Typography>
                    {upcomingHolidays.map(holiday => renderHolidayCard(holiday, false))}
                </Box>
            )}

            {pastHolidays.length > 0 && (
                <Box>
                    <Typography
                        variant="h5"
                        sx={{
                            mb: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            color: theme.palette.text.secondary
                        }}
                    >
                        <EventIcon />
                        Past Holidays
                    </Typography>
                    {pastHolidays.map(holiday => renderHolidayCard(holiday, true))}
                </Box>
            )}

            {holidays.length === 0 && (
                <Box
                    sx={{
                        textAlign: 'center',
                        py: 4,
                        color: 'text.secondary'
                    }}
                >
                    <Typography variant="h6">
                        No holidays found
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default HolidayList; 