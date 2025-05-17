import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';

const AccountSummary = ({ accountInfo }) => {
    return (
        <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                        Account Summary
                    </Typography>
                </Box>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Client ID
                        </Typography>
                        <Typography variant="body1">
                            {accountInfo.client_id}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Name
                        </Typography>
                        <Typography variant="body1">
                            {accountInfo.name}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Email
                        </Typography>
                        <Typography variant="body1">
                            {accountInfo.email}
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>
            
        </Grid>
    );
};

export default AccountSummary; 