import React, { useState, useEffect } from "react";
import DateComponent from './DateComponent';
import './ProfitLossModelPopup.css'
import { subDays, format } from "date-fns";
function UpdateProfitLossEntry({ isOpen, onClose, record, onSave }) {
    const [updatedRecord, setUpdatedRecord] = useState(record);

    // Update total when other fields change
    useEffect(() => {
        setUpdatedRecord((prev) => ({
            ...prev,
            stock_pl: Number(prev.stocks_realised) + Number(prev.stocks_unrealised),
            fo_pl: Number(prev.fo_realised) + Number(prev.fo_unrealised),
            total_pl: Number(prev.stocks_realised) + Number(prev.stocks_unrealised) + Number(prev.fo_realised) + Number(prev.fo_unrealised),
        }));
    }, [updatedRecord.stocks_realised, updatedRecord.stocks_unrealised, updatedRecord.fo_realised, updatedRecord.fo_unrealised]);

    const handleChange = (e) => {
        setUpdatedRecord({ ...updatedRecord, [e.target.name]: Number(e.target.value) });
    };

    const handleSave = () => {
        onSave(updatedRecord);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div >
            <section className='model-container' id='modelcontainer'>
                <section className='model' id='model'>
                    <button onClick={onClose} className='close-btn' id='close-button'>X</button>
                    <div className='model-content'>
                        <h1>Edit P/L for Date: {updatedRecord.date}</h1>
                        <form className='model-form'>
                            <div>
                                <label className="label-field" name='Date'>Report Date </label>
                                <input type="text" name="date" value={updatedRecord.date} className="form-input" disabled />
                            </div>
                            <div>
                                <label className="label-field" name='Stocks Realised'>Stocks Realized (₹) </label>
                                <input type="text" name="stocks_realised" value={updatedRecord.stocks_realised} onChange={handleChange} className="form-input" />
                            </div>
                            <div>
                                <label className="label-field" name='Stocks Unrealised'>Stocks Unrealized (₹) </label>
                                <input type="text" name="stocks_unrealised" value={updatedRecord.stocks_unrealised} onChange={handleChange} className="form-input" />
                            </div>
                            <div>
                                <h3>Total Stock P/L is: {updatedRecord.stock_pl}</h3>
                            </div>

                            <div>
                                <label className="label-field" name='F&O Realised'>F&O Realized (₹) </label>
                                <input type="text" name="fo_realised" value={updatedRecord.fo_realised} onChange={handleChange} className="form-input" />
                            </div>
                            <div>
                                <label className="label-field" name='F&O Unrealised'>F&O Unrealized (₹) </label>
                                <input type="text" name="fo_unrealised" value={updatedRecord.fo_unrealised} onChange={handleChange} className="form-input" />
                            </div>
                            <div>
                                <h3>Total F&O P/L is: {updatedRecord.fo_pl}</h3>
                            </div>
                            <div>
                                <h3>Overall P/L is: {updatedRecord.total_pl}</h3>
                            </div>
                            <button onClick={handleSave} className='submit-btn' id='submit-button'>Submit</button>
                        </form>
                    </div>
                </section>

            </section>
        </div>
    )
}

function CreateProfitLossEntry({ isOpen, onClose, onSave }) {
    const [selectedDate, setSelectedDate] = useState(null);
    // Object that we want to update when the date changes
    const [updatedRecord, setUpdatedRecord] = useState({
        "date": null,
        "stocks_realised": "",
        "stocks_unrealised": "",
        "fo_realised": "",
        "fo_unrealised": "",
        "fo_pl": "0",
        "stock_pl": "0",
        "total_pl": "0"
    });


    // Handle date change
    const handleDateChange = (date) => {
        setSelectedDate(date); // Update the state with the new date
        setUpdatedRecord((prevObject) => ({
            ...prevObject,
            "date": format(date, "yyyy-MM-dd"), // Update the object with the new date
        }));
    };

    // Update total when other fields change
    useEffect(() => {
        setUpdatedRecord((prev) => ({
            ...prev,
            stock_pl: Number(prev.stocks_realised) + Number(prev.stocks_unrealised),
            fo_pl: Number(prev.fo_realised) + Number(prev.fo_unrealised),
            total_pl: Number(prev.stocks_realised) + Number(prev.stocks_unrealised) + Number(prev.fo_realised) + Number(prev.fo_unrealised),
        }));
    }, [updatedRecord.date, updatedRecord.stocks_realised, updatedRecord.stocks_unrealised, updatedRecord.fo_realised, updatedRecord.fo_unrealised]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Allow empty string (so user can delete input) and only valid numbers
        if (value === "" || value === "-" || !isNaN(value)) {
            setUpdatedRecord((prev) => ({
                ...prev,
                [name]: value, // Keep as string while editing
            }));
        }
    };

    const handleSave = () => {
        onSave(updatedRecord);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div >
            <section className='model-container' id='modelcontainer'>
                <section className='model' id='model' onClick={(e) => {
                    // Check if the click target is outside the date picker
                    if (!e.target.closest('.date-picker')) {
                        onClose(); // Close the popup only if the click is outside the date picker
                    }
                }}>
                    <button onClick={onClose} className='close-btn' id='close-button'>X</button>
                    <div className='model-content'>
                        <h1>Add New P/L Entry</h1>
                        <form className='model-form' onClick={(e) => e.stopPropagation()}>
                            <div>
                                <label className="label-field" name='Date'>Report Date </label>
                                <DateComponent initialDate="" onDateSelect={handleDateChange} />
                            </div>
                            <div>
                                <label className="label-field" name='Stocks Realised'>Stocks Realized (₹) </label>
                                <input type="text" name="stocks_realised" value={updatedRecord.stocks_realised} onChange={handleChange} className="form-input" />
                            </div>
                            <div>
                                <label className="label-field" name='Stocks Unrealised'>Stocks Unrealized (₹) </label>
                                <input type="text" name="stocks_unrealised" value={updatedRecord.stocks_unrealised} onChange={handleChange} className="form-input" />
                            </div>
                            <div>
                                <h3>Total Stock P/L is: {updatedRecord.stock_pl}</h3>
                            </div>

                            <div>
                                <label className="label-field" name='F&O Realised'>F&O Realized (₹) </label>
                                <input type="text" name="fo_realised" value={updatedRecord.fo_realised} onChange={handleChange} className="form-input" />
                            </div>
                            <div>
                                <label className="label-field" name='F&O Unrealised'>F&O Unrealized (₹) </label>
                                <input type="text" name="fo_unrealised" value={updatedRecord.fo_unrealised} onChange={handleChange} className="form-input" />
                            </div>
                            <div>
                                <h3>Total F&O P/L is: {updatedRecord.fo_pl}</h3>
                            </div>
                            <div>
                                <h3>Overall P/L is: {updatedRecord.total_pl}</h3>
                            </div>
                            <button onClick={handleSave} className='submit-btn' id='submit-button'>Submit</button>
                        </form>
                    </div>
                </section>

            </section>
        </div>
    )
}

export { UpdateProfitLossEntry, CreateProfitLossEntry }