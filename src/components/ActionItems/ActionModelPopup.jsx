import React, { useState, useEffect } from "react";
import LovComponent from '../Generic/LOVComponent'
import './ActionModelPopup.css'

function CreateActionItem({ isOpen, onClose, onSave }) {
    const [status, setStatus] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSave = () => {
        onSave({
            "status": status,
            "description": description
        });
        setIsSubmitting(false)
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div >
            <section className='action-items-container' id='modelcontainer'>
                <section className='action-items-model' id='model'>
                    <button onClick={onClose} className='action-items-close-btn' id='action-items-close-button'>X</button>
                    <div className='action-items-model-content'>
                        <h1>Create Action Item</h1>
                        <form className='action-items-model-form'>
                            <div>
                                <label className="label-field" name='status'>Status </label>
                                <LovComponent type="text" name="name" className="form-input" options={["TODO", "COMPLETED"]} placeholder="Select a Status" onSelect={setStatus}/>
                            </div>
                            <div>
                                <label className="label-field" name='description'>Description </label>
                                <textarea id="action-items-noteseditor" type="text" name="description" value={description} onChange={(e) => setDescription(e.target.value)} className="action-items-notes-editor" />
                            </div>
                            <button onClick={handleSave} className='action-items-submit-btn' id='action-items-submit-button' type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : 'Save'}</button>
                        </form>
                    </div>
                </section>

            </section>
        </div>
    )
}

export { CreateActionItem }