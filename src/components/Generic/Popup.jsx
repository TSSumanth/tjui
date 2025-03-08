import React, { useState } from "react";
import './Popup.css'

function ConfirmPopup({ trigger, onCancel, onConfirm, message }) {
    return (trigger) ? (
        <div className="confirmation-popup">
            <div className="confirmation-popup-inner">
                <h2 className='confirmation-popup-message'>{message}</h2>
                <button onClick={onCancel} className="confirmation-popup-Cancel-button">Cancel</button>
                <button onClick={onConfirm} className="confirmation-popup-Accept-button">Accept</button>
            </div>

        </div>
    ) : ''
}

function InfoPopup({ trigger, onClose, children }) {
    return (trigger) ? (
        <div className="info-popup">
            <div className="info-popup-inner">
                <button onClick={onClose} className="info-popup-cancel-button">Close</button>
                {children}
            </div>
        </div>
    ) : ''
}

export { ConfirmPopup, InfoPopup }