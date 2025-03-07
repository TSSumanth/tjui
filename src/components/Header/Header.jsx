import React from 'react';
import { useEffect } from "react";
import { BrowserRouter, useNavigate, Link } from 'react-router-dom'
import Logo from '../../images/logo.png'
import './Header.css'

function MyButton({ to, children }) {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(to);

    };

    return (
        <button onClick={handleClick}>
            {children}
        </button>
    );
}

function MyImage({ to, image, alt }) {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(to);

    };

    return (
        <img src={image} alt={alt} onClick={handleClick} />
    );
}


function Header() {

    return (
        <nav>
            <div className='header-container'>
                <div className='logo'>
                    <MyImage to="/" image={Logo} alt="My Trading Journal" />
                </div>
                <div className='menu-items'>
                    <MyButton to="/profitlossreport">Profit Loss Report</MyButton>
                    <MyButton to="/trades">Trades</MyButton>
                    <MyButton to="/dashboard">Dashboard</MyButton>
                    <MyButton to="/">My Stratagies</MyButton>
                    <MyButton to="/tagmanagement">Tag Management</MyButton>
                </div>
            </div>
        </nav>

    )
}

export {
    Header
}