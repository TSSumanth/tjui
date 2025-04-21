import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { updateStrategyNote, deleteStrategyNote } from '../../services/strategies';

function NotesTable({ notes, onUpdate }) {
    const [editNote, setEditNote] = useState(null);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState(null);

    const handleEditClick = (note) => {
        setEditNote(note);
        setShowEditDialog(true);
    };

    const handleDeleteClick = (note) => {
        setNoteToDelete(note);
        setShowDeleteDialog(true);
    };

    const handleEditSubmit = async () => {
        try {
            await updateStrategyNote(editNote.id, editNote.content);
            setShowEditDialog(false);
            onUpdate();
        } catch (error) {
            console.error('Error updating note:', error);
        }
    };

    const handleDeleteSubmit = async () => {
        try {
            await deleteStrategyNote(noteToDelete.id);
            setShowDeleteDialog(false);
            onUpdate();
        } catch (error) {
            console.error('Error deleting note:', error);
        }
    };

    return (
        <>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Content</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {notes.map((note) => (
                            <TableRow key={note.id}>
                                <TableCell>
                                    {new Date(note.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell>{note.content}</TableCell>
                                <TableCell align="right">
                                    <IconButton
                                        size="small"
                                        onClick={() => handleEditClick(note)}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleDeleteClick(note)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Edit Note Dialog */}
            <Dialog
                open={showEditDialog}
                onClose={() => setShowEditDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Edit Note</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Note Content"
                        type="text"
                        fullWidth
                        multiline
                        rows={4}
                        value={editNote?.content || ''}
                        onChange={(e) => setEditNote({ ...editNote, content: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowEditDialog(false)}>Cancel</Button>
                    <Button onClick={handleEditSubmit} variant="contained" color="primary">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Note Dialog */}
            <Dialog
                open={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
            >
                <DialogTitle>Delete Note</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this note? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
                    <Button onClick={handleDeleteSubmit} variant="contained" color="error">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default NotesTable; 