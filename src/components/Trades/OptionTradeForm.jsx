import React, { useState, useEffect } from 'react';
import './TradeForm.css';
import { format, parseISO } from "date-fns";
import { v4 as uuidv4 } from 'uuid';
import { OrderForm } from './OrderForm.jsx'
import { addOptionOrder, getTradeOptionOrders, updateOptionOrder, deleteAllTradeOptionOrders, deleteTradeOptionOrder } from '../../services/orders.js'
import { deleteOptionTrade } from '../../services/trades.js'
import { AlertPopup, ConfirmPopup } from '../Generic/Popup.jsx'
const getCurrentDateTime = () => {
    let date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}/${month}/${day} ${hours}:${minutes}`;
};
function OptionTradeForm({ title, onSubmit, onCancel, isUpdate = false, currentTrade }) {
    const [showAddNewOrder, setShowAddNewOrder] = useState(false);
    const [showUpdateOrder, setShowUpdateOrder] = useState(false);
    const [newTradeId, setNewTradeId] = useState(uuidv4());
    const [activeTab, setActiveTab] = useState("trade");
    const [showOrderFailedAlertPopup, setShowOrderFailedAlertPopup] = useState(false);
    const [showTradeFailedAlertPopup, setShowTradeFailedAlertPopup] = useState(false);
    const [showOrderDeleteConfirmPopup, setShowOrderDeleteConfirmPopup] = useState(false);
    const [showTradeDeleteConfirmPopup, setShowTradeDeleteConfirmPopup] = useState(false);
    const [allorders, setallOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [tradeDetails, setTradeDetails] = useState(currentTrade || {
        tradeid: "",
        asset: "",
        lotsize: "",
        premiumamount: 0,
        tradetype: "Long",
        quantity: 0,
        entryprice: 0,
        capitalused: 0,
        entrydate: "",
        openquantity: 0,
        closedquantity: 0,
        exitaverageprice: 0,
        finalexitprice: "",
        status: "",
        overallreturn: "",
        exitdate: "",
        lastmodifieddate: "",
        notes: "",
        tags: ""
    });

    async function fetchOrders(tradeid) {
        let response = await getTradeOptionOrders(tradeid)
        setallOrders(response)
    }


    useEffect(() => {
        if (isUpdate)
            fetchOrders(tradeDetails.tradeid);
    }, [isUpdate, tradeDetails.tradeid]);

    // Update total when other fields change
    useEffect(() => {
        updateOptionTradeDetails()
    }, [allorders]);


    function updateOptionTradeDetails() {
        if (!allorders.length > 0)
            return;
        let entryorderquantity = 0;
        let exitorderquantity = 0;
        let entryavgprice = 0;
        let exitavgprice = 0;
        allorders.map((order) => {
            if (tradeDetails.tradetype.toUpperCase() === "LONG" && order.ordertype.toUpperCase() === "BUY") {
                let newentryquantity = entryorderquantity + Number(order.quantity);
                let newentryavgprice = ((entryavgprice * entryorderquantity) + (Number(order.quantity) * Number(order.price))) / (entryorderquantity + Number(order.quantity))
                entryavgprice = newentryavgprice
                entryorderquantity = newentryquantity
            } else if (tradeDetails.tradetype.toUpperCase() === "LONG" && order.ordertype.toUpperCase() === "SELL") {
                let newexitavgquantity = exitorderquantity + Number(order.quantity);
                let newexitavgprice = ((exitavgprice * exitorderquantity) + (Number(order.quantity) * Number(order.price))) / (exitorderquantity + Number(order.quantity))
                exitavgprice = newexitavgprice
                exitorderquantity = newexitavgquantity
                console.log(exitavgprice, exitorderquantity, order.quantity, order.price)
            }
            else if (tradeDetails.tradetype.toUpperCase() === "SHORT" && order.ordertype.toUpperCase() === "BUY") {
                let newexitavgquantity = exitorderquantity + Number(order.quantity);
                let newexitavgprice = ((exitavgprice * exitorderquantity) + (Number(order.quantity) * Number(order.price))) / (exitorderquantity + Number(order.quantity))
                exitavgprice = newexitavgprice
                exitorderquantity = newexitavgquantity
                console.log(exitavgprice, exitorderquantity, order.quantity, order.price)
            }
            else if (tradeDetails.tradetype.toUpperCase() === "SHORT" && order.ordertype.toUpperCase() === "SELL") {
                let newentryquantity = entryorderquantity + Number(order.quantity);
                let newentryavgprice = ((entryavgprice * entryorderquantity) + (Number(order.quantity) * Number(order.price))) / (entryorderquantity + Number(order.quantity))
                entryavgprice = newentryavgprice
                entryorderquantity = newentryquantity
            }
        })
        setTradeDetails((prevDetails) => ({
            ...prevDetails,
            quantity: entryorderquantity * Number(tradeDetails.lotsize),
            openquantity: (entryorderquantity - exitorderquantity) * Number(tradeDetails.lotsize),
            closedquantity: exitorderquantity * Number(tradeDetails.lotsize),
            entryprice: entryavgprice,
            exitaverageprice: exitavgprice,
            "status": (entryorderquantity - exitorderquantity === 0) ? "CLOSED" : "OPEN",
            entrydate: allorders[0].date,
            finalexitprice: (entryorderquantity - exitorderquantity === 0) ? exitavgprice : 0,
            capitalused: (entryorderquantity - exitorderquantity !== 0) ? ((entryorderquantity * entryavgprice) * Number(tradeDetails.lotsize)) - ((exitorderquantity * exitavgprice) * Number(tradeDetails.lotsize)) : 0,
            overallreturn: (entryorderquantity - exitorderquantity === 0) ? (tradeDetails.tradetype.toUpperCase() === "LONG" ? ((exitorderquantity * exitavgprice) - (entryorderquantity * entryavgprice)) * Number(tradeDetails.lotsize) : ((entryorderquantity * entryavgprice) - (exitorderquantity * exitavgprice)) * Number(tradeDetails.lotsize)) : 0,
            exitdate: (entryorderquantity - exitorderquantity === 0) ? allorders[allorders.length - 1].date : 0,
            lastmodifieddate: getCurrentDateTime(),
            premiumamount: (entryorderquantity * entryavgprice) * Number(tradeDetails.lotsize)
        }));
        console.log(tradeDetails)
    }

    async function createNewOrder(orderdetails) {
        if (isUpdate) {
            orderdetails.tradeid = tradeDetails.tradeid;
        } else
            orderdetails.tradeid = newTradeId;

        orderdetails.lotsize = tradeDetails.lotsize
        orderdetails.asset = tradeDetails.asset;
        let response = await addOptionOrder(orderdetails)
        if (response?.created) {
            setShowAddNewOrder(false);
            console.log("Order Created: ", response)
            await fetchOrders(orderdetails.tradeid);
            updateOptionTradeDetails()
        }
        else {
            setShowOrderFailedAlertPopup(true)
        }
    }

    async function updateOrder(order) {
        let response = await updateOptionOrder(order)
        if (response) {
            await fetchOrders(tradeDetails.tradeid);
            setShowUpdateOrder(false);
        }
    }

    const handleOrderEditClick = async (order) => {
        setSelectedOrder(order);
        setShowUpdateOrder(true)
    }

    const handleOrderDeleteClick = async (order) => {
        setSelectedOrder(order);
        setShowOrderDeleteConfirmPopup(true)
    }

    async function deleteOrder(e) {
        let response = await deleteTradeOptionOrder (e.id)
        if (response === true) {
            await fetchOrders(tradeDetails.tradeid);
            setShowOrderDeleteConfirmPopup(false)
            setSelectedOrder(null);
        } else {
            alert("Unable to delete order " + e.asset)
        }
    }


    const handleTextChange = (e) => {
        const { name, value } = e.target;
        // Allow empty string (so user can delete input) and only valid numbers
        if (value !== "") {
            setTradeDetails((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };


    const handleOnSubmit = (e) => {
        e.preventDefault();
        if (!isUpdate)
            onSubmit({
                ...tradeDetails,
                tradeid: newTradeId,
            })
        else {
            onSubmit(tradeDetails);
        }
    }

    const handleOnDelete = (e) => {
        e.preventDefault();
        setShowTradeDeleteConfirmPopup(true)
    }

    async function deleteCompleteTrade() {
        let response = await deleteAllTradeOptionOrders(tradeDetails.tradeid)
        if (response) {
            let response1 = await deleteOptionTrade(tradeDetails.tradeid)
            if (response1) {
                setShowTradeDeleteConfirmPopup(false)
                onCancel()
            } else {
                setShowTradeDeleteConfirmPopup(false)
                setShowTradeFailedAlertPopup(true)
            }
        } else {
            setShowTradeDeleteConfirmPopup(false)
            setShowTradeFailedAlertPopup(true)
        }
    }


    return (
        <>
            <div className="card">
                {title && <div className="card-header">{title}</div>}
                <div className="card-body">
                    <div className="tabs">
                        <button
                            className={activeTab === "trade" ? "active" : ""}
                            onClick={() => setActiveTab("trade")}
                        >
                            Trade Details
                        </button>
                        <button
                            className={activeTab === "orders" ? "active" : ""}
                            onClick={() => setActiveTab("orders")}
                        >
                            Orders
                        </button>
                        <button
                            className={activeTab === "notes" ? "active" : ""}
                            onClick={() => setActiveTab("notes")}
                        >
                            Trade Notes
                        </button>
                    </div>
                    <div className="tab-content">
                        {activeTab === "trade" && (
                            <form>
                                <section className='form-top-section'>
                                    <div className="form-group">
                                        <label htmlFor="inputField">Asset:</label>
                                        <input type="text" id="inputField" name="asset" value={tradeDetails.asset} onChange={handleTextChange} />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="inputField">Lot Size:</label>
                                        <input type="text" id="inputField" name="lotsize" value={tradeDetails.lotsize} onChange={handleTextChange} />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="dropdownField">Trade Type:</label>
                                        <select id="dropdownField" name="tradetype" value={tradeDetails.tradetype} onChange={handleTextChange}>
                                            <option value="Long">Long</option>
                                            <option value="Short">Short</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="inputfield">Total Quanity:</label>
                                        <input className="form-group-disabled" id="inputField" name="quantity" type="text" value={tradeDetails.quantity} disabled></input>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="inputfield">Entry Average Price:</label>
                                        <input className="form-group-disabled" id="inputField" name="entryprice" type="text" value={tradeDetails.entryprice} disabled></input>
                                    </div>
                                </section>
                                <section className='form-middle-section'>
                                    <div className="form-group">
                                        <label htmlFor="inputField">Entry Date:</label>
                                        <input className="form-group-disabled" type="text" id="inputField" name="entrydate" value={tradeDetails.entrydate} onChange={handleTextChange} disabled />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="inputField">Open Quantity:</label>
                                        <input className="form-group-disabled" type="text" id="inputField" name="openquantity" value={tradeDetails.openquantity} onChange={handleTextChange} disabled />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="inputField">Closed Quantity:</label>
                                        <input className="form-group-disabled" type="text" id="inputField" name="closedquantity" value={tradeDetails.closedquantity} onChange={handleTextChange} disabled />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="inputField">Exit Average Price:</label>
                                        <input className="form-group-disabled" type="text" id="inputField" name="exitaverageprice" value={tradeDetails.exitaverageprice} onChange={handleTextChange} disabled />
                                    </div>
                                </section>
                                <section className='form-bottom-section'>
                                    <div className="form-group">
                                        <label htmlFor="inputfield">Capital Used:</label>
                                        <input className="form-group-disabled" id="inputField" name="capitalused" type="text" value={tradeDetails.capitalused} disabled></input>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="inputfield">Premium Paid:</label>
                                        <input className="form-group-disabled" id="inputField" name="premiumamount" type="text" value={tradeDetails.premiumamount} disabled></input>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="textareaField">Overall Return:</label>
                                        <input className="form-group-disabled" id="inputField" name="overallreturn" type="text" value={tradeDetails.overallreturn} disabled></input>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="textareaField">Status:</label>
                                        <input className="form-group-disabled" id="inputField" name="status" type="text" value={tradeDetails.status} disabled></input>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="textareaField">Tags:</label>
                                        <input id="textareaField" name="tags" value={tradeDetails.tags} onChange={handleTextChange}></input>
                                    </div>
                                </section>
                            </form>
                        )}
                        {activeTab === "notes" && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="textareaField">Notes:</label>
                                    <textarea id="textareaField" name="textareaField" onChange={handleTextChange}></textarea>
                                </div>
                            </>
                        )}
                        {activeTab === "orders" && (
                            <>
                                <button id='add-order' type="button" onClick={setShowAddNewOrder}>Add Order</button>
                                <div className='orders-table-grid'>
                                    <table className='orders-table'>
                                        <thead>
                                            <tr>
                                                <th>Id</th>
                                                <th>Type</th>
                                                <th>Quantity</th>
                                                <th>Price</th>
                                                <th>Date</th>
                                                <th>Notes</th>
                                                <th>Tags</th>
                                                <th>Update</th>
                                                <th>Delete</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allorders.map((order, index) => (
                                                <tr className={order?.ordertype?.toUpperCase() === "BUY" ? "buy-order" : "sell-order"} key={index}>
                                                    <td>{order.id}</td>
                                                    <td>{order.ordertype}</td>
                                                    <td>{order.quantity}</td>
                                                    <td>{order.price}</td>
                                                    <td>{order.date}</td>
                                                    <td className="notes">{order.notes}</td>
                                                    <td className="tags">{order.tags}</td>
                                                    <td>
                                                        <button onClick={() => handleOrderEditClick(order)}>Edit</button>
                                                    </td>
                                                    <td>
                                                        <button onClick={() => handleOrderDeleteClick(order)}>Delete</button>
                                                    </td>
                                                </tr>
                                            ))
                                            }
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )
                        }
                    </div>
                </div>

                <div className='form-footer'>
                    <button id='submit-trade' type="submit" onClick={handleOnSubmit}>Submit</button>
                    <button id='cancel-trade' type="cancel" onClick={onCancel}>Cancel</button>
                    {isUpdate && <button id='delete-trade' type="submit" onClick={handleOnDelete}>Delete Trade</button>}
                </div>
                {showAddNewOrder && <OrderForm title='New Option Order' buttonText='Submit' onSubmit={(orderdetails) => createNewOrder(orderdetails)} onCancel={() => setShowAddNewOrder(false)} />}
                {showUpdateOrder && <OrderForm title='Update Option Order' buttonText='Submit' onSubmit={(orderdetails) => updateOrder(orderdetails)} onCancel={() => setShowUpdateOrder(false)} updateOrderdetails={selectedOrder} />}
            </div >
            {showOrderFailedAlertPopup && (
                <AlertPopup trigger={showOrderFailedAlertPopup} onConfirm={() => setShowOrderFailedAlertPopup(false)} message="Unable to Create Order." />
            )}
            {showTradeFailedAlertPopup && (
                <AlertPopup trigger={showTradeFailedAlertPopup} onConfirm={() => setShowTradeFailedAlertPopup(false)} message="Unable to Delete Order." />
            )}

            {showOrderDeleteConfirmPopup && (
                <ConfirmPopup trigger={showOrderDeleteConfirmPopup} onConfirm={() => deleteOrder(selectedOrder)} onCancel={() => setShowOrderDeleteConfirmPopup(false)} message="Do you wish to delete Order." />
            )}
            {showTradeDeleteConfirmPopup && (
                <ConfirmPopup trigger={showTradeDeleteConfirmPopup} onConfirm={() => deleteCompleteTrade()} onCancel={() => setShowTradeDeleteConfirmPopup(false)} message="Do you wish to delete the trade and associated orders ?." />
            )}
        </>
    );
}

export { OptionTradeForm };