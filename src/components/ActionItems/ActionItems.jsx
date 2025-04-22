import React, { useState, useEffect, useCallback } from "react";
import {
    Typography,
    Button,
    Box,
    CircularProgress,
    Alert,
    Snackbar,
    Paper,
    Fade
} from "@mui/material";
import { getActionItems, updateActionItem, addActionItem } from "../../services/actionitems.js";
import { CreateActionItem } from "./ActionModelPopup.jsx";
import ActionCard from "./ActionCard.jsx";

const ActionItems = () => {
    const [activeActionItems, setActiveActionItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);

    // Fetch active action items
    const fetchActiveActionItems = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getActionItems();
            setActiveActionItems(data);
        } catch (error) {
            console.error("Error fetching action items:", error);
            setError("Failed to fetch action items. Please try again later.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchActiveActionItems();
    }, [fetchActiveActionItems]);

    // Mark an action as complete
    const markComplete = async (item) => {
        try {
            setLoading(true);
            setError(null);
            const updatedItem = { ...item, status: "COMPLETED" };
            const response = await updateActionItem(updatedItem);
            if (response) {
                setActiveActionItems((prev) => prev.filter((record) => record.id !== item.id));
                setSuccessMessage("Action item marked as complete!");
            }
        } catch (error) {
            console.error("Error updating action item:", error);
            setError("Failed to update action item. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Add new action item
    const addItem = async (item) => {
        try {
            setLoading(true);
            setError(null);

            if (!item.status || !item.description) {
                setError("Status and Description are required.");
                return;
            }

            const response = await addActionItem(item);
            if (response) {
                await fetchActiveActionItems();
                setShowModal(false);
                setSuccessMessage("Action item created successfully!");
            }
        } catch (error) {
            console.error("Error adding action item:", error);
            setError("Failed to add action item. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Split active items into two halves for left & right columns
    const midIndex = Math.ceil(activeActionItems.length / 2);
    const leftItems = activeActionItems.slice(0, midIndex);
    const rightItems = activeActionItems.slice(midIndex);

    return (
        <Box sx={{ p: 3 }}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                {/* Header Section */}
                <Box sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3
                }}>
                    <Typography variant="h5" sx={{
                        fontWeight: "bold",
                        color: "primary.main",
                        display: "flex",
                        alignItems: "center",
                        gap: 1
                    }}>
                        Action Items
                        {activeActionItems.length > 0 && (
                            <Typography
                                variant="caption"
                                sx={{
                                    bgcolor: "primary.main",
                                    color: "white",
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 1
                                }}
                            >
                                {activeActionItems.length}
                            </Typography>
                        )}
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

                {/* Error Alert */}
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Loading State */}
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

                {/* Action Items List */}
                {!loading && (
                    <Box sx={{ display: "flex", gap: 3 }}>
                        {activeActionItems.length > 0 ? (
                            <>
                                <Box sx={{ flex: 1 }}>
                                    {leftItems.map((item) => (
                                        <Fade in={true} key={item.id}>
                                            <Box sx={{ mb: 2 }}>
                                                <ActionCard
                                                    item={item}
                                                    onComplete={() => markComplete(item)}
                                                />
                                            </Box>
                                        </Fade>
                                    ))}
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    {rightItems.map((item) => (
                                        <Fade in={true} key={item.id}>
                                            <Box sx={{ mb: 2 }}>
                                                <ActionCard
                                                    item={item}
                                                    onComplete={() => markComplete(item)}
                                                />
                                            </Box>
                                        </Fade>
                                    ))}
                                </Box>
                            </>
                        ) : (
                            <Box sx={{
                                width: "100%",
                                py: 6,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 2
                            }}>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        color: "text.secondary",
                                    }}
                                >
                                    No Pending Action Items
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: "text.secondary",
                                    }}
                                >
                                    Create a new action item to get started
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}

                {/* Modal Popup */}
                {showModal && (
                    <CreateActionItem
                        isOpen={showModal}
                        onClose={() => setShowModal(false)}
                        onSave={addItem}
                    />
                )}

                {/* Success Snackbar */}
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