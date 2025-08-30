import React, { useState } from 'react';
import { Box } from '@mui/material';
import ZerodhaSubHeader from '../components/zerodha/ZerodhaSubHeader';
import StrategyMenu from '../components/ZerodhaAlgoTrades/StrategyMenu';
import MyAlgoStrategies from '../components/ZerodhaAlgoTrades/MyAlgoStrategies';

const MyAlgoStrategiesPage = () => {
    const [refreshKey, setRefreshKey] = useState(0);

    const handleStrategyCreated = () => {
        // Increment refresh key to trigger re-render of MyAlgoStrategies
        setRefreshKey(prev => prev + 1);
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 3, px: 2 }}>
            <ZerodhaSubHeader />
            <StrategyMenu onStrategyCreated={handleStrategyCreated} />
          
            <MyAlgoStrategies key={refreshKey} />
        </Box>
    );
};

export default MyAlgoStrategiesPage; 