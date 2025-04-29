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
    Divider,
    IconButton,
    Chip,
    Stack,
    Tooltip
} from "@mui/material";
import { getActionItems, updateActionItem, addActionItem, deleteActionItem } from "../../services/actionitems.js";
import { CreateActionItem } from "./ActionModelPopup.jsx";
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import UndoIcon from '@mui/icons-material/Undo';

const ActionItems = () => {
    const [activeActionItems, setActiveActionItems] = useState([]);
    const [completedActionItems, setCompletedActionItems] = useState([]);
    const [invalidActionItems, setInvalidActionItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);

    const fetchActiveActionItems = async () => {
        try {
            const items = await getActionItems({ status: "TODO" });
            setActiveActionItems(items);
        } catch (error) {
            console.error('Error fetching active action items:', error);
        }
    };

    const fetchCompletedActionItems = async () => {
        try {
            const items = await getActionItems({ status: "COMPLETED" });
            setCompletedActionItems(items);
        } catch (error) {
            console.error('Error fetching completed action items:', error);
        }
    };

    const fetchInvalidActionItems = async () => {
        try {
            const items = await getActionItems({ status: "INVALID" });
            setInvalidActionItems(items);
        } catch (error) {
            console.error('Error fetching invalid action items:', error);
        }
    };

    const fetchActionItems = async () => {
        try {
            setLoading(true);
            setError(null);
            const [activeData, completedData, invalidData] = await Promise.all([
                getActionItems("TODO"),
                getActionItems("COMPLETED"),
                getActionItems("INVALID")
            ]);
            setActiveActionItems(activeData);
            setCompletedActionItems(completedData);
            setInvalidActionItems(invalidData);
        } catch (error) {
            console.error("Error fetching action items:", error);
            setError("Failed to fetch action items. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActionItems();
    }, []);

    const markComplete = async (item) => {
        try {
            setLoading(true);
            setError(null);
            const updatedItem = { ...item, status: "COMPLETED" };
            await updateActionItem(updatedItem);
            await fetchActionItems();
            setSuccessMessage("Action item marked as complete!");
        } catch (error) {
            console.error("Error updating action item:", error);
            setError("Failed to update action item. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const markInvalid = async (item) => {
        try {
            setLoading(true);
            setError(null);
            const updatedItem = { ...item, status: "INVALID" };
            await updateActionItem(updatedItem);
            await fetchActionItems();
            setSuccessMessage("Action item marked as invalid!");
        } catch (error) {
            console.error("Error marking action item as invalid:", error);
            setError("Failed to mark action item as invalid. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const markActive = async (item) => {
        try {
            setLoading(true);
            setError(null);
            const updatedItem = { ...item, status: "TODO" };
            await updateActionItem(updatedItem);
            await fetchActionItems();
            setSuccessMessage("Action item moved back to active!");
        } catch (error) {
            console.error("Error moving action item to active:", error);
            setError("Failed to move action item to active. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (itemId) => {
        try {
            await deleteActionItem(itemId);
            await fetchActionItems();
        } catch (error) {
            console.error('Error deleting action item:', error);
        }
    };

    const renderActionItems = (items, isActive = true) => {
        if (loading) {
            return (
                <Box sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "200px"
                }}>
                    <CircularProgress />
                </Box>
            );
        }

        if (items.length === 0) {
            return (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                        No {isActive ? 'active' : 'completed'} action items found
                    </Typography>
                </Box>
            );
        }

        return (
            <List>
                {items.map((item) => (
                    <React.Fragment key={item.id}>
                        <ListItem>
                            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                <Typography variant="body1" sx={{ mb: 1 }}>
                                    {item.description}
                                </Typography>
                                <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                                    <Chip
                                        icon={<PersonIcon />}
                                        label={`Created by: ${item.created_by.toUpperCase()}`}
                                        size="small"
                                        variant="outlined"
                                    />
                                    <Chip
                                        icon={<LocalOfferIcon />}
                                        label={`Asset: ${item.asset || 'N/A'}`}
                                        size="small"
                                        variant="outlined"
                                    />
                                    <Chip
                                        icon={item.status === 'COMPLETED' ? <CheckCircleIcon /> : item.status === 'INVALID' ? <CancelIcon color="error" /> : <CheckCircleOutlineIcon />}
                                        label={item.status}
                                        color={item.status === 'COMPLETED' ? 'success' : item.status === 'INVALID' ? 'error' : 'default'}
                                        size="small"
                                    />
                                </Stack>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                {isActive && (
                                    <Tooltip title="Mark as Complete">
                                        <IconButton
                                            color="success"
                                            onClick={() => markComplete(item)}
                                            disabled={loading}
                                            sx={{
                                                '&:hover': {
                                                    backgroundColor: 'success.light',
                                                    color: 'white'
                                                }
                                            }}
                                        >
                                            <CheckCircleOutlineIcon />
                                        </IconButton>
                                    </Tooltip>
                                )}
                                {isActive && (
                                    <Tooltip title="Mark as Invalid">
                                        <IconButton
                                            color="secondary"
                                            onClick={() => markInvalid(item)}
                                            disabled={loading}
                                            sx={{
                                                '&:hover': {
                                                    backgroundColor: 'secondary.light',
                                                    color: 'white'
                                                }
                                            }}
                                        >
                                            <CancelIcon />
                                        </IconButton>
                                    </Tooltip>
                                )}
                                {!isActive && (
                                    <Tooltip title="Move to Active">
                                        <IconButton
                                            color="primary"
                                            onClick={() => markActive(item)}
                                            disabled={loading}
                                            sx={{
                                                '&:hover': {
                                                    backgroundColor: 'primary.light',
                                                    color: 'white'
                                                }
                                            }}
                                        >
                                            <UndoIcon />
                                        </IconButton>
                                    </Tooltip>
                                )}
                                <Tooltip title="Delete">
                                    <IconButton
                                        color="error"
                                        onClick={() => handleDelete(item.id)}
                                        sx={{
                                            '&:hover': {
                                                backgroundColor: 'error.light',
                                                color: 'white'
                                            }
                                        }}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </ListItem>
                        <Divider />
                    </React.Fragment>
                ))}
            </List>
        );
    };

    return (
        <Box sx={{ p: 3 }}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
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
                        Active Action Items
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

                {renderActionItems(activeActionItems, true)}
            </Paper>

            <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                <Typography variant="h5" sx={{
                    fontWeight: "bold",
                    color: "success.main",
                    mb: 3
                }}>
                    Completed Action Items
                </Typography>
                {renderActionItems(completedActionItems, false)}
            </Paper>

            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h5" sx={{
                    fontWeight: "bold",
                    color: "error.main",
                    mb: 3
                }}>
                    Invalid Action Items
                </Typography>
                {renderActionItems(invalidActionItems, false)}
            </Paper>

            {showModal && (
                <CreateActionItem
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    onSave={async (newItem) => {
                        try {
                            await addActionItem(newItem);
                            await fetchActionItems();
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
        </Box>
    );
};

export default ActionItems;