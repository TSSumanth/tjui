import React, { useState } from 'react';
import { Grid, Paper, Typography, Button, Box, Snackbar, Alert } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { updateAccountSummary, getAccountSummary } from '../../services/accountSummary';

const AccountSummary = ({ accountInfo }) => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(false);

    const handleSave = async () => {
        try {
            setLoading(true);
            const response = await updateAccountSummary(
                accountInfo.clientId,
                accountInfo.name,
                accountInfo.email
            );
            if (response.success) {
                setSuccess(true);
            } else {
                setError(true);
            }
        } catch (err) {
            console.error('Error saving account details:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                        Account Summary
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Save Account Details'}
                    </Button>
                </Box>
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
            <Snackbar
                open={success}
                autoHideDuration={3000}
                onClose={() => setSuccess(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={() => setSuccess(false)} severity="success" sx={{ width: '100%' }}>
                    Account details saved successfully!
                </Alert>
            </Snackbar>
            <Snackbar
                open={error}
                autoHideDuration={3000}
                onClose={() => setError(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={() => setError(false)} severity="error" sx={{ width: '100%' }}>
                    Failed to save account details. Please try again.
                </Alert>
            </Snackbar>
        </Grid>
    );
};

export default React.memo(AccountSummary); 