import React from "react";
import { Card, CardContent, Typography, Box, Button, Stack } from "@mui/material";
import { Link } from "react-router-dom"; // If using React Router
import { Divider } from "@mui/material";
const strategies = [
    {
        id: 1,
        name: "Momentum Strategy",
        assets: [
            { assetName: "AAPL", openQuantity: 10 },
            { assetName: "TSLA", openQuantity: 5 }
        ],
        currentPL: 500, // Positive (Green)
        maxPL: 1200
    },
    {
        id: 2,
        name: "Mean Reversion Strategy",
        assets: [
            { assetName: "GOOGL", openQuantity: 3 },
            { assetName: "AMZN", openQuantity: 2 }
        ],
        currentPL: -250, // Negative (Red)
        maxPL: 800
    },
    {
        id: 2,
        name: "Mean Reversion Strategy",
        assets: [
            { assetName: "GOOGL", openQuantity: 3 },
            { assetName: "AMZN", openQuantity: 2 }
        ],
        currentPL: -250, // Negative (Red)
        maxPL: 800
    },
    {
        id: 2,
        name: "Mean Reversion Strategy",
        assets: [
            { assetName: "GOOGL", openQuantity: 3 },
            { assetName: "AMZN", openQuantity: 2 }
        ],
        currentPL: -250, // Negative (Red)
        maxPL: 800
    },
    {
        id: 2,
        name: "Mean Reversion Strategy",
        assets: [
            { assetName: "GOOGL", openQuantity: 3 },
            { assetName: "AMZN", openQuantity: 2 }
        ],
        currentPL: -250, // Negative (Red)
        maxPL: 800
    },
    {
        id: 2,
        name: "Mean Reversion Strategy",
        assets: [
            { assetName: "GOOGL", openQuantity: 3 },
            { assetName: "AMZN", openQuantity: 2 }
        ],
        currentPL: -250, // Negative (Red)
        maxPL: 800
    },
    {
        id: 2,
        name: "Mean Reversion Strategy",
        assets: [
            { assetName: "GOOGL", openQuantity: 3 },
            { assetName: "AMZN", openQuantity: 2 }
        ],
        currentPL: -250, // Negative (Red)
        maxPL: 800
    },
    {
        id: 2,
        name: "Mean Reversion Strategy",
        assets: [
            { assetName: "GOOGL", openQuantity: 3 },
            { assetName: "AMZN", openQuantity: 2 }
        ],
        currentPL: -250, // Negative (Red)
        maxPL: 800
    }

];

const StrategyCards = () => {
    return (
        <Stack>
            <Divider  sx={{ borderBottomWidth: 1, borderColor: "black", marginTop: "10px" }}/>
            <Typography variant="h6" sx={{ fontWeight: "bold", textAlign: "center", marginTop: "10px" }}>
                Open Strategies
            </Typography>
            <Box
                display="flex"
                flexWrap="wrap"
                justifyContent="center"
                gap={3}
                sx={{ mt: 2 }}
            >
                {strategies.map((strategy) => (
                    <Card key={strategy.id} sx={{ width: 300, borderRadius: 3, boxShadow: 3 }}>
                        <CardContent>
                            {/* Strategy Name */}
                            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                                {strategy.name}
                            </Typography>

                            {/* Assets and Open Quantity */}
                            <Box sx={{ mt: 1, mb: 1 }}>
                                {strategy.assets.map((asset, index) => (
                                    <Typography variant="body2" key={index}>
                                        {asset.assetName}: {asset.openQuantity} units
                                    </Typography>
                                ))}
                            </Box>

                            {/* Current P/L with color formatting */}
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: "bold",
                                    color: strategy.currentPL >= 0 ? "green" : "red"
                                }}
                            >
                                Current P/L: ${strategy.currentPL}
                            </Typography>

                            {/* Maximum P/L */}
                            <Typography variant="body1" sx={{ mt: 1 }}>
                                Max P/L: ${strategy.maxPL}
                            </Typography>

                            {/* View More Button */}
                            <Button
                                component={Link}
                                to={`/strategy/${strategy.id}`} // Dynamic link
                                variant="contained"
                                color="primary"
                                sx={{ mt: 2 }}
                            >
                                View More
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </Box>
        </Stack>
    );
};

export default StrategyCards;