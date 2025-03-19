import React from 'react';
import { useEffect, useState } from "react";
import { BrowserRouter, useNavigate, Link } from 'react-router-dom'
import Logo from '../../images/logo.png';
import './Header.css'
import { ActionItems } from '../ActionItems/ActionItems'
import { Card } from '../Trades/OrderForm'

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