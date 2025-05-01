import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Card,
    CardContent,
    CardActionArea,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Chip,
    CircularProgress,
    Alert,
} from '@mui/material';
import { Link } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PsychologyIcon from '@mui/icons-material/Psychology';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ListAltIcon from '@mui/icons-material/ListAlt';
import useScrollToTop from '../hooks/useScrollToTop';
import { getStockTrades, getOptionTrades } from '../services/trades';
import { getOpenStrategies } from '../services/strategies';

function Home() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        totalPL: 0,
        activeTrades: 0,
        activeStrategies: 0,
        marketChange: '0%'
    });
    const [recentActivity, setRecentActivity] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch open trades
                const [stockTrades, optionTrades, strategies] = await Promise.all([
                    getStockTrades({ status: 'OPEN' }),
                    getOptionTrades({ status: 'OPEN' }),
                    getOpenStrategies()
                ]);

                // Calculate total P&L
                const totalPL = [...stockTrades, ...optionTrades].reduce((sum, trade) => {
                    const unrealizedPL = parseFloat(trade.unrealizedpl || 0);
                    const realizedPL = parseFloat(trade.realizedpl || 0);
                    return sum + unrealizedPL + realizedPL;
                }, 0);

                // Update stats
                setStats({
                    totalPL,
                    activeTrades: stockTrades.length + optionTrades.length,
                    activeStrategies: strategies.length,
                    marketChange: '+0%' // This would need to be fetched from a market data API
                });

                // Create recent activity from trades and strategies
                const activities = [
                    ...stockTrades.slice(0, 3).map(trade => ({
                        type: 'trade',
                        description: `${trade.tradetype} ${trade.quantity} shares of ${trade.asset}`,
                        time: new Date(trade.entrydate).toLocaleString()
                    })),
                    ...optionTrades.slice(0, 3).map(trade => ({
                        type: 'trade',
                        description: `${trade.tradetype} ${trade.quantity} options of ${trade.asset}`,
                        time: new Date(trade.entrydate).toLocaleString()
                    })),
                    ...strategies.slice(0, 3).map(strategy => ({
                        type: 'strategy',
                        description: `Created strategy "${strategy.name}"`,
                        time: new Date(strategy.created_at).toLocaleString()
                    }))
                ].sort((a, b) => new Date(b.time) - new Date(a.time))
                    .slice(0, 5);

                setRecentActivity(activities);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load dashboard data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const quickAccessItems = [
        { title: 'New Trade', icon: <AddIcon />, path: '/trades' },
        { title: 'Strategies', icon: <PsychologyIcon />, path: '/mystrategies' },
        { title: 'Market Analysis', icon: <AssessmentIcon />, path: '/marketanalysis' },
        { title: 'Portfolio', icon: <AccountBalanceIcon />, path: '/zerodha/portfolio' }
    ];

    useScrollToTop();

    if (loading) {
        return (
            <div>
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <CircularProgress />
                </Box>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <Box sx={{ p: 3 }}>
                    <Alert severity="error">{error}</Alert>
                </Box>
            </div>
        );
    }

    return (
        <div>
            <Box sx={{ p: 3 }}>
                {/* Quick Stats */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h6" color="text.secondary">Total P&L</Typography>
                            <Typography variant="h4" color={stats.totalPL >= 0 ? 'success.main' : 'error.main'}>
                                ₹{stats.totalPL.toLocaleString()}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h6" color="text.secondary">Active Trades</Typography>
                            <Typography variant="h4">{stats.activeTrades}</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h6" color="text.secondary">Active Strategies</Typography>
                            <Typography variant="h4">{stats.activeStrategies}</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h6" color="text.secondary">Market Change</Typography>
                            <Typography variant="h4" color={stats.marketChange.startsWith('+') ? 'success.main' : 'error.main'}>
                                {stats.marketChange}
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Quick Access Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {quickAccessItems.map((item) => (
                        <Grid item xs={12} sm={6} md={3} key={item.title}>
                            <Card>
                                <CardActionArea component={Link} to={item.path}>
                                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                                        <Box sx={{ mb: 2, color: 'primary.main' }}>
                                            {item.icon}
                                        </Box>
                                        <Typography variant="h6">{item.title}</Typography>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {/* Recent Activity */}
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Recent Activity</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <List>
                        {recentActivity.map((activity, index) => (
                            <React.Fragment key={index}>
                                <ListItem>
                                    <ListItemIcon>
                                        {activity.type === 'trade' && <ListAltIcon color="primary" />}
                                        {activity.type === 'strategy' && <PsychologyIcon color="primary" />}
                                        {activity.type === 'market' && <TrendingUpIcon color="primary" />}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={activity.description}
                                        secondary={activity.time}
                                    />
                                    <Chip
                                        label={activity.type}
                                        size="small"
                                        color={activity.type === 'market' ? 'success' : 'default'}
                                    />
                                </ListItem>
                                {index < recentActivity.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>
            </Box>
        </div>
    );
}

export default Home;