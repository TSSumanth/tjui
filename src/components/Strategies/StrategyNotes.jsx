import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
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
    DialogActions,
    Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { getStrategyNotes, addStrategyNote, updateStrategyNote, deleteStrategyNote } from '../../services/strategies';

const MenuBar = ({ editor }) => {
    if (!editor) {
        return null;
    }

    return (
        <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            <Tooltip title="Bold">
                <IconButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    color={editor.isActive('bold') ? 'primary' : 'default'}
                >
                    <FormatBoldIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title="Italic">
                <IconButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    color={editor.isActive('italic') ? 'primary' : 'default'}
                >
                    <FormatItalicIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title="Bullet List">
                <IconButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    color={editor.isActive('bulletList') ? 'primary' : 'default'}
                >
                    <FormatListBulletedIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title="Numbered List">
                <IconButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    color={editor.isActive('orderedList') ? 'primary' : 'default'}
                >
                    <FormatListNumberedIcon />
                </IconButton>
            </Tooltip>
        </Box>
    );
};

const StrategyNotes = ({ strategyId }) => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingNote, setEditingNote] = useState(null);
    const [showAddNoteDialog, setShowAddNoteDialog] = useState(false);

    const newNoteEditor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Add a new note...',
            }),
        ],
        content: '',
    });

    const editNoteEditor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Edit your note...',
            }),
        ],
        content: '',
    });

    useEffect(() => {
        fetchNotes();
    }, [strategyId]);

    const fetchNotes = async () => {
        try {
            setLoading(true);
            if (!strategyId) {
                setError('Strategy ID is required');
                return;
            }
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
        if (!newNoteEditor?.getHTML()?.trim()) return;

        try {
            const addedNote = await addStrategyNote(strategyId, newNoteEditor.getHTML());
            if (addedNote) {
                setNotes([...notes, addedNote]);
                newNoteEditor.commands.setContent('');
                setShowAddNoteDialog(false);
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
        editNoteEditor.commands.setContent(note.content);
    };

    const handleUpdateNote = async () => {
        if (!editNoteEditor?.getHTML()?.trim()) return;

        try {
            const success = await updateStrategyNote(editingNote.id, editNoteEditor.getHTML());
            if (success) {
                setNotes(notes.map(note =>
                    note.id === editingNote.id
                        ? { ...note, content: editNoteEditor.getHTML() }
                        : note
                ));
                setEditingNote(null);
                editNoteEditor.commands.setContent('');
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
            console.log(success);
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                        Strategy Notes
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setShowAddNoteDialog(true)}
                    >
                        Add Note
                    </Button>
                </Box>

                {error && (
                    <Typography color="error">
                        {error}
                    </Typography>
                )}

                {loading ? (
                    <Typography>Loading notes...</Typography>
                ) : notes.length === 0 ? (
                    <Typography color="text.secondary">
                        No notes yet. Click "Add Note" to create your first note.
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
                                    primary={
                                        <Box
                                            dangerouslySetInnerHTML={{ __html: note.content }}
                                            sx={{
                                                '& ul, & ol': {
                                                    pl: 2,
                                                    mb: 1
                                                },
                                                '& p': {
                                                    mb: 1
                                                }
                                            }}
                                        />
                                    }
                                    secondary={new Date(note.created_at).toLocaleString()}
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </Stack>

            {/* Add Note Dialog */}
            <Dialog
                open={showAddNoteDialog}
                onClose={() => setShowAddNoteDialog(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        width: '80%',
                        height: '60%',
                        maxHeight: '80vh',
                        maxWidth: '80vw'
                    }
                }}
            >
                <DialogTitle>Add New Note</DialogTitle>
                <DialogContent sx={{ height: 'calc(100% - 120px)', p: 2 }}>
                    <Paper variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <MenuBar editor={newNoteEditor} />
                        <Box
                            sx={{
                                flexGrow: 1,
                                overflow: 'auto',
                                p: 2,
                                '& .ProseMirror': {
                                    minHeight: '300px',
                                    height: '100%',
                                    outline: 'none',
                                    '& p': {
                                        margin: '0.5em 0'
                                    }
                                }
                            }}
                        >
                            <EditorContent editor={newNoteEditor} />
                        </Box>
                    </Paper>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowAddNoteDialog(false)}>Cancel</Button>
                    <Button
                        onClick={handleAddNote}
                        variant="contained"
                        color="primary"
                        disabled={!newNoteEditor?.getHTML()?.trim()}
                    >
                        Add
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Note Dialog */}
            <Dialog
                open={!!editingNote}
                onClose={() => setEditingNote(null)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        width: '80%',
                        height: '60%',
                        maxHeight: '80vh',
                        maxWidth: '80vw'
                    }
                }}
            >
                <DialogTitle>Edit Note</DialogTitle>
                <DialogContent sx={{ height: 'calc(100% - 120px)', p: 2 }}>
                    <Paper variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <MenuBar editor={editNoteEditor} />
                        <Box
                            sx={{
                                flexGrow: 1,
                                overflow: 'auto',
                                p: 2,
                                '& .ProseMirror': {
                                    minHeight: '300px',
                                    height: '100%',
                                    outline: 'none',
                                    '& p': {
                                        margin: '0.5em 0'
                                    }
                                }
                            }}
                        >
                            <EditorContent editor={editNoteEditor} />
                        </Box>
                    </Paper>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditingNote(null)}>Cancel</Button>
                    <Button
                        onClick={handleUpdateNote}
                        variant="contained"
                        color="primary"
                        disabled={!editNoteEditor?.getHTML()?.trim()}
                    >
                        Update
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default StrategyNotes; 