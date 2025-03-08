import React from 'react';
import { useEffect, useState } from "react";
import { BrowserRouter, useNavigate, Link } from 'react-router-dom'
import Logo from '../../images/logo.png';
import './Header.css'
import { ActionItems } from '../ActionItems/ActionItems'


function MyButton({ to, children, className }) {

    const navigate = useNavigate();

    const handleClick = () => {
        navigate(to);
    };

    return (
        <button onClick={handleClick} className={className}>
            {children}
        </button>
    );
}

function MyImage({ to, image, alt, className }) {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(to);
    };
    return (
        <img src={image} alt={alt} onClick={handleClick} className={className} />
    );
}



function Header() {

    return (
        <>
            <nav>
                <div className='header-container'>
                    <div className='logo'>
                        <MyImage to="/" image={Logo} alt="My Trading Journal" />
                    </div>
                    <div className='menu-items'>
                        <MyButton to="/marketanalysis" className="nav-button">Daily Market Analysis</MyButton>
                        <MyButton to="/trades" className="nav-button">Trades</MyButton>
                        <MyButton to="/profitlossreport" className="nav-button">Profit Loss Report</MyButton>
                        <MyButton to="/" className="nav-button">My Stratagies</MyButton>
                        <MyButton to="/dashboard" className="nav-button">Dashboard</MyButton>
                        <MyButton to="/tagmanagement" className="nav-button">Tag Management</MyButton>
                        <MyButton to="/tagmanagement" className="nav-button">Add Action Item</MyButton>
                    </div>
                </div>
            </nav>
            <div className='stats-section'>
                <ActionItems />

                <div className='other-stats'>
                    <h1>Under Development Yet to DESIDE</h1>
                </div>

            </div>
        </>
    )
}

export {
    Header
}