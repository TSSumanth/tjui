import React, { useEffect, useState } from 'react';
import { Grid, Typography, Box } from '@mui/material';
import { getAlgoStrategies } from '../../services/algoStrategies';
import StrategyBox from './StrategyBox';
import zerodhaWebSocket from '../zerodhawebsocket/WebSocket';

const MyAlgoStrategies = () => {
    const [strategies, setStrategies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [zerodhaWebSocketData, setZerodhaWebSocketData] = useState({});

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
        <Grid container spacing={3}>
            {strategies.map((strategy) => (
                <Grid container item xs={12} spacing={3} key={strategy.strategyid}>
                    <Grid item xs={12} lg={6} sx={{ display: 'flex', flexDirection: 'column' }}>
                        <StrategyBox
                            strategy={strategy}
                            onStrategyUpdate={fetchStrategies}
                            zerodhaWebSocketData={zerodhaWebSocketData}
                        />
                    </Grid>
                    <Grid item xs={12} lg={6} sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" color="text.secondary">
                            (Details panel or other component goes here)
                        </Typography>
                    </Grid>
                </Grid>
            ))}
        </Grid>
    );
};

export default MyAlgoStrategies; 