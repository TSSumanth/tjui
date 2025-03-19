import React, { useState, useEffect } from 'react';
import { AlertPopup } from '../Generic/Popup'
import LovComponent from '../Generic/LOVComponent'
import './AssignTradesPopup.css';
import { getOpenStrategies, updateStrategy } from '../../services/strategies'

function AssignTradesToStrategy({ title, tradeDetails, onSubmit }) {
    const [selectedStrategy, setSelectedStrategy] = useState({});
    const [openStrategies, setOpenStrategies] = useState([]);
    const [openStrategyNames, setOpenStrategyNames] = useState([]);
    const [showCreateConfirmation, setCreateConfimation] = useState(false);
    const [showCreateFailedMessage, setShowCreateFailedMessage] = useState(false);

    useEffect(() => {
        const fetchStrategies = async () => {
            try {
                const response = await getOpenStrategies();
                setOpenStrategies(response)
                let names = [];
                response.map((element) => {
                    names.push(element.name)
                })
                setOpenStrategyNames(names);
            } catch (error) {
                console.error("Error fetching strategies:", error);
            }
        };
        fetchStrategies();
    }, []);

    // Handle strategy selection change
    const handleStrategyChange = (value) => {
        openStrategies.map((element) => {
            if (element.name === value)
                setSelectedStrategy(element);
        })
    };

    // Handle submit action
    const handleSubmit = async (event, strategy) => {
        event.preventDefault();  // Prevents form submission and page reload

        if (!strategy) {
            alert("Please select a strategy.");
            return;
        }
        // Pass selected strategy and trades to parent component
        let new_stock_trades = [];
        let new_option_trades = []
        tradeDetails.forEach((trade) => {
            if (trade.lotsize === undefined) {
                new_stock_trades.push(trade.tradeid)
            } else {
                new_option_trades.push(trade.tradeid)
            }
            return "";
        })

        let updatepayload = {
            id: strategy.id,
            name: strategy.name,
            stock_trades: Array.from(new Set([...strategy.stock_trades, ...new_stock_trades])),
            option_trades: Array.from(new Set([...strategy.option_trades, ...new_option_trades])),
            status: strategy.status
        }
        await updateStrategy(updatepayload);

        setCreateConfimation(true)
        onSubmit();
    };


    return (
        <div className="assign-strategy-card">
            {title && <div className="assign-strategy-card-header">{title}</div>}
            <div className="assign-strategy-card-body">
                <form>
                    <div className="assign-strategy-form-group">
                        <label className="label-field" name='status'>Status </label>
                        <LovComponent type="text" name="name" className="form-input" options={openStrategyNames} placeholder="Select a Status" onSelect={handleStrategyChange} />
                    </div>


                </form>
            </div>
            {tradeDetails.length > 0 && (
                <div className='trade-table-grid'>
                    <table className='trade-table'>
                        <thead>
                            <tr>
                                <th>Id</th>
                                <th>Mrarket</th>
                                <th>Asset</th>
                                <th>Open Quantity</th>
                                <th>Price</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tradeDetails.map((trade, index) => (
                                <tr className={trade.lotsize === undefined ? "buy-order" : "sell-order"} key={index}>
                                    <td>{trade.tradeid}</td>
                                    <td>{trade.lotsize === undefined ? "Stock" : "Option"}</td>
                                    <td>{trade.asset}</td>
                                    <td>{trade.openquantity}</td>
                                    <td>{trade.entryprice}</td>
                                    <td>{trade.date}</td>
                                </tr>
                            ))
                            }
                        </tbody>
                    </table>
                </div>
            )
            }
            <button id='assign-strategy-submit' type="submit" onClick={(e) => handleSubmit(e, selectedStrategy)}>Submit</button>
            <button id='assign-strategy-cancel' type="cancel" onClick={onSubmit}>Cancel</button>

            {showCreateConfirmation && <AlertPopup trigger={showCreateConfirmation} onConfirm={() => {
                setCreateConfimation(false)
                onSubmit()
            }} message="Strategy updated." />}

            {showCreateFailedMessage && <AlertPopup trigger={showCreateFailedMessage} onConfirm={() => {
                setShowCreateFailedMessage(false)
                onSubmit()
            }} message="Unable to update Strategy." />}

        </div>
    );
}

export { AssignTradesToStrategy };