import React, { useState, useRef, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const NotesEditor = ({ initialValue = '', onChange }) => {
    const [notes, setNotes] = useState(initialValue);
    const quillRef = useRef(null);

    const modules = {
        toolbar: [
            [{ header: [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image'],
            [{ color: [] }, { size: ['small', false, 'large', 'huge'] }],
            ['clean'],
        ],
    };

    const formats = [
        'header',
        'bold',
        'italic',
        'underline',
        'strike',
        'blockquote',
        'list',
        'bullet',
        'link',
        'image',
        'color',
        'size'
    ];

    const handleChange = (content) => {
        setNotes(content);
        onChange(content);
    };

    useEffect(() => {
        if (quillRef.current) {
            const quill = quillRef.current.getEditor();
            quill.format('size', 'large'); // Set the default size to 'large'
        }
    }, []);

    return (
        <ReactQuill
            ref={quillRef}
            value={notes}
            onChange={handleChange}
            modules={modules}
            formats={formats}
            // style={{ height: '100px', marginBottom: '10px' }} // Adjusted height
            placeholder="Enter your notes here..."
        />
    );
};

export default NotesEditor;