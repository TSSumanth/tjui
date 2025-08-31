import React, { useEffect, useState } from 'react';
import { Typography, Box, Card, CardContent } from '@mui/material';
import { getAlgoStrategies } from '../../services/algoStrategies';
import zerodhaWebSocket from '../zerodhawebsocket/WebSocket';
import StrategyCard from './StrategyCard';
import Subscribe from '../zerodhawebsocket/Subscribe';
import Unsubscribe from '../zerodhawebsocket/Unsubscribe';
import { Stack } from '@mui/system';

const MyAlgoStrategies = () => {
    const [strategies, setStrategies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [zerodhaWebSocketData, setZerodhaWebSocketData] = useState({});
    const [subscribedTokens, setSubscribedTokens] = useState([]);
    // Fetch strategies
    const fetchStrategies = async () => {
        try {
            const data = await getAlgoStrategies({ status: 'Open' });
            setStrategies(data);
        } catch (err) {
            console.error('Failed to fetch strategies:', err);
        }
        setLoading(false);
    };

    // Fetch WebSocket data
    useEffect(() => {
        const fetchZerodhaWebSocketData = async () => {
            const data = await zerodhaWebSocket.getSubscriptions();
            if (data && Array.isArray(data)) {
                const transformedData = data.reduce((acc, item) => {
                    acc[item.instrument_token] = item;
                    return acc;
                }, {});
                setZerodhaWebSocketData(transformedData);
                setSubscribedTokens(data);
            }
        };

        // Initial fetch
        fetchZerodhaWebSocketData();

        // Set up interval for every 5 seconds
        const intervalId = setInterval(fetchZerodhaWebSocketData, 5000);

        // Cleanup interval on component unmount
        return () => clearInterval(intervalId);
    }, []);

    // Initial fetch of strategies
    useEffect(() => {
        fetchStrategies();
    }, []);

    if (loading) {
        return <Typography>Loading strategies...</Typography>;
    }

    if (!strategies.length) {
        return <Typography>No open strategies found.</Typography>;
    }

    return (
        <>
            {/* Enhanced Subscription Management Section */}
            <Card sx={{ 
                mb: 3, 
                width: '100%',
                background: 'linear-gradient(135deg, #fafbfc 0%, #ffffff 100%)',
                border: '1px solid',
                borderColor: 'grey.200'
            }}>
                <CardContent sx={{ p: 2 }}>
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1, 
                        mb: 2,
                        pb: 1,
                        borderBottom: '1px solid',
                        borderColor: 'grey.200'
                    }}>
                        <Box sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Typography variant="caption" sx={{ color: 'white', fontWeight: 600, fontSize: '0.7rem' }}>
                                📡
                            </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            Live Data Management
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                            Subscribe to instruments for real-time market data
                        </Typography>
                    </Box>
                    
                    <Stack direction="row" spacing={2} alignItems="stretch">
                        <Subscribe onSubscribeSuccess={zerodhaWebSocketData.getSubscriptions} />
                        <Unsubscribe subscribed={subscribedTokens} onUnsubscribeSuccess={zerodhaWebSocketData.getSubscriptions} />
                    </Stack>
                </CardContent>
            </Card>

            <Box>
                {strategies.map((strategy) => (
                    <StrategyCard
                        key={strategy.strategyid}
                        strategy={strategy}
                        onStrategyUpdate={fetchStrategies}
                        zerodhaWebSocketData={zerodhaWebSocketData}
                    />
                ))}
            </Box>
        </>
    );
};

export default MyAlgoStrategies; 