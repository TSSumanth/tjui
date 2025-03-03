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
    { id: 1, name: "Alice", age: 25, city: "New York" },
    { id: 2, name: "Bob", age: 30, city: "Los Angeles" },
    { id: 3, name: "Charlie", age: 22, city: "Chicago" }
];

const tradeData2 = [
    { id: 4, name: "Alice", age: 25, city: "New York" },
    { id: 5, name: "Bob", age: 30, city: "Los Angeles" },
    { id: 6, name: "Charlie", age: 22, city: "Chicago" }
];

const tradeData3 = [
    { id: 1, name: "Alice", age: 25, city: "New York" },
    { id: 5, name: "Bob", age: 30, city: "Los Angeles" },
    { id: 6, name: "Charlie", age: 22, city: "Chicago" }
];

const tradeData4 = [
    { id: 2, name: "Alice", age: 25, city: "New York" },
    { id: 3, name: "Bob", age: 30, city: "Los Angeles" },
    { id: 4, name: "Charlie", age: 22, city: "Chicago" }
];


function TradeTypeSection() {
    const [selectedData, setSelectedData] = useState(null);

    function handleClickOnCard(props) {
        console.log(props)
        if (props === "Open Trades")
            setSelectedData(tradeData1)
        else if (props === "Closed Trades")
            setSelectedData(tradeData2)
        else if (props === "Profitable Trades")
            setSelectedData(tradeData3)
        else if (props === "Loss Trades")
            setSelectedData(tradeData4)
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
            <div className="container">
                <section id='trades-section'>
                    <h2>Trades</h2>
                    <ul>
                        {content.map((item) => <TradeTypes {...item} />)}
                    </ul>
                </section>
            </div>
            {selectedData && <TradesTable data={selectedData} />}
        </div>
    );
}

export default TradeTypeSection;