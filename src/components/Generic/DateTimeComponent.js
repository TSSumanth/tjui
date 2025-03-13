import React, { useState, useEffect } from "react";
import "./DateTimeComponent.css";

const DateTimePicker = ({ value, onChange }) => {
    // Format function: yyyy/MM/dd HH:mm
    const formatDateTime = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${year}/${month}/${day} ${hours}:${minutes}`;
    };

    // Initialize with current date and time
    const getCurrentDateTime = () => {
        const now = new Date();
        return formatDateTime(now);
    };

    const [dateTime, setDateTime] = useState(value || getCurrentDateTime());

    useEffect(() => {
        if (!value) {
            onChange(getCurrentDateTime());
        }
    }, []);



    // Convert formatted value back to datetime-local format
    const toInputFormat = (dateString) => {
        return dateString.replace(/\//g, "-").replace(" ", "T");
    };

    // Handle input change
    const handleChange = (event) => {
        const rawValue = event.target.value;
        const formattedValue = formatDateTime(new Date(rawValue));
        setDateTime(formattedValue);
        onChange(formattedValue); // Pass formatted value to parent
    };

    return (
        <div className="datetime-container">
            <input
                type="datetime-local"
                value={toInputFormat(dateTime)}
                onChange={handleChange}
                className="datetime-input"
            />
        </div>
    );
};

export default DateTimePicker;