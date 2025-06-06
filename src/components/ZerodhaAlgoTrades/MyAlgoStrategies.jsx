import React, { useEffect, useState } from 'react';
import { Typography, Box } from '@mui/material';
import { getAlgoStrategies } from '../../services/algoStrategies';
import zerodhaWebSocket from '../zerodhawebsocket/WebSocket';
import StrategyRow from './StrategyRow';
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
            <Stack direction="row" spacing={2} mb={2}>
                <Subscribe onSubscribeSuccess={zerodhaWebSocketData.getSubscriptions} />
                <Unsubscribe subscribed={subscribedTokens} onUnsubscribeSuccess={zerodhaWebSocketData.getSubscriptions} />
            </Stack>

            <Box>
                {strategies.map((strategy) => (
                    <StrategyRow
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