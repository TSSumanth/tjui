import React, { useState, useEffect, useCallback } from "react";
import { Typography, Button, Box, CircularProgress, Alert } from "@mui/material";
import { getActionItems, updateActionItem, addActionItem } from "../../services/actionitems.js";
import { CreateActionItem } from "./ActionModelPopup.jsx";
import ActionCard from "./ActionCard.jsx";

const ActionItems = () => {
    const [activeActionItems, setActiveActionItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);

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
        <Box sx={{ p: 2 }}>
            {/* Header Section */}
            <Box sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3
            }}>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: "primary.main" }}>
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

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Loading State */}
            {loading && (
                <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
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
                                    <ActionCard
                                        key={item.id}
                                        item={item}
                                        onComplete={() => markComplete(item)}
                                    />
                                ))}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                {rightItems.map((item) => (
                                    <ActionCard
                                        key={item.id}
                                        item={item}
                                        onComplete={() => markComplete(item)}
                                    />
                                ))}
                            </Box>
                        </>
                    ) : (
                        <Typography
                            variant="h6"
                            sx={{
                                textAlign: "center",
                                color: "success.main",
                                width: "100%",
                                py: 4
                            }}
                        >
                            No Pending Action Items
                        </Typography>
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
        </Box>
    );
};

export default ActionItems;