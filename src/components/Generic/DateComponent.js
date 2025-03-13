import React, { useState, useRef, useEffect } from 'react';
import { format, getDaysInMonth, startOfMonth, getDay, addMonths, subMonths, getYear, getMonth, parseISO, isValid } from 'date-fns';
import './DateComponent.css'; // Create a CSS file for styling

const DateComponent = ({ initialDate, onDateSelect }) => {
    const [selectedDate, setSelectedDate] = useState(initialDate || new Date());
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
    const inputRef = useRef(null);
    const pickerRef = useRef(null);

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setIsPickerOpen(false);
        if (onDateSelect) { // Call onDateSelect if it exists
            onDateSelect(date);
        }
    };

    const togglePicker = () => {
        setIsPickerOpen(!isPickerOpen);
    };

    const nextMonth = (event) => {
        // we need the below two method executions to handle next button click when date picker is inside a popup, 
        // if these two lines are not added the date picker and the popup will be closed automatically

        event.preventDefault(); // Prevent default behavior
        event.stopPropagation();    // Prevent event bubbling
        setCurrentMonth(addMonths(currentMonth, 1));
    };

    const prevMonth = (event) => {
        event.preventDefault(); // Prevent default behavior
        event.stopPropagation();    // Prevent event bubbling
        setCurrentMonth(subMonths(currentMonth, 1));
    };

    const generateDays = () => {
        const daysInMonthCount = getDaysInMonth(currentMonth);
        const startDay = getDay(startOfMonth(currentMonth));
        const days = [];

        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="empty-day"></div>);
        }

        for (let i = 1; i <= daysInMonthCount; i++) {
            const date = new Date(getYear(currentMonth), getMonth(currentMonth), i);
            const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
            days.push(
                <div
                    key={`day-${i}`}
                    className={`day ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleDateSelect(date)}
                >
                    {i}
                </div>
            );
        }
        return days;
    };

    const clearDate = () => {
        setSelectedDate(null);
        setIsPickerOpen(false);
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (pickerRef.current && !pickerRef.current.contains(event.target) && inputRef.current && !inputRef.current.contains(event.target)) {
                setIsPickerOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [pickerRef, inputRef]);

    return (
        <div className="date-component">
            <div className="input-container">
                <input
                    type="text"
                    value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                    readOnly
                    onClick={togglePicker}
                    ref={inputRef}
                />
                <span className="calendar-icon" onClick={togglePicker}>
                    &#x1F4C5; {/* Calendar icon */}
                </span>
            </div>
            {isPickerOpen && (
                <div className="date-picker" onClick={(e) => e.stopPropagation()} ref={pickerRef}>
                    <div className="header">
                        <button onClick={(e) => prevMonth(e)}>&lt;</button>
                        <span>{format(currentMonth, 'MMMM yyyy')}</span>
                        <button onClick={(e) => nextMonth(e)}>&gt;</button>
                    </div>
                    <div className="days-header">
                        <span>Sun</span>
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Sat</span>
                    </div>
                    <div className="days">{generateDays()}</div>
                    <button className="clear-button" onClick={clearDate}>
                        Clear
                    </button>
                </div>
            )}
        </div>
    );
};

export default DateComponent;