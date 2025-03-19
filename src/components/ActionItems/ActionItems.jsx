import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, Typography, Button, Box } from "@mui/material";
import { getactiveactionitems, updateactionitem, addactionitem } from "../../services/actionitems.js";
import { CreateActionItem } from "./ActionModelPopup.jsx";

const ActionItems = () => {
    const [activeActionItems, setActiveActionItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Fetch active action items
    const fetchActiveActionItems = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getactiveactionitems();
            setActiveActionItems(data);
        } catch (error) {
            console.error("Error fetching action items:", error);
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
            const updatedItem = { ...item, status: "COMPLETED" };
            const response = await updateactionitem(updatedItem);
            if (response) {
                setActiveActionItems((prev) => prev.filter((record) => record.id !== item.id));
            }
        } catch (error) {
            console.error("Error updating action item:", error);
        } finally {
            setLoading(false);
        }
    };

    // Add new action item
    const addItem = async (item) => {
        try {
            setLoading(true);
            if (!item.status || !item.description) {
                alert("Status and Description are required.");
                return;
            }
            const response = await addactionitem(item);
            if (response) {
                fetchActiveActionItems();
            }
        } catch (error) {
            console.error("Error adding action item:", error);
        } finally {
            setLoading(false);
        }
    };

    // Split active items into two halves for left & right columns
    const midIndex = Math.ceil(activeActionItems.length / 2);
    const leftItems = activeActionItems.slice(0, midIndex);
    const rightItems = activeActionItems.slice(midIndex);

    return (
        <Box>
            {/* Header Section */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin:1 }}>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: "red" }}>
                    Action Items
                </Typography>
                <Button variant="contained" color="primary" onClick={() => setShowModal(true)}>
                    Create Strategy
                </Button>
            </Box>

            {/* Action Items List */}
            <Box sx={{ display: "flex", gap: 2 }}>
                {activeActionItems.length > 0 ? (
                    <>
                        <Box sx={{ flex: 1 }}>
                            {leftItems.map((item) => (
                                <ActionCard key={item.id} item={item} onComplete={() => markComplete(item)} />
                            ))}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            {rightItems.map((item) => (
                                <ActionCard key={item.id} item={item} onComplete={() => markComplete(item)} />
                            ))}
                        </Box>
                    </>
                ) : (
                    <Typography variant="h5" sx={{ fontWeight: "bold", color: "green", marginLeft:1  }}>
                        No Pending Action Items
                    </Typography>
                )}
            </Box>

            {/* Modal Popup */}
            {showModal && <CreateActionItem isOpen={showModal} onClose={() => setShowModal(false)} onSave={addItem} />}
        </Box>
    );
};

// Reusable Action Card Component
const ActionCard = ({ item, onComplete }) => {
    return (
        <Card sx={{ mb: 2, backgroundColor: item.status === "COMPLETED" ? "#e0e0e0" : "white" }}>
            <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography
                    variant="body1"
                    sx={{
                        textDecoration: item.status === "COMPLETED" ? "line-through" : "none",
                        mr: 2,
                    }}
                >
                    {item.description}
                </Typography>
                <Button variant="contained" color="success" disabled={item.status === "COMPLETED"} onClick={onComplete}>
                    {item.status === "COMPLETED" ? "Completed" : "Mark as Complete"}
                </Button>
            </CardContent>
        </Card>
    );
};

export default ActionItems;