import React, { useState, useEffect } from "react";
import NotesEditor from '../Generic/NotesEditor.jsx'
import './TagsModelPopup.css'
function UpdateTag({ isOpen, onClose, record, onSave }) {
    const [name, setName] = useState(record.name);
    const [description, setDescription] = useState(record.description);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // const [updatedRecord, setUpdatedRecord] = useState(record);

    const handleSave = () => {
        onSave({
            "name": name,
            "description": description
        });
        setIsSubmitting(false)
        onClose();
    };


    if (!isOpen) return null;


    return (
        <div className='model-container' id='modelcontainer'>
            <div className='model' id='model'>
                <button onClick={onClose} className='close-btn' id='close-button'>X</button>
                <div className='model-content'>
                    <h1>Create Tag</h1>
                    <form className='model-form' onSubmit={(e) => {
                        e.preventDefault();
                        handleSave();
                    }}>
                        <div>
                            <label className="label-field" name='tag-name'>Tag Name(Required) </label>
                            <input type="text" name="name" value={name} onChange={(e) => setName(e.target.value)} className="form-input" />
                        </div>
                        <div>
                            <label className="label-field" name='description'>Description </label>
                            <NotesEditor id="noteseditor" type="text" name="description" initialValue={description} onChange={(content) => setDescription(content)} className="notes-editor" />
                        </div>
                        <button className='submit-btn' id='submit-button' disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save'}</button>
                    </form>
                </div>
            </div>
        </div>
    )
}

function CreateTag({ isOpen, onClose, onSave }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSave = () => {
        onSave({
            "name": name,
            "description": description
        });
        setIsSubmitting(false)
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div >
            <section className='model-container' id='modelcontainer'>
                <section className='model' id='model'>
                    <button onClick={onClose} className='close-btn' id='close-button'>X</button>
                    <div className='model-content'>
                        <h1>Create Tag</h1>
                        <form className='model-form'>
                            <div>
                                <label className="label-field" name='tag-name'>Tag Name(Required) </label>
                                <input type="text" name="name" value={name} onChange={(e) => setName(e.target.value)} className="form-input" />
                            </div>
                            <div>
                                <label className="label-field" name='description'>Description </label>
                                <NotesEditor id="noteseditor" type="text" name="description" value={description} onChange={(content) => setDescription(content)} className="notes-editor" />
                            </div>
                            <button onClick={handleSave} className='submit-btn' id='submit-button' type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : 'Save'}</button>
                        </form>
                    </div>
                </section>

            </section>
        </div>
    )
}

export { UpdateTag, CreateTag }