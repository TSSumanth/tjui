import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Button } from '@mui/material';

export default function AnalysisViewDialog({ open, onClose, title, content }) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <Box sx={{
                    p: 2,
                    backgroundColor: 'background.paper',
                    borderRadius: 1,
                    '& .ql-editor': {
                        padding: 0,
                        '& p': { margin: '0.5em 0' }
                    }
                }}>
                    <div dangerouslySetInnerHTML={{ __html: content }} />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
} 