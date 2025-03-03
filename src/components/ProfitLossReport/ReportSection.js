import opentradesimage from '../../images/open_trades_image.png'
import closedtradesimage from '../..//images/closed_trades_image.png'
import losstradesimage from '../../images/Loss_Trades.png'
import profitabletradesimage from '../../images/profitable_trades.png'
import TradesTable from '../Generic/Table'
import React, { useState } from "react";
import { Outlet, Link } from "react-router-dom";
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

const tradeData1 = [
    { id: 1, stockprofit: 1000, stockloss: 2000, overallstockpl: -1000},
    { id: 2, stockprofit: 5000, stockloss: 2000, overallstockpl: 3000 },
    { id: 3, stockprofit: 1000, stockloss: 6000, overallstockpl: -5000}
];

const tradeData2 = [
    { id: 1, optionprofit: 1000, optionloss: 2000, overalloptionpl: -1000},
    { id: 2, optionprofit: 5000, optionloss: 2000, overalloptionpl: 3000 },
    { id: 3, optionprofit: 1000, optionloss: 6000, overalloptionpl: -5000}
];


function ReportSection() {
    const [selectedData, setSelectedData] = useState(null);

    function handleClickOnCard(props) {
        console.log(props)
        if (props === "Open Trades")
            setSelectedData(tradeData1)
        else if (props === "Closed Trades")
            setSelectedData(tradeData2)
        else
            setSelectedData(null)
    }


    function TradeTypes(props) {
        return (
            <li onClick={() => handleClickOnCard(props.title)}>
                <img src={props.image} alt={props.title} />
                <p>{props.description}</p>
            </li>
        )
    }

    return (
        <div>
            <div className="profit-loss-report-container">
                <section id='profit-loss-report-section'>
                    <h2>Last Month Report</h2>
                    <ul>
                        {content.map((item) => <TradeTypes {...item} />)}
                    </ul>
                </section>
            </div>
            {selectedData && <TradesTable data={selectedData} />}
        </div>
    );
}

export default ReportSection;