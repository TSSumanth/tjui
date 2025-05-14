import React from 'react';
import { Grid, Paper, Typography, useTheme, alpha } from '@mui/material';
import { formatCurrency } from '../../utils/formatters';

const getMarginItems = (accountInfo) => [
    {
        label: 'Days Opening Balance',
        value: accountInfo?.margins?.equity?.available || 0,
        color: 'success'
    },
    {
        label: 'Amount Utilized today',
        value: accountInfo?.margins?.equity?.utilised || 0,
        color: 'warning'
    },
    {
        label: 'Available balance',
        value: accountInfo?.margins?.equity?.net || 0,
        color: 'info'
    },
    {
        label: 'Exposure',
        value: accountInfo?.margins?.equity?.exposure || 0,
        color: 'error'
    },
    {
        label: 'Option Premium',
        value: accountInfo?.margins?.equity?.optionPremium || 0,
        color: 'secondary'
    },
    {
        label: 'Total Account Value',
        value: (accountInfo?.margins?.equity?.net || 0) +
            (accountInfo?.margins?.equity?.utilised || 0) +
            (accountInfo?.margins?.equity?.exposure || 0) +
            (accountInfo?.margins?.equity?.optionPremium || 0),
        color: 'primary'
    }
];

const EquityMargins = ({ accountInfo }) => {
    const theme = useTheme();
    const marginItems = getMarginItems(accountInfo);

    return (
        <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Equity Margins
                </Typography>
                <Grid container spacing={2}>
                    {marginItems.map((item, index) => (
                        <Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>
                            <Paper
                                sx={{
                                    p: 2,
                                    bgcolor: alpha(theme.palette[item.color].main, 0.1),
                                    border: `1px solid ${alpha(theme.palette[item.color].main, 0.2)}`
                                }}
                            >
                                <Typography variant="subtitle2" color="text.secondary">
                                    {item.label}
                                </Typography>
                                <Typography variant="h6" color={`${item.color}.main`}>
                                    ₹{formatCurrency(item.value)}
                                </Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Paper>
        </Grid>
    );
};

export default React.memo(EquityMargins); 