import React from 'react';
import { Box } from '@mui/material';
import StrategyBox from './StrategyBox';
import StrategyNotesPanel from './StrategyNotesPanel';

const StrategyRow = ({ strategy, onStrategyUpdate, zerodhaWebSocketData }) => (
    <Box
        sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 2,
            mb: 3,
            minHeight: 400,
            overflow: 'hidden',
        }}
    >
        <Box sx={{
            flex: 1,
            minWidth: 0,
            borderRight: { lg: '1px solid #eee' },
            border: '1px solid #ddd',
            borderRadius: { xs: 2, lg: '16px 0 0 16px' },
            bgcolor: 'background.paper',
            boxSizing: 'border-box',
        }}>
            <StrategyBox
                strategy={strategy}
                onStrategyUpdate={onStrategyUpdate}
                zerodhaWebSocketData={zerodhaWebSocketData}
            />
        </Box>
        <Box sx={{
            flex: 1,
            minWidth: 0,
            bgcolor: 'background.paper',
            borderRadius: { xs: 2, lg: '0 16px 16px 0' },
            boxSizing: 'border-box',
            ml: { xs: 0, lg: 1 }, // minimal horizontal space on desktop
            mt: { xs: 1, lg: 0 }, // minimal vertical space on mobile
        }}>
            <StrategyNotesPanel strategyid={strategy.strategyid} />
        </Box>
    </Box>
);

export default StrategyRow; 