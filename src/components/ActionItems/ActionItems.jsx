import React, { useState, useEffect } from "react";
import {
    Typography,
    Button,
    Box,
    CircularProgress,
    Alert,
    Snackbar,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Chip,
    Divider
} from "@mui/material";
import { getActionItems, updateActionItem, addActionItem, deleteActionItem } from "../../services/actionitems.js";
import { CreateActionItem } from "./ActionModelPopup.jsx";
import DeleteIcon from '@mui/icons-material/Delete';

const ActionItems = () => {
    const [activeActionItems, setActiveActionItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);

    const fetchActiveActionItems = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getActionItems();
            // Filter out completed items
            const activeItems = data.filter(item => item.status !== 'COMPLETED');
            setActiveActionItems(activeItems);
        } catch (error) {
            console.error("Error fetching action items:", error);
            setError("Failed to fetch action items. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActiveActionItems();
    }, []);

    const markComplete = async (item) => {
        try {
            setLoading(true);
            setError(null);
            const updatedItem = { ...item, status: "COMPLETED" };
            await updateActionItem(updatedItem);
            await fetchActiveActionItems();
            setSuccessMessage("Action item marked as complete!");
        } catch (error) {
            console.error("Error updating action item:", error);
            setError("Failed to update action item. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (itemId) => {
        try {
            await deleteActionItem(itemId);
            await fetchActiveActionItems();
        } catch (error) {
            console.error('Error deleting action item:', error);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                <Box sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3
                }}>
                    <Typography variant="h5" sx={{
                        fontWeight: "bold",
                        color: "primary.main"
                    }}>
                        Action Items
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setShowModal(true)}
                        disabled={loading}
                    >
                        Create Action Item
                    </Button>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {loading && (
                    <Box sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        minHeight: "200px"
                    }}>
                        <CircularProgress />
                    </Box>
                )}

                {!loading && (
                    <List>
                        {activeActionItems.map((item) => (
                            <React.Fragment key={item.id}>
                                <ListItem>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                        <Typography variant="body1" sx={{ mb: 1 }}>
                                            {item.description}
                                        </Typography>
                                        <Chip
                                            label={item.status}
                                            color={item.status === 'COMPLETED' ? 'success' : 'default'}
                                            size="small"
                                            onClick={() => markComplete(item)}
                                        />
                                    </Box>
                                    <ListItemSecondaryAction>
                                        <IconButton edge="end" onClick={() => handleDelete(item.id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                                <Divider />
                            </React.Fragment>
                        ))}
                    </List>
                )}

                {showModal && (
                    <CreateActionItem
                        isOpen={showModal}
                        onClose={() => setShowModal(false)}
                        onSave={async (newItem) => {
                            try {
                                await addActionItem(newItem);
                                await fetchActiveActionItems();
                                setShowModal(false);
                                setSuccessMessage("Action item created successfully!");
                            } catch (error) {
                                console.error("Error adding action item:", error);
                                setError("Failed to add action item. Please try again.");
                            }
                        }}
                    />
                )}

                <Snackbar
                    open={!!successMessage}
                    autoHideDuration={3000}
                    onClose={() => setSuccessMessage(null)}
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                >
                    <Alert
                        onClose={() => setSuccessMessage(null)}
                        severity="success"
                        sx={{ width: "100%" }}
                    >
                        {successMessage}
                    </Alert>
                </Snackbar>
            </Paper>
        </Box>
    );
};

export default ActionItems;