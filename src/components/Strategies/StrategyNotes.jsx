import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Paper,
    Divider,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { getStrategyNotes, addStrategyNote, updateStrategyNote, deleteStrategyNote } from '../../services/strategies';

const StrategyNotes = ({ strategyId }) => {
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingNote, setEditingNote] = useState(null);
    const [editContent, setEditContent] = useState('');

    useEffect(() => {
        fetchNotes();
    }, [strategyId]);

    const fetchNotes = async () => {
        try {
            setLoading(true);
            const data = await getStrategyNotes(strategyId);
            setNotes(data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch notes');
            console.error('Error fetching notes:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) return;

        try {
            const addedNote = await addStrategyNote(strategyId, newNote);
            if (addedNote) {
                setNotes([...notes, addedNote]);
                setNewNote('');
                setError(null);
            } else {
                setError('Failed to add note');
            }
        } catch (err) {
            setError('Failed to add note');
            console.error('Error adding note:', err);
        }
    };

    const handleEditNote = (note) => {
        setEditingNote(note);
        setEditContent(note.content);
    };

    const handleUpdateNote = async () => {
        if (!editContent.trim()) return;

        try {
            const success = await updateStrategyNote(editingNote.id, editContent);
            if (success) {
                setNotes(notes.map(note =>
                    note.id === editingNote.id
                        ? { ...note, content: editContent }
                        : note
                ));
                setEditingNote(null);
                setEditContent('');
                setError(null);
            } else {
                setError('Failed to update note');
            }
        } catch (err) {
            setError('Failed to update note');
            console.error('Error updating note:', err);
        }
    };

    const handleDeleteNote = async (noteId) => {
        try {
            const success = await deleteStrategyNote(noteId);
            if (success) {
                setNotes(notes.filter(note => note.id !== noteId));
                setError(null);
            } else {
                setError('Failed to delete note');
            }
        } catch (err) {
            setError('Failed to delete note');
            console.error('Error deleting note:', err);
        }
    };

    return (
        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
            <Stack spacing={2}>
                <Typography variant="h6" gutterBottom>
                    Strategy Notes
                </Typography>

                {error && (
                    <Typography color="error">
                        {error}
                    </Typography>
                )}

                <Stack spacing={2}>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        variant="outlined"
                        placeholder="Add a new note..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleAddNote}
                        disabled={!newNote.trim()}
                        sx={{ alignSelf: 'flex-end' }}
                    >
                        Add Note
                    </Button>
                </Stack>

                <Divider />

                {loading ? (
                    <Typography>Loading notes...</Typography>
                ) : notes.length === 0 ? (
                    <Typography color="text.secondary">
                        No notes yet. Add your first note above.
                    </Typography>
                ) : (
                    <List>
                        {notes.map((note) => (
                            <ListItem
                                key={note.id}
                                secondaryAction={
                                    <Box>
                                        <IconButton
                                            edge="end"
                                            aria-label="edit"
                                            onClick={() => handleEditNote(note)}
                                            sx={{ mr: 1 }}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton
                                            edge="end"
                                            aria-label="delete"
                                            onClick={() => handleDeleteNote(note.id)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                }
                                sx={{
                                    bgcolor: 'background.paper',
                                    mb: 1,
                                    borderRadius: 1,
                                    border: '1px solid',
                                    borderColor: 'divider'
                                }}
                            >
                                <ListItemText
                                    primary={note.content}
                                    secondary={new Date(note.created_at).toLocaleString()}
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </Stack>

            {/* Edit Note Dialog */}
            <Dialog open={!!editingNote} onClose={() => setEditingNote(null)}>
                <DialogTitle>Edit Note</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        fullWidth
                        multiline
                        rows={4}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditingNote(null)}>Cancel</Button>
                    <Button onClick={handleUpdateNote} variant="contained" color="primary">
                        Update
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default StrategyNotes; 