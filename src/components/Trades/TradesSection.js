import opentradesimage from '../../images/open_trades_image.png'
import closedtradesimage from '../..//images/closed_trades_image.png'
import losstradesimage from '../../images/Loss_Trades.png'
import profitabletradesimage from '../../images/profitable_trades.png'
import { addNewStockTrade, getStockTrades, updateStockTrade, addNewOptionTrade, getOptionTrades, updateOptionTrade } from '../../services/trades.js'
import { AlertPopup } from '../Generic/Popup.jsx'
import { CreateStrategy } from '../Strategies/CreateStrategyPopup.jsx'
import { StockTradeForm } from './StockTradeForm.jsx'
import { OptionTradeForm } from './OptionTradeForm.jsx'
import TradesTable from '../Generic/Table'
import React, { useState, useEffect } from "react";
import './TradesSection.css'

let content = [
    {
        "title": "Open Trades",
        "image": opentradesimage,
        "description": "Click here to view list of Open Trades"
    },
    {
        "title": "Closed Trades",
        "image": closedtradesimage,
        "description": "Click here to view list of Closed Trades"
    },
    {
        "title": "Loss Trades",
        "image": losstradesimage,
        "description": "Click here to view list of Loss Trades"
    },
    {
        "title": "Profitable Trades",
        "image": profitabletradesimage,
        "description": "Click here to view list of Profitable Trades"
    }
]

