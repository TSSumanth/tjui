import React from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

const TradeTypes = ({ onStrategySelect }) => {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
                Option Strategies
            </Typography>
            <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                <Box sx={{
                    display: 'flex',
                    gap: 2,
                    flexWrap: 'wrap',
                    justifyContent: { xs: 'center', md: 'flex-start' }
                }}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<TrendingDownIcon />}
                        onClick={() => onStrategySelect('Short Straddle')}
                        sx={{ minWidth: 200 }}
                    >
                        Short Straddle
                    </Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<TrendingUpIcon />}
                        onClick={() => onStrategySelect('Short Strangle')}
                        sx={{ minWidth: 200 }}
                    >
                        Short Strangle
                    </Button>
                    <Button
                        variant="contained"
                        color="info"
                        startIcon={<CallSplitIcon />}
                        onClick={() => onStrategySelect('Iron Fly')}
                        sx={{ minWidth: 200 }}
                    >
                        Iron Fly
                    </Button>
                    <Button
                        variant="contained"
                        color="success"
                        startIcon={<CompareArrowsIcon />}
                        onClick={() => onStrategySelect('Iron Condor')}
                        sx={{ minWidth: 200 }}
                    >
                        Iron Condor
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default TradeTypes;