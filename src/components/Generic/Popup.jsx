import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box
} from '@mui/material';

function ConfirmPopup({ trigger, onCancel, onConfirm, message }) {
    return (
        <Dialog
            open={trigger}
            onClose={onCancel}
            sx={{
                '& .MuiDialog-paper': {
                    minWidth: '300px',
                    maxWidth: '500px',
                    borderRadius: 2,
                    bgcolor: 'background.paper'
                }
            }}
        >
            <DialogTitle>
                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                    Confirmation
                </Typography>
            </DialogTitle>
            <DialogContent>
                <Typography variant="body1" sx={{ py: 2 }}>
                    {message}
                </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button
                    variant="outlined"
                    onClick={onCancel}
                    sx={{
                        color: 'error.main',
                        borderColor: 'error.main',
                        '&:hover': {
                            borderColor: 'error.dark',
                            bgcolor: 'error.light'
                        }
                    }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={onConfirm}
                    sx={{
                        bgcolor: 'success.main',
                        '&:hover': {
                            bgcolor: 'success.dark'
                        }
                    }}
                >
                    Accept
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function AlertPopup({ trigger, onConfirm, message }) {
    return (
        <Dialog
            open={trigger}
            onClose={onConfirm}
            sx={{
                '& .MuiDialog-paper': {
                    minWidth: '300px',
                    maxWidth: '500px',
                    borderRadius: 2,
                    bgcolor: 'background.paper'
                }
            }}
        >
            <DialogTitle>
                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                    Alert
                </Typography>
            </DialogTitle>
            <DialogContent>
                <Typography variant="body1" sx={{ py: 2 }}>
                    {message}
                </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button
                    variant="contained"
                    onClick={onConfirm}
                    sx={{
                        bgcolor: 'primary.main',
                        '&:hover': {
                            bgcolor: 'primary.dark'
                        }
                    }}
                >
                    OK
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function InfoPopup({ trigger, onClose, children }) {
    return (
        <Dialog
            open={trigger}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            sx={{
                '& .MuiDialog-paper': {
                    minHeight: '60vh',
                    maxHeight: '80vh',
                    borderRadius: 2,
                    bgcolor: 'background.paper'
                }
            }}
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                        Information
                    </Typography>
                    <Button
                        onClick={onClose}
                        sx={{
                            color: 'text.secondary',
                            '&:hover': {
                                bgcolor: 'action.hover'
                            }
                        }}
                    >
                        Close
                    </Button>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
                {children}
            </DialogContent>
        </Dialog>
    );
}

export { ConfirmPopup, InfoPopup, AlertPopup };