import React, { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    Paper,
    Typography,
    Alert,
    CircularProgress
} from '@mui/material';

const StrategyForm = ({ initialData, onSubmit }) => {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        description: initialData?.description || '',
        stock_trades: initialData?.stock_trades || [],
        option_trades: initialData?.option_trades || []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await onSubmit(initialData?.id, formData);
            setSuccess(true);
        } catch (err) {
            console.error('Error submitting form:', err);
            setError(err.message || 'Failed to update strategy');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper sx={{ p: 3, mt: 2 }}>
            <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="h6" fontWeight="bold">
                        Strategy Details
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            Strategy updated successfully!
                        </Alert>
                    )}

                    <TextField
                        label="Strategy Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        fullWidth
                        required
                    />

                    <TextField
                        label="Description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        fullWidth
                        multiline
                        rows={4}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={loading}
                            sx={{ minWidth: 120 }}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Update Strategy'}
                        </Button>
                    </Box>
                </Box>
            </form>
        </Paper>
    );
};

export default StrategyForm; 