function TradeTypeSection() {
    const [selectedData, setSelectedData] = useState(null);
    const [selectedDataType, setSelectedDataType] = useState("All Trades");
    const [showAddNewStockTrade, setShowAddNewStockTrade] = useState(false);
    const [showAddNewOptionTrade, setShowAddNewOptionTrade] = useState(false);
    const [showCreateStrategyPopup, setShowCreateStrategyPopup] = useState(false);
    const [showUpdateStockTrade, setShowUpdateStockTrade] = useState(false);
    const [showUpdateOptionTrade, setShowUpdateOptionTrade] = useState(false);
    const [updateTradeDetails, setUpdateTradeDetails] = useState({});
    const [showTradeFailedAlertPopup, setShowTradeFailedAlertPopup] = useState(false);

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

    function TradeTypes(props) {
        return (
            <li key={props.index} onClick={() => handleClickOnCard(props.title)}>
                <img src={props.image} alt={props.title} />
                <p>{props.description}</p>
            </li>
        )
    }

    async function createNewStockTrade(tradedetails) {
        let response = await addNewStockTrade(tradedetails)
        if (response?.created) {
            setShowAddNewStockTrade(false);
        }
        else {
            setShowTradeFailedAlertPopup(true)
        }
        await handleClickOnCard(selectedDataType)
    }


    async function createNewOptionTrade(tradedetails) {
        let response = await addNewOptionTrade(tradedetails)
        if (response?.created) {
            setShowAddNewOptionTrade(false);
        }
        else {
            setShowTradeFailedAlertPopup(true)
        }
        await handleClickOnCard(selectedDataType)
    }

    async function updateCurrentOptionTrade(tradedetails) {
        let response = await updateOptionTrade(tradedetails)
        if (response?.created) {
            setShowUpdateOptionTrade(false);
        }
        else {
            setShowTradeFailedAlertPopup(true)
        }
        await handleClickOnCard(selectedDataType)
    }

    async function updateCurrentStockTrade(tradedetails) {
        let response = await updateStockTrade(tradedetails)
        if (response?.created) {
            setShowUpdateStockTrade(false);
        }
        else {
            setShowTradeFailedAlertPopup(true)
        }
        await handleClickOnCard(selectedDataType)
    }

    async function clickOnUpdateTrade(tradedetails) {
        if (tradedetails.lotsize === undefined) {
            setUpdateTradeDetails(tradedetails)
            setShowUpdateStockTrade(true)
        } else {
            setUpdateTradeDetails(tradedetails)
            setShowUpdateOptionTrade(true)
        }
    }




    return (
        <>
            <div>
                <div className="trades-section-container">
                    <h2>Trades</h2>
                    <div className="trades-section-header">
                        <button onClick={() => setShowAddNewStockTrade(true)}>Add Stock Trade</button>
                        <button onClick={() => setShowAddNewOptionTrade(true)}>Add Option Trade</button>
                        <button onClick={() => setShowCreateStrategyPopup(true)}>Create Strategy</button>
                    </div>

                    <section id='trades-section'>
                        <ul>
                            {content.map((item, index) => <TradeTypes key={index} {...item} index={index} />)}
                        </ul>
                    </section>
                </div>
                {selectedData && selectedDataType === "Open Trades" && <TradesTable data={selectedData} includeColumns={["asset", "tradetype", 'quantity', 'openquantity', 'entryprice', 'exitaverageprice', 'entrydate', 'lastmodifieddate']} columnAliases={{
                    "asset": "Asset Name",
                    "tradetype": "Trade Type",
                    "quantity": "Total Quantity",
                    "openquantity": "Open Quantity",
                    "entryprice": "Entry Price",
                    "entrydate": "Entry Date",
                    'exitaverageprice': "Exit Avg. Price",
                    "lastmodifieddate": "Last Modified Date",
                }} updateTrade={(rowdetails) => clickOnUpdateTrade(rowdetails)}
                />}

                {selectedData && selectedDataType === "Closed Trades" && <TradesTable data={selectedData} includeColumns={["asset", "tradetype", 'quantity', 'entryprice', 'entrydate', 'finalexitprice', "exitdate", "overallreturn"]} columnAliases={{
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
                }} updateTrade={(rowdetails) => clickOnUpdateTrade(rowdetails)} />}

                {selectedData && selectedDataType === "Profitable Trades" && <TradesTable data={selectedData} includeColumns={["asset", "tradetype", 'quantity', 'entryprice', 'entrydate', 'finalexitprice', "exitdate", "overallreturn", 'status']} columnAliases={{
                    "asset": "Asset Name",
                    "tradetype": "Trade Type",
                    "quantity": "Total Quantity",
                    "entryprice": "Entry Price",
                    "entrydate": "Entry Date",
                    "status": "Current Status",
                    "exitdate": "Exit Date",
                    'finalexitprice': "Exit Price",
                    "overallreturn": "Return"
                }} updateTrade={(rowdetails) => clickOnUpdateTrade(rowdetails)} />}

                {selectedData && selectedDataType === "Loss Trades" && <TradesTable data={selectedData} includeColumns={["asset", "tradetype", 'quantity', 'openquantity', 'entryprice', 'entrydate', 'finalexitprice', "exitdate", "overallreturn", 'status']} columnAliases={{
                    "asset": "Asset Name",
                    "tradetype": "Trade Type",
                    "quantity": "Total Quantity",
                    "entryprice": "Entry Price",
                    "entrydate": "Entry Date",
                    "status": "Current Status",
                    "exitdate": "Exit Date",
                    'finalexitprice': "Exit Price",
                    "overallreturn": "Return"
                }} updateTrade={(rowdetails) => clickOnUpdateTrade(rowdetails)} />}
            </div>

            {showAddNewStockTrade && <StockTradeForm title='New Stock Trade' buttonText='Submit' onSubmit={(tradedetails) => createNewStockTrade(tradedetails)} onCancel={() => setShowAddNewStockTrade(false)} />}
            {showUpdateStockTrade && <StockTradeForm title='Update Stock Trade' buttonText='Submit' onSubmit={(tradedetails) => updateCurrentStockTrade(tradedetails)} onCancel={() => setShowUpdateStockTrade(false)} isUpdate={true} currentTrade={updateTradeDetails} />}
            {showAddNewOptionTrade && <OptionTradeForm title='New Option Trade' buttonText='Submit' onSubmit={(tradedetails) => createNewOptionTrade(tradedetails)} onCancel={() => setShowAddNewOptionTrade(false)} />}
            {showUpdateOptionTrade && <OptionTradeForm title='Update Option Trade' buttonText='Submit' onSubmit={(tradedetails) => updateCurrentOptionTrade(tradedetails)} onCancel={() => setShowUpdateOptionTrade(false)} isUpdate={true} currentTrade={updateTradeDetails} />}


            {showTradeFailedAlertPopup && <AlertPopup trigger={showTradeFailedAlertPopup} onConfirm={() => setShowTradeFailedAlertPopup(false)} message="Unable to Create Trade." />}
            {showCreateStrategyPopup && <CreateStrategy title='Create Strategy' onSubmit={() => setShowCreateStrategyPopup(false)} onCancel={() => setShowCreateStrategyPopup(false)} />}
        </>
    );
}

export default TradeTypeSection;