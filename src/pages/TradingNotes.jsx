import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    CardActions,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Alert,
    CircularProgress,
    Grid,
    Chip,
    Paper,
    Divider,
    Fab,
    Tooltip
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Note as NoteIcon,
    Save as SaveIcon,
    Cancel as CancelIcon
} from '@mui/icons-material';
import { 
    createTradingNote, 
    getTradingNotes, 
    updateTradingNote, 
    deleteTradingNote 
} from '../services/tradingNotes';

function TradingNotes() {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const [formData, setFormData] = useState({ title: '', content: '' });
    const [submitting, setSubmitting] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getTradingNotes();
            if (response.success) {
                setNotes(response.data);
            } else {
                setError(response.error || 'Failed to fetch notes');
            }
        } catch (err) {
            console.error('Error fetching notes:', err);
            setError('Failed to load trading notes');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (note = null) => {
        if (note) {
            setEditingNote(note);
            setFormData({ title: note.title, content: note.content });
        } else {
            setEditingNote(null);
            setFormData({ title: '', content: '' });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingNote(null);
        setFormData({ title: '', content: '' });
    };

    const handleSubmit = async () => {
        if (!formData.title.trim() || !formData.content.trim()) {
            setError('Title and content are required');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            let response;
            if (editingNote) {
                response = await updateTradingNote(editingNote.id, formData);
            } else {
                response = await createTradingNote(formData);
            }

            if (response.success) {
                handleCloseDialog();
                fetchNotes();
            } else {
                setError(response.error || 'Failed to save note');
            }
        } catch (err) {
            console.error('Error saving note:', err);
            setError('Failed to save trading note');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (noteId) => {
        try {
            setSubmitting(true);
            const response = await deleteTradingNote(noteId);
            if (response.success) {
                fetchNotes();
            } else {
                setError(response.error || 'Failed to delete note');
            }
        } catch (err) {
            console.error('Error deleting note:', err);
            setError('Failed to delete trading note');
        } finally {
            setSubmitting(false);
            setDeleteConfirm(null);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '50vh' 
            }}>
                <CircularProgress size={40} />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 3 
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <NoteIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        Trading Notes
                    </Typography>
                    <Chip 
                        label={`${notes.length} notes`} 
                        color="primary" 
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                    />
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                    sx={{
                        backgroundColor: '#1a237e',
                        color: 'white',
                        px: 3,
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '1rem',
                        fontWeight: 600,
                        boxShadow: '0 4px 12px rgba(26, 35, 126, 0.3)',
                        '&:hover': {
                            backgroundColor: '#283593',
                            boxShadow: '0 6px 16px rgba(26, 35, 126, 0.4)'
                        }
                    }}
                >
                    Add New Note
                </Button>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert 
                    severity="error" 
                    sx={{ mb: 3 }}
                    onClose={() => setError(null)}
                >
                    {error}
                </Alert>
            )}

            {/* Notes List */}
            {notes.length === 0 ? (
                <Paper sx={{ 
                    p: 6, 
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                    borderRadius: 3
                }}>
                    <NoteIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                        No trading notes yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Start documenting your trading insights and strategies
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                        sx={{
                            backgroundColor: '#1a237e',
                            color: 'white',
                            px: 3,
                            py: 1.5,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontSize: '1rem',
                            fontWeight: 600
                        }}
                    >
                        Create Your First Note
                    </Button>
                </Paper>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {notes.map((note) => (
                        <Card key={note.id} sx={{
                            background: 'white',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                            border: '1px solid rgba(0,0,0,0.05)',
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
                            }
                        }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Typography variant="h5" sx={{ 
                                        fontWeight: 700, 
                                        color: 'text.primary',
                                        fontSize: '1.3rem',
                                        lineHeight: 1.3,
                                        flex: 1,
                                        mr: 2
                                    }}>
                                        {note.title}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Tooltip title="Edit">
                                            <IconButton
                                                onClick={() => handleOpenDialog(note)}
                                                sx={{ 
                                                    color: 'primary.main',
                                                    backgroundColor: 'rgba(25, 118, 210, 0.08)',
                                                    '&:hover': { 
                                                        backgroundColor: 'primary.main', 
                                                        color: 'white',
                                                        transform: 'scale(1.1)'
                                                    },
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton
                                                onClick={() => setDeleteConfirm(note)}
                                                sx={{ 
                                                    color: 'error.main',
                                                    backgroundColor: 'rgba(211, 47, 47, 0.08)',
                                                    '&:hover': { 
                                                        backgroundColor: 'error.main', 
                                                        color: 'white',
                                                        transform: 'scale(1.1)'
                                                    },
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </Box>
                                
                                <Typography 
                                    variant="body1" 
                                    color="text.secondary" 
                                    sx={{ 
                                        mb: 3,
                                        lineHeight: 1.7,
                                        fontSize: '1rem',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word'
                                    }}
                                >
                                    {note.content}
                                </Typography>
                                
                                <Divider sx={{ my: 2 }} />
                                
                                <Box sx={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: 1
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Chip 
                                            icon={<NoteIcon />}
                                            label={`Created: ${formatDate(note.created_at)}`}
                                            size="small"
                                            variant="outlined"
                                            sx={{ 
                                                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                                                borderColor: 'primary.main',
                                                color: 'primary.main',
                                                fontWeight: 500
                                            }}
                                        />
                                        {note.updated_at && (
                                            <Chip 
                                                icon={<EditIcon />}
                                                label={`Updated: ${formatDate(note.updated_at)}`}
                                                size="small"
                                                variant="outlined"
                                                sx={{ 
                                                    backgroundColor: 'rgba(76, 175, 80, 0.08)',
                                                    borderColor: 'success.main',
                                                    color: 'success.main',
                                                    fontWeight: 500
                                                }}
                                            />
                                        )}
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                        ID: {note.id}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            )}

            {/* Create/Edit Dialog */}
            <Dialog 
                open={openDialog} 
                onClose={handleCloseDialog}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                    }
                }}
            >
                <DialogTitle sx={{ 
                    pb: 1,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    fontWeight: 700
                }}>
                    {editingNote ? 'Edit Trading Note' : 'Create New Trading Note'}
                </DialogTitle>
                <DialogContent sx={{ p: 3 }}>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Title"
                        fullWidth
                        variant="outlined"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        sx={{ mb: 3 }}
                    />
                    <TextField
                        margin="dense"
                        label="Content"
                        fullWidth
                        multiline
                        rows={8}
                        variant="outlined"
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        placeholder="Write your trading insights, strategies, or observations here..."
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3, gap: 1 }}>
                    <Button
                        onClick={handleCloseDialog}
                        startIcon={<CancelIcon />}
                        disabled={submitting}
                        sx={{ textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        startIcon={submitting ? <CircularProgress size={16} /> : <SaveIcon />}
                        disabled={submitting || !formData.title.trim() || !formData.content.trim()}
                        sx={{
                            backgroundColor: '#1a237e',
                            textTransform: 'none',
                            px: 3
                        }}
                    >
                        {submitting ? 'Saving...' : (editingNote ? 'Update' : 'Create')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                    }
                }}
            >
                <DialogTitle sx={{ color: 'error.main', fontWeight: 700 }}>
                    Confirm Delete
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete "{deleteConfirm?.title}"? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 3, gap: 1 }}>
                    <Button
                        onClick={() => setDeleteConfirm(null)}
                        disabled={submitting}
                        sx={{ textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => handleDelete(deleteConfirm?.id)}
                        variant="contained"
                        color="error"
                        startIcon={submitting ? <CircularProgress size={16} /> : <DeleteIcon />}
                        disabled={submitting}
                        sx={{ textTransform: 'none' }}
                    >
                        {submitting ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default TradingNotes;
