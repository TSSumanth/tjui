import React, { useState } from "react";
import { Button, Typography, Box, Stack, Card, CardMedia, CardContent, Dialog, Divider } from "@mui/material";
import opentradesimage from "../../images/open_trades_image.png";
import closedtradesimage from "../../images/closed_trades_image.png";
import losstradesimage from "../../images/Loss_Trades.png";
import profitabletradesimage from "../../images/profitable_trades.png";
import { addNewStockTrade, getStockTrades, updateStockTrade, addNewOptionTrade, getOptionTrades, updateOptionTrade } from "../../services/trades.js";
import { AlertPopup } from "../Generic/Popup.jsx";
import { CreateStrategy } from "../Strategies/CreateStrategyPopup.jsx";
import { StockTradeForm } from "./StockTradeForm.jsx";
import OptionTradeForm from "./OptionTradeForm.jsx";
// import TradesTable from "../Generic/Table";
import TradesTable from "./TradesTable";
import { Bolt } from "@mui/icons-material";

const tradeOptions = [
    { title: "Open Trades", image: opentradesimage, status: "OPEN" },
    { title: "Closed Trades", image: closedtradesimage, status: "CLOSED" },
    { title: "Loss Trades", image: losstradesimage, filter: { maximumreturn: 0, status: "CLOSED" } },
    { title: "Profitable Trades", image: profitabletradesimage, filter: { minimumreturn: 0, status: "CLOSED" } },
];

