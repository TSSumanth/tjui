import React, { useEffect, useState } from 'react';
import { Box, Typography, Link, CircularProgress, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { getStrategyNoteById } from '../../services/algoStrategies';

const StrategyNotesPanel = ({ strategyid }) => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);

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

    const latestNotes = notes.slice(0, 5);
    const hasMore = notes.length > 5;

    return (
        <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 0 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
                Strategy Notes
            </Typography>
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
        </Box>
    );
};

export default StrategyNotesPanel; 