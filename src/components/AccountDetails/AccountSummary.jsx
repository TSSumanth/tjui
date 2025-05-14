import React from 'react';
import { Grid, Paper, Typography } from '@mui/material';

const AccountSummary = ({ accountInfo }) => {
    return (
        <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Account Summary
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Client ID
                        </Typography>
                        <Typography variant="body1">
                            {accountInfo.clientId}
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

export default React.memo(AccountSummary); 