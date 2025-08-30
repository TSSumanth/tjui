import React from 'react';
import { Box } from '@mui/material';
import StrategyBox from './StrategyBox';
import StrategyNotesPanel from './StrategyNotesPanel';

const StrategyRow = ({ strategy, onStrategyUpdate, zerodhaWebSocketData }) => (
    <Box
        sx={{
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 2,
            mb: 3,
            overflow: 'hidden',
        }}
    >
        {/* Strategy Box - Full Width */}
        <Box sx={{
            width: '100%',
            border: '1px solid #ddd',
            borderRadius: '16px 16px 0 0',
            bgcolor: 'background.paper',
            boxSizing: 'border-box',
        }}>
            <StrategyBox
                strategy={strategy}
                onStrategyUpdate={onStrategyUpdate}
                zerodhaWebSocketData={zerodhaWebSocketData}
            />
        </Box>
        
        {/* Strategy Notes Panel - Below Strategy Box */}
        <Box sx={{
            width: '100%',
            bgcolor: 'background.paper',
            borderRadius: '0 0 16px 16px',
            boxSizing: 'border-box',
            border: '1px solid #ddd',
            borderTop: 'none',
        }}>
            <StrategyNotesPanel strategyid={strategy.strategyid} />
        </Box>
    </Box>
);

export default StrategyRow; 