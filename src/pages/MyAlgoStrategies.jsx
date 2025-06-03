import React from 'react';
import { Box } from '@mui/material';
import ZerodhaSubHeader from '../components/zerodha/ZerodhaSubHeader';
import StrategyMenu from '../components/ZerodhaAlgoTrades/StrategyMenu';
import MyAlgoStrategies from '../components/ZerodhaAlgoTrades/MyAlgoStrategies';

const MyAlgoStrategiesPage = () => {
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 3, px: 2 }}>
            <ZerodhaSubHeader />
            <StrategyMenu />
            <MyAlgoStrategies />
        </Box>
    );
};

export default MyAlgoStrategiesPage; 