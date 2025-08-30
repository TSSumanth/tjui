import React, { useEffect, useState } from 'react';
import { 
    Box, 
    Typography, 
    Link, 
    CircularProgress, 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    IconButton,
    Button,
    DialogActions,
    Alert,
    Snackbar
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { getStrategyNoteById, deleteStrategyNote } from '../../services/algoStrategies';

const StrategyNotesPanel = ({ strategyid, onNotesUpdate }) => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        const fetchNotes = async () => {
            setLoading(true);
            try {
                const data = await getStrategyNoteById(strategyid);
                setNotes(data);
            } catch (err) {
                setNotes([]);
            }
            setLoading(false);
        };
        if (strategyid) fetchNotes();
    }, [strategyid]);

    const handleViewMore = () => setShowDialog(true);
    const handleCloseDialog = () => setShowDialog(false);
    const handleDeleteAllNotes = () => setShowDeleteDialog(true);
    const handleCloseDeleteDialog = () => setShowDeleteDialog(false);

    const confirmDeleteAllNotes = async () => {
        setShowDeleteDialog(false);
        setDeleting(true);
        
        try {
            if (notes && notes.length > 0) {
                // Delete each note
                const deletePromises = notes.map(note => deleteStrategyNote(note.id));
                await Promise.all(deletePromises);
                
                setSnackbar({
                    open: true,
                    message: `Successfully deleted ${notes.length} note${notes.length > 1 ? 's' : ''}`,
                    severity: 'success'
                });
                
                // Clear notes locally
                setNotes([]);
                
                // Notify parent component if callback provided
                if (onNotesUpdate) {
                    onNotesUpdate();
                }
            } else {
                setSnackbar({
                    open: true,
                    message: 'No notes found to delete',
                    severity: 'info'
                });
            }
        } catch (err) {
            setSnackbar({
                open: true,
                message: err?.response?.data?.error || err.message || 'Failed to delete notes',
                severity: 'error'
            });
        }
        setDeleting(false);
    };

    const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

    const latestNotes = notes.slice(0, 5);
    const hasMore = notes.length > 5;

    return (
        <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 0 }}>
            {/* Header with Delete Button */}
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 2
            }}>
                <Typography variant="h6">
                    Strategy Notes
                </Typography>
                {notes.length > 0 && (
                    <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={handleDeleteAllNotes}
                        disabled={deleting}
                        startIcon={<DeleteIcon />}
                    >
                        {deleting ? 'Deleting...' : 'Delete All'}
                    </Button>
                )}
            </Box>

            {loading ? (
                <CircularProgress size={24} />
            ) : latestNotes.length === 0 ? (
                <Typography color="text.secondary">No notes yet.</Typography>
            ) : (
                <>
                    {latestNotes.map(note => (
                        <Box key={note.id} sx={{ mb: 1, p: 1, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
                                {new Date(note.timestamp).toLocaleString()}
                            </Typography>
                            <Typography variant="body1">{note.notes}</Typography>
                        </Box>
                    ))}
                    {hasMore && (
                        <Link component="button" onClick={handleViewMore} sx={{ mt: 1 }}>
                            View More
                        </Link>
                    )}
                </>
            )}

            {/* All Notes Dialog */}
            <Dialog open={showDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    All Notes
                    <IconButton
                        aria-label="close"
                        onClick={handleCloseDialog}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ maxHeight: 500 }}>
                    {notes.length === 0 ? (
                        <Typography color="text.secondary">No notes yet.</Typography>
                    ) : (
                        notes.map(note => (
                            <Box key={note.id} sx={{ mb: 2, p: 1, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
                                    {new Date(note.timestamp).toLocaleString()}
                                </Typography>
                                <Typography variant="body1">{note.notes}</Typography>
                            </Box>
                        ))
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete All Notes Confirmation Dialog */}
            <Dialog
                open={showDeleteDialog}
                onClose={handleCloseDeleteDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ color: 'error.main' }}>
                    Delete All Notes
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Are you sure you want to delete all notes for this strategy?
                    </Typography>
                    <Typography variant="body2" color="error.main" sx={{ fontWeight: 500 }}>
                        ⚠️ This action cannot be undone and will permanently remove all {notes.length} strategy note{notes.length > 1 ? 's' : ''}.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={handleCloseDeleteDialog}
                        disabled={deleting}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={confirmDeleteAllNotes}
                        variant="contained"
                        color="error"
                        disabled={deleting}
                        startIcon={<DeleteIcon />}
                    >
                        {deleting ? 'Deleting...' : 'Delete All Notes'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for feedback */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default StrategyNotesPanel; 