import React, { useState, useEffect } from "react";
import './LOVComponent.css'
export default function LOVComponent({ options, label, placeholder, onSelect }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredOptions, setFilteredOptions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedValue, setSelectedValue] = useState("");

    useEffect(() => {
        // Filter options based on search input
        setFilteredOptions(
            options.filter((option) =>
                option.toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [searchTerm, options]);

    const handleSelect = (value) => {
        setSelectedValue(value);
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
            {showDropdown && filteredOptions.length > 0 && (
                <ul className="lov-dropdown">
                    {filteredOptions.map((option, index) => (
                        <li key={index} onClick={() => handleSelect(option)}>
                            {option}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}