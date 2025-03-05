import React, { useState } from "react";
import './Popup.css'
function ConfirmPopup({trigger, onCancel, onConfirm, message}) {
    // let [popup,setpopup] = useState(false);

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
export { ConfirmPopup }