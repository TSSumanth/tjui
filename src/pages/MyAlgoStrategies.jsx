import React from 'react';
import { Box, Grid } from '@mui/material';
import ZerodhaSubHeader from '../components/zerodha/ZerodhaSubHeader';
import TradeTypes from '../components/ZerodhaAlgoTrades/TradeTypes';
import StrategyBox from '../components/ZerodhaAlgoTrades/StrategyBox';

const MyAlgoStrategiesPage = () => {
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', p: 1 }}>
            <ZerodhaSubHeader />
            <TradeTypes />
            <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                    <StrategyBox
                        strategyName="Iron Condor"
                        trades={[
                            { date: '05/21/25 09:10 AM', createdBy: 'User1', name: 'Short Straddle Entry' },
                            { date: '05/21/25 09:45 AM', createdBy: 'User1', name: 'Adjustment Order' }
                        ]}
                        details="This strategy is currently in profit. Monitor the short legs for early exit opportunities."
                    />
                </Grid>
                {/* <Grid item xs={12} md={6}>
                    <StrategyBox
                        strategyName="Short Straddle"
                        trades={[
                            { date: '05/21/25 09:10 AM', createdBy: 'User1', name: 'Short Straddle Entry' },
                            { date: '05/21/25 09:45 AM', createdBy: 'User1', name: 'Adjustment Order' }
                        ]}
                        details="Short straddle is at risk if the market moves sharply. Consider hedging."
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <StrategyBox
                        strategyName="Short Straddle"
                        trades={[
                            { date: '05/21/25 09:10 AM', createdBy: 'User1', name: 'Short Straddle Entry' },
                            { date: '05/21/25 09:45 AM', createdBy: 'User1', name: 'Adjustment Order' }
                        ]}
                        details="Short straddle is at risk if the market moves sharply. Consider hedging."
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <StrategyBox
                        strategyName="Short Straddle"
                        trades={[
                            { date: '05/21/25 09:10 AM', createdBy: 'User1', name: 'Short Straddle Entry' },
                            { date: '05/21/25 09:45 AM', createdBy: 'User1', name: 'Adjustment Order' }
                        ]}
                        details="Short straddle is at risk if the market moves sharply. Consider hedging."
                    />
                </Grid> */}
            </Grid>
        </Box>
    );
};

export default MyAlgoStrategiesPage; 