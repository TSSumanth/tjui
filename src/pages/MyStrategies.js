import React from "react";
// import  Header  from '../components/Header/Header2'
import Header from '../components/Header/Header'

import { Button, Container, Box, Typography, Stack } from "@mui/material";
import StrategyHeader from '../components/Strategies/StrategiesHeader'
import StrategyCards from '../components/Strategies/StrategyCard'
const StrategyPage = () => {
    return (
        <Stack>
            {/* <Header />
           */}
            <Header />
            
            <StrategyHeader />
            <StrategyCards />
        </Stack>
    );
};

export default StrategyPage;