import React, { useState } from 'react';
import { Box, Button, Paper } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CreateAlgoStrategyPopup from './CreateAlgoStrategyPopup';



const StrategyMenu = () => {
    const [showCreatePopup, setShowCreatePopup] = useState(false);

    return (
        <Box sx={{ p: 3 }}>
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
                        onClick={() => setShowCreatePopup(true)}
                        sx={{ minWidth: 200 }}
                    >
                        Nifty Bear Call Spread
                    </Button>

                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<TrendingUpIcon />}
                        onClick={() => setShowCreatePopup(true)}
                        sx={{ minWidth: 200 }}
                    >
                        Nifty Bull Put Spread
                    </Button>
                </Box>
            </Paper>
            <CreateAlgoStrategyPopup
                open={showCreatePopup}
                onClose={() => setShowCreatePopup(false)}
                onSuccess={() => setShowCreatePopup(false)}
            />
        </Box>
    );
};

export default StrategyMenu;