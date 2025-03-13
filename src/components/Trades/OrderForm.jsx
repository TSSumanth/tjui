import React, { useState } from 'react';
import DateTimePicker from '../Generic/DateTimeComponent'
import './OrderForm.css';

function OrderForm({ title, onSubmit, onCancel, updateOrderdetails }) {
    const [orderDetails, setTradeDetails] = useState(updateOrderdetails || {
        ordertype: "Buy",
        quantity: "",
        price: "",
        date: "",
        notes: "",
        tags: ""
    });

    const handleDateTimeChange = (newDateTime) => {
        setTradeDetails((prevData) => ({
            ...prevData,
            date: newDateTime
        }));
    };

    function handleChange(event) {
        const { name, value } = event.target;
        setTradeDetails((prevData) => ({
            ...prevData,
            [name]: value
        }));
    }


    const handleOnSubmit = (e) => {
        e.preventDefault();
        console.log("orderpopup: " + orderDetails)
        onSubmit(orderDetails)
    }

    return (
        <div className="card">
            {title && <div className="card-header">{title}</div>}
            <div className="card-body">
                <form>
                    <div className="form-group">
                        <label htmlFor="dropdownField">Order Type:</label>
                        <select id="dropdownField" name="ordertype" value={orderDetails.ordertype} onChange={handleChange}>
                            <option value="Buy">Buy</option>
                            <option value="Sell">Sell</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="inputField">Quantity:</label>
                        <input type="number" id="inputField" name="quantity" value={orderDetails.quantity} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="inputField">Price:</label>
                        <input type="number" id="inputField" name="price" value={orderDetails.price} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="textareaField">Date & Time:</label>
                        <DateTimePicker id="datetimepicker" name="date" onChange={handleDateTimeChange}></DateTimePicker>
                    </div>
                    <div className="form-group">
                        <label htmlFor="textareaField">Notes:</label>
                        <textarea id="textareaField" name="notes" value={orderDetails.notes} onChange={handleChange}></textarea>
                    </div>
                    <div className="form-group">
                        <label htmlFor="textareaField">Tags:</label>
                        <input id="textareaField" name="tags" value={orderDetails.tags} onChange={handleChange}></input>
                    </div>
                    <button id='submit' type="submit" onClick={handleOnSubmit}>Submit</button>
                    <button id='cancel' type="cancel" onClick={onCancel}>Cancel</button>
                </form>
            </div>
        </div>
    );
}

export { OrderForm };