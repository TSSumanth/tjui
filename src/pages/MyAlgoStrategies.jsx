import React from 'react';
import { Box } from '@mui/material';
import ZerodhaSubHeader from '../components/zerodha/ZerodhaSubHeader';
import StrategyMenu from '../components/ZerodhaAlgoTrades/StrategyMenu';
import StrategyBox from '../components/ZerodhaAlgoTrades/StrategyBox';

const MyAlgoStrategiesPage = () => {
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', p: 1 }}>
            <ZerodhaSubHeader />
            <StrategyMenu />
            <StrategyBox />
        </Box>
    );
};

export default MyAlgoStrategiesPage; 