function TradeTypeSection() {
    const [selectedData, setSelectedData] = useState([]);
    const [selectedDataType, setSelectedDataType] = useState("All Trades");
    const [showStockTradeForm, setShowStockTradeForm] = useState(false);
    const [showOptionTradeForm, setShowOptionTradeForm] = useState(false);
    const [showCreateStrategyPopup, setShowCreateStrategyPopup] = useState(false);
    const [updateTradeDetails, setUpdateTradeDetails] = useState(null);
    const [showTradeFailedAlertPopup, setShowTradeFailedAlertPopup] = useState(false);

    const fetchTrades = async (filter) => {
        const stockTrades = await getStockTrades(filter);
        const optionTrades = await getOptionTrades(filter);
        setSelectedData([...stockTrades, ...optionTrades]);
    };


    async function getTableDate(filterObject) {
        let stockresponse = await getStockTrades(filterObject)
        let optionresponse = await getOptionTrades(filterObject)
        setSelectedData([...stockresponse, ...optionresponse])
    }

    async function handleClickOnCard(props) {
        setSelectedDataType(props)
        if (props === "Open Trades") {
            await getTableDate({ status: "OPEN" })
        }
        else if (props === "Closed Trades") {
            await getTableDate({ status: "CLOSED" })
        }
        else if (props === "Profitable Trades") {
            await getTableDate({ minimumreturn: 0, status: "CLOSED" })
        } else if (props === "Loss Trades") {
            await getTableDate({ maximumreturn: 0, status: "CLOSED" })
        }
    }
    const handleTradeTypeClick = async (tradeType) => {
        setSelectedDataType(tradeType.title);
        if (tradeType.filter) {
            await fetchTrades(tradeType.filter);
        } else {
            await fetchTrades({ status: tradeType.status });
        }
    };

    async function clickOnUpdateTrade(tradedetails) {
        if (tradedetails.lotsize === undefined) {
            setUpdateTradeDetails(tradedetails)
        } else {
            setUpdateTradeDetails(tradedetails)
        }
    }

    const handleSubmitTrade = async (tradeDetails, isStock, isUpdate = false) => {
        const tradeFunction = isStock ? (isUpdate ? updateStockTrade : addNewStockTrade) : (isUpdate ? updateOptionTrade : addNewOptionTrade);
        const response = await tradeFunction(tradeDetails);
        if (response?.created) {
            if (isUpdate) {
                setUpdateTradeDetails(null);
            } else {
                setShowStockTradeForm(false);
                setShowOptionTradeForm(false);
            }
        } else {
            setShowTradeFailedAlertPopup(true);
        }
        await fetchTrades(selectedDataType);
    };

    return (
        <Box p={3}>
            <Stack direction="row" spacing={2} mb={3}>
                <Button variant="contained" color="primary" onClick={() => setShowStockTradeForm(true)}>Add Stock Trade</Button>
                <Button variant="contained" color="secondary" onClick={() => setShowOptionTradeForm(true)}>Add Option Trade</Button>
                <Button variant="contained" onClick={() => setShowCreateStrategyPopup(true)}>Create Strategy</Button>
            </Stack>
            <Divider sx={{ borderBottomWidth: 1, borderColor: "black", marginBottom: "10px" }} />
            <Stack direction="row" spacing={2} flexWrap="wrap" mb={3}>
                {tradeOptions.map((option, index) => (
                    <Card key={index} onClick={() => handleTradeTypeClick(option)} sx={{ cursor: "pointer", width: 200, height: 220 }}>
                        <CardMedia component="img" height="170" image={option.image} alt={option.title} />
                        <CardContent>
                            <Typography variant="h6" align="center">{option.title}</Typography>
                        </CardContent>
                    </Card>
                ))}
            </Stack>
            {/* <Divider sx={{ borderBottomWidth: 1, borderColor: "black", margin: "10px" }} /> */}
            <Stack sx={{ marginTop: 2 }}>
                {selectedData && selectedDataType === "Open Trades" && (selectedData.length > 0 ? <TradesTable data={selectedData} includeColumns={["asset", "tradetype", 'quantity', 'openquantity', 'entryprice', 'exitaverageprice', 'entrydate', 'lastmodifieddate']} columnAliases={{
                    "asset": "Asset Name",
                    "tradetype": "Trade Type",
                    "quantity": "Total Quantity",
                    "openquantity": "Open Quantity",
                    "entryprice": "Entry Price",
                    "entrydate": "Entry Date",
                    'exitaverageprice': "Exit Avg. Price",
                    "lastmodifieddate": "Last Modified Date",
                }} updateTrade={(rowdetails) => clickOnUpdateTrade(rowdetails)}
                /> : <Typography>No Trades available for selection "Open Trades".</Typography>)}

                {selectedData && selectedDataType === "Closed Trades" && (selectedData.length > 0 ? <TradesTable data={selectedData} includeColumns={["asset", "tradetype", 'quantity', 'entryprice', 'entrydate', 'finalexitprice', "exitdate", "overallreturn"]} columnAliases={{
                    "asset": "Asset Name",
                    "tradetype": "Trade Type",
                    "quantity": "Total Quantity",
                    "openquantity": "Open Quantity",
                    "entryprice": "Entry Price",
                    "entrydate": "Entry Date",
                    "status": "Current Status",
                    "exitdate": "Exit Date",
                    'finalexitprice': "Exit Price",
                    "overallreturn": "Return"
                }} updateTrade={(rowdetails) => clickOnUpdateTrade(rowdetails)} /> : <Typography>No Trades available for selection "Closed Trades".</Typography>)}

                {selectedData && selectedDataType === "Profitable Trades" && (selectedData.length > 0 ? <TradesTable data={selectedData} includeColumns={["asset", "tradetype", 'quantity', 'entryprice', 'entrydate', 'finalexitprice', "exitdate", "overallreturn", 'status']} columnAliases={{
                    "asset": "Asset Name",
                    "tradetype": "Trade Type",
                    "quantity": "Total Quantity",
                    "entryprice": "Entry Price",
                    "entrydate": "Entry Date",
                    "status": "Current Status",
                    "exitdate": "Exit Date",
                    'finalexitprice': "Exit Price",
                    "overallreturn": "Return"
                }} updateTrade={(rowdetails) => clickOnUpdateTrade(rowdetails)} /> : <Typography>No Trades available for selection Profitable Trades.</Typography>)}

                {selectedData && selectedDataType === "Loss Trades" && (selectedData.length > 0 ? <TradesTable data={selectedData} includeColumns={["asset", "tradetype", 'quantity', 'openquantity', 'entryprice', 'entrydate', 'finalexitprice', "exitdate", "overallreturn", 'status']} columnAliases={{
                    "asset": "Asset Name",
                    "tradetype": "Trade Type",
                    "quantity": "Total Quantity",
                    "entryprice": "Entry Price",
                    "entrydate": "Entry Date",
                    "status": "Current Status",
                    "exitdate": "Exit Date",
                    'finalexitprice': "Exit Price",
                    "overallreturn": "Return"
                }} updateTrade={(rowdetails) => clickOnUpdateTrade(rowdetails)} /> : <Typography>No Trades available for selection "Loss Trades".</Typography>)}
            </Stack>
            <Dialog open={!!showStockTradeForm} onClose={() => setShowStockTradeForm(false)}>
                <StockTradeForm title='New Stock Trade' buttonText='Submit' onSubmit={(details) => handleSubmitTrade(details, true)} onCancel={() => setShowStockTradeForm(false)} />
            </Dialog>

            <Dialog open={!!showOptionTradeForm} onClose={() => setShowOptionTradeForm(false)}>
                <OptionTradeForm title='New Option Trade' buttonText='Submit' onSubmit={(details) => handleSubmitTrade(details, false)} onCancel={() => setShowOptionTradeForm(false)} />
            </Dialog>

            <Dialog open={!!updateTradeDetails} onClose={() => setUpdateTradeDetails(null)}>
                {updateTradeDetails?.lotsize === undefined ? (
                    <StockTradeForm title='Update Stock Trade' buttonText='Submit' onSubmit={(details) => handleSubmitTrade(details, true, true)} onCancel={() => setUpdateTradeDetails(null)} isUpdate currentTrade={updateTradeDetails} />
                ) : (
                    <OptionTradeForm title='Update Option Trade' buttonText='Submit' onSubmit={(details) => handleSubmitTrade(details, false, true)} onCancel={() => setUpdateTradeDetails(null)} isUpdate currentTrade={updateTradeDetails} />
                )}
            </Dialog>

            {showTradeFailedAlertPopup && <AlertPopup trigger={showTradeFailedAlertPopup} onConfirm={() => setShowTradeFailedAlertPopup(false)} message="Unable to Create Trade." />}
            {showCreateStrategyPopup && <CreateStrategy title='Create Strategy' onSubmit={() => setShowCreateStrategyPopup(false)} onCancel={() => setShowCreateStrategyPopup(false)} />}
        </Box>
    );
}

export default TradeTypeSection;