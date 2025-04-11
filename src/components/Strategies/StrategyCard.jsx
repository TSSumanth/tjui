import React, { useState, useEffect } from "react";
import { Card, CardContent, Typography, Box, Button, Stack, CircularProgress, Alert } from "@mui/material";
import { Link } from "react-router-dom"; // If using React Router
import { Divider } from "@mui/material";
import { getOpenStrategies } from '../../services/strategies'
import { getStockTradesbyId, getOptionTradesbyId } from '../../services/trades';

const AssetCard = ({ asset }) => (
    <Box sx={{ p: 2, bgcolor: "#ffffff", borderRadius: 2, boxShadow: 1, minWidth: 120, textAlign: "center" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
            {asset.assetName}
        </Typography>
        <Typography variant="subtitle2" color="textSecondary">
            Open Quantity: {asset.openQuantity} units
        </Typography>
        {asset.lotSize && (
            <Typography variant="subtitle2" color="textSecondary">
                Lot Size: {asset.lotSize} units
            </Typography>
        )}
        <Typography variant="subtitle2" color="textSecondary">
            Realized P/L: {asset.realizedPL}
        </Typography>
    </Box>
);

const StrategyCard = ({ strategy }) => (
    <Card sx={{ maxWidth: 400, borderRadius: 3, boxShadow: 3 }}>
        <CardContent>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                {strategy.name}
            </Typography>

            <Box sx={{ mt: 2, mb: 2, p: 1, borderRadius: 2, bgcolor: "#f5f5f5" }}>
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, textAlign: "center" }}>
                    Open Positions
                </Typography>
                <Stack spacing={2} flexWrap="wrap">
                    {strategy.assets.map((asset, index) => (
                        <AssetCard key={index} asset={asset} />
                    ))}
                </Stack>
            </Box>

            <Typography
                variant="h6"
                sx={{
                    fontWeight: "bold",
                    color: strategy.overallreturn >= 0 ? "success.main" : "error.main"
                }}
            >
                Overall Realized P/L: {strategy.overallreturn}
            </Typography>

            <Button
                component={Link}
                to={`/updatestrategy/${strategy.id}`}
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
            >
                View More
            </Button>
        </CardContent>
    </Card>
);

const StrategyCards = () => {
    const [openStrategies, setOpenStrategies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStrategies = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await getOpenStrategies();

                const strategies = await Promise.all(
                    response.map(async (element) => {
                        const [stockTrades, optionTrades] = await Promise.all([
                            Promise.all(element.stock_trades.map(getStockTradesbyId)),
                            Promise.all(element.option_trades.map(getOptionTradesbyId))
                        ]);

                        const assets = [
                            ...stockTrades
                                .filter(trade => trade.length === 1)
                                .map(trade => ({
                                    assetName: trade[0].asset,
                                    openQuantity: trade[0].openquantity,
                                    realizedPL: trade[0].overallreturn
                                })),
                            ...optionTrades
                                .filter(trade => trade.length === 1)
                                .map(trade => ({
                                    assetName: trade[0].asset,
                                    openQuantity: trade[0].openquantity,
                                    realizedPL: trade[0].overallreturn,
                                    lotSize: trade[0].lotsize
                                }))
                        ];

                        const overallreturn = assets.reduce((sum, asset) => sum + asset.realizedPL, 0);

                        return {
                            id: element.id,
                            name: element.name,
                            assets,
                            overallreturn
                        };
                    })
                );

                setOpenStrategies(strategies);
            } catch (error) {
                console.error("Error fetching strategies:", error);
                setError("Failed to fetch strategies. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchStrategies();
    }, []);

    return (
        <Stack spacing={2}>
            <Divider sx={{ borderBottomWidth: 1, borderColor: "black", my: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: "bold", textAlign: "center" }}>
                Open Strategies
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mx: 2 }}>
                    {error}
                </Alert>
            )}

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Box
                    display="flex"
                    flexWrap="wrap"
                    justifyContent="center"
                    gap={3}
                    sx={{ mt: 2 }}
                >
                    {openStrategies.length > 0 ? (
                        openStrategies.map((strategy) => (
                            <StrategyCard key={strategy.id} strategy={strategy} />
                        ))
                    ) : (
                        <Typography variant="h6" color="text.secondary" sx={{ py: 4 }}>
                            No Open Strategies Found
                        </Typography>
                    )}
                </Box>
            )}
        </Stack>
    );
};

export default StrategyCards;