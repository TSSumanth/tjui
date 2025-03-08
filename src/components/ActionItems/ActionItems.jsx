
import { getactiveactionitems, updateactionitem, addactionitem } from "../../services/actionitems.js";
import { CreateActionItem } from './ActionModelPopup.jsx'
import React from 'react';
import { useEffect, useState } from "react";
import './ActionItems.css'

export function ActionItems() {
    const [activeActionItems, setActiveActionItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const markComplete = async (item) => {
        setLoading(true)
        item.status = "COMPLETED"
        const response = await updateactionitem(item);
        if (response) {
            setActiveActionItems(prevData => prevData.filter(record => record.id !== item.id))
            setLoading(false)
        }
    }

    const addtem = async (item) => {
        setLoading(true)
        if (item.status === "") {
            alert(`Status is Required`);
            setLoading(false)
            return
        }
        if (item.description === "") {
            alert(`Description is Required`);
            setLoading(false)
        }
        const response = await addactionitem(item);
        if (response) {
            await fetchActiveActionItems()
            setLoading(false)
        }
    }

    async function fetchActiveActionItems() {
        const data = await getactiveactionitems();
        setActiveActionItems(data)
    }


    // Trigger fetch when component mounts to load the last 30 days of data
    useEffect(() => {
        fetchActiveActionItems(); // Automatically fetch data when the page loads
    }, []); // Empty dependency array means this runs once when the component mounts


    return (
        <>
            <div className='action-items'>
                <div id="action-items-header">
                    <div id="headingtext">Action Items</div>
                    <button onClick={() => setShowModal(true)}>Add Action Item</button>
                </div>
                {!loading ?
                    activeActionItems.length > 0 ?
                        activeActionItems.map((item) => {
                            return <div className='action-item' id='actionitem'>
                                <p>{item.description}</p>
                                <button onClick={() => markComplete(item)}>Mark as Complete</button>
                            </div>
                        })
                        : <p>No Pending Action Items</p>

                    : <div > "Loading"</div>}
            </div >
            {/* Add Entry Model */}
            {
                showModal && (
                    <CreateActionItem isOpen={showModal} onClose={() => setShowModal(false)} onSave={addtem} />
                )
            }

        </>
    )
}
