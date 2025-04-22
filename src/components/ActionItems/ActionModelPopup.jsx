import React, { useState } from "react";
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

function CreateActionItem({ isOpen, onClose, onSave }) {
    const [status, setStatus] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSave = () => {
        if (!status || !description) return;

        setIsSubmitting(true);
        onSave({
            "status": status,
            "description": description
        });
        setIsSubmitting(false);
        onClose();
    };

    const handleClose = () => {
        setStatus('');
        setDescription('');
        onClose();
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
                    minHeight: '400px'
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
                            value={status}
                            label="Status"
                            onChange={(e) => setStatus(e.target.value)}
                            sx={{
                                '& .MuiSelect-select': {
                                    color: 'text.primary'
                                }
                            }}
                        >
                            <MenuItem value="TODO">TODO</MenuItem>
                            <MenuItem value="COMPLETED">COMPLETED</MenuItem>
                        </Select>
                    </FormControl>

                    <Box>
                        <Typography variant="subtitle1" component="div" sx={{ mb: 1, fontWeight: 'medium' }}>
                            Description
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter description"
                            variant="outlined"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '&:hover fieldset': {
                                        borderColor: 'primary.main',
                                    },
                                },
                            }}
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
                    disabled={isSubmitting || !status || !description}
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