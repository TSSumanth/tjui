import React, { useState, useEffect } from "react";
import './LOVComponent.css'
export default function LOVComponent({ options, label, placeholder, onSelect }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredOptions, setFilteredOptions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        // Filter options based on search input
        setFilteredOptions(
            options.filter((option) =>
                option.toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [searchTerm, options]);

    const handleSelect = (value) => {
        if (value === "") {
            value = "No Data available";
        }
        setSearchTerm(value);
        setShowDropdown(false);
        onSelect(value); // Send selected value to parent
    };

    return (
        <div className="lov-container">
            <label>{label}</label>
            <input
                type="text"
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowDropdown(true)}
            />
            {showDropdown && (
                <ul className="lov-dropdown">
                    {
                        filteredOptions.length > 0 ?
                            filteredOptions.map((option, index) => (
                                <li key={index} onClick={() => handleSelect(option)}>
                                    {option}
                                </li>
                            )) :
                            <li key={"no-data"} onClick={() => handleSelect("")}>
                                No Data available
                            </li>
                    }
                </ul>
            )}
        </div>
    );
}