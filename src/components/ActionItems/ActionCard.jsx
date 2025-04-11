import React from "react";
import { Card, CardContent, Typography, Button } from "@mui/material";

const ActionCard = ({ item, onComplete }) => {
    const isCompleted = item.status === "COMPLETED";

    return (
        <Card
            sx={{
                mb: 2,
                backgroundColor: isCompleted ? "#e0e0e0" : "white",
                transition: "background-color 0.3s ease"
            }}
        >
            <CardContent
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 2
                }}
            >
                <Typography
                    variant="body1"
                    sx={{
                        textDecoration: isCompleted ? "line-through" : "none",
                        mr: 2,
                        flex: 1,
                        color: isCompleted ? "text.secondary" : "text.primary"
                    }}
                >
                    {item.description}
                </Typography>
                <Button
                    variant="contained"
                    color="success"
                    disabled={isCompleted}
                    onClick={onComplete}
                    sx={{ minWidth: 150 }}
                >
                    {isCompleted ? "Completed" : "Mark as Complete"}
                </Button>
            </CardContent>
        </Card>
    );
};

export default ActionCard; 