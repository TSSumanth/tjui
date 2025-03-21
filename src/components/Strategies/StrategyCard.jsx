import React, { useState, useEffect } from "react";
import { Card, CardContent, Typography, Box, Button, Stack } from "@mui/material";
import { Link } from "react-router-dom"; // If using React Router
import { Divider } from "@mui/material";
import { getOpenStrategies } from '../../services/strategies'
import { getStockTradesbyId, getOptionTradesbyId } from '../../services/trades';


const StrategyCards = () => {
    const [openStrategies, setOpenStrategies] = useState([]);

    useEffect(() => {
        const fetchStrategies = async () => {
            try {
                const response = await getOpenStrategies();
                console.log(response);

                let strategys_temp = [];

                for (const element of response) {
                    let str = {id: element.id, name: element.name, assets: [], overallreturn: 0 };

                    const stockTrades = await Promise.all(
                        element.stock_trades.map(getStockTradesbyId)
                    );
                    const optionTrades = await Promise.all(
                        element.option_trades.map(getOptionTradesbyId)
                    );
                    for (const stocktrade of stockTrades) {
                        if (stocktrade.length === 1) {
                            str.assets.push({ assetName: stocktrade[0].asset, openQuantity: stocktrade[0].openquantity, realizedPL: stocktrade[0].overallreturn });
                            str.overallreturn = str.overallreturn + stocktrade[0].overallreturn
                        }
                    }
                    for (const optiontrade of optionTrades) {
                        if (optiontrade.length === 1) {
                            str.assets.push({ assetName: optiontrade[0].asset, openQuantity: optiontrade[0].openquantity, realizedPL: optiontrade[0].overallreturn, lotSize: optiontrade[0].lotsize });
                            str.overallreturn = str.overallreturn + optiontrade[0].overallreturn
                        }
                    }
                    strategys_temp.push(str);
                }
                console.log(strategys_temp)
                // Set state once after processing all strategies
                setOpenStrategies(strategys_temp);
            } catch (error) {
                console.error("Error fetching strategies:", error);
            }
        };
        fetchStrategies();
    }, []);
    return (
        <Stack>
            <Divider sx={{ borderBottomWidth: 1, borderColor: "black", marginTop: "10px" }} />
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
                {openStrategies.map((strategy, index) => (
                    <Card key={index} sx={{ maxWidth: 400, borderRadius: 3, boxShadow: 3 }}>
                        <CardContent>
                            {/* Strategy Name */}
                            <Typography variant="h6" sx={{ fontWeight: "bold", }}>
                                {strategy.name}
                            </Typography>

                            {/* Assets and Open Quantity */}
                            <Box sx={{ mt: 2, mb: 2, p: 1, borderRadius: 2, bgcolor: "#f5f5f5" }}>
                                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, textAlign: "center" }} >
                                    Open Positions
                                </Typography>
                                <Stack spacing={2} flexWrap="wrap">
                                    {strategy.assets.map((asset, index) => (
                                        <Box key={index} sx={{ p: 2, bgcolor: "#ffffff", borderRadius: 2, boxShadow: 1, minWidth: 120, textAlign: "center" }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                                                {asset.assetName}
                                            </Typography>
                                            <Typography variant="subtitle2" color="textSecondary">
                                                Open Quantity: {asset.openQuantity} units
                                            </Typography>
                                            {asset.lotSize && <Typography variant="subtitle2" color="textSecondary">
                                                Lot Size: {asset.lotSize} units
                                            </Typography>}
                                            <Typography variant="subtitle2" color="textSecondary">
                                                Realized P/L: {asset.realizedPL}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>

                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: "bold",
                                    color: strategy.overallreturn >= 0 ? "green" : "red"
                                }}
                            >
                                Overall Realized P/L: {strategy.overallreturn}
                            </Typography>

                            {/* View More Button */}
                            <Button
                                component={Link}
                                to={`/updatestrategy/${strategy.id}`} // Dynamic link
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