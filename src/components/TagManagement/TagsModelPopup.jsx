import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    Button,
    Box,
    IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import NotesEditor from "../Generic/NotesEditor.jsx";

function TagModal({ isOpen, onClose, onSave, record = {} }) {
    const [name, setName] = useState(record.name || "");
    const [description, setDescription] = useState(record.description || "");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSave = () => {
        setIsSubmitting(true);
        onSave({ name, description });
        setIsSubmitting(false);
        onClose();
    };

    return (
        <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>
                {record.name ? "Update Tag" : "Create Tag"}
                <IconButton
                    onClick={onClose}
                    sx={{ position: "absolute", right: 8, top: 8 }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <Box component="form" onSubmit={(e) => e.preventDefault()}>
                    <TextField
                        label="Tag Name (Required)"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <NotesEditor
                        id="noteseditor"
                        name="description"
                        initialValue={description}
                        onChange={(content) => setDescription(content)}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={handleSave}
                        disabled={isSubmitting}
                        sx={{ mt: 2 }}
                    >
                        {isSubmitting ? "Saving..." : "Save"}
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
}

export default TagModal;
