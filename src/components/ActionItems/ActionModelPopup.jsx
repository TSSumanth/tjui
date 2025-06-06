import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    IconButton,
    Typography,
    CircularProgress,
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';

function CreateActionItem({ isOpen, onClose, onSave, tradeId, tradeType, asset }) {
    const [formData, setFormData] = useState({
        description: '',
        status: 'TODO',
        created_by: 'MANUAL',
        asset: '',
        stock_trade_id: null,
        option_trade_id: null
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Update form data when trade props change
    useEffect(() => {
        if (tradeId && tradeType) {
            setFormData(prev => ({
                ...prev,
                asset: asset || '',
                [tradeType === 'stock' ? 'stock_trade_id' : 'option_trade_id']: tradeId
            }));
        }
    }, [tradeId, tradeType, asset]);

    const handleSave = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            await onSave(formData);
            setFormData({
                description: '',
                status: 'TODO',
                created_by: 'MANUAL',
                asset: '',
                stock_trade_id: null,
                option_trade_id: null
            });
            onClose();
        } catch (error) {
            console.error('Error saving action item:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setFormData({
            description: '',
            status: 'TODO',
            created_by: 'MANUAL',
            asset: '',
            stock_trade_id: null,
            option_trade_id: null
        });
        onClose();
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    return (
        <Dialog
            open={isOpen}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    minHeight: '300px'
                }
            }}
        >
            <DialogTitle sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid',
                borderColor: 'divider',
                pb: 2
            }}>
                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                    Create Action Item
                </Typography>
                <IconButton
                    edge="end"
                    color="inherit"
                    onClick={handleClose}
                    aria-label="close"
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
                <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <FormControl fullWidth>
                        <InputLabel id="status-label">Status</InputLabel>
                        <Select
                            labelId="status-label"
                            value={formData.status}
                            label="Status"
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                            <MenuItem value="TODO">TODO</MenuItem>
                            <MenuItem value="COMPLETED">COMPLETED</MenuItem>
                            <MenuItem value="INVALID">INVALID</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        fullWidth
                        label="Created By"
                        value={formData.created_by}
                        disabled
                        InputProps={{
                            readOnly: true,
                        }}
                    />

                    <TextField
                        fullWidth
                        label="Asset"
                        value={formData.asset}
                        onChange={(e) => setFormData({ ...formData, asset: e.target.value })}
                        placeholder="Enter asset name"
                    />

                    {tradeType === 'stock' && (
                        <TextField
                            fullWidth
                            label="Stock Trade ID"
                            value={formData.stock_trade_id || ''}
                            disabled
                            InputProps={{
                                readOnly: true,
                            }}
                        />
                    )}

                    {tradeType === 'option' && (
                        <TextField
                            fullWidth
                            label="Option Trade ID"
                            value={formData.option_trade_id || ''}
                            disabled
                            InputProps={{
                                readOnly: true,
                            }}
                        />
                    )}

                    <Box>
                        <Typography variant="subtitle1" component="div" sx={{ mb: 1, fontWeight: 'medium' }}>
                            Description
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Enter description"
                            variant="outlined"
                            error={!!errors.description}
                            helperText={errors.description}
                        />
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions sx={{
                px: 3,
                py: 2,
                borderTop: '1px solid',
                borderColor: 'divider'
            }}>
                <Button
                    onClick={handleClose}
                    color="inherit"
                    sx={{ mr: 1 }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    color="primary"
                    disabled={isSubmitting}
                    sx={{
                        minWidth: '100px',
                        '&:disabled': {
                            backgroundColor: 'action.disabledBackground',
                            color: 'action.disabled'
                        }
                    }}
                >
                    {isSubmitting ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={20} color="inherit" />
                            <Typography variant="button" component="span">
                                Saving...
                            </Typography>
                        </Box>
                    ) : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export { CreateActionItem };