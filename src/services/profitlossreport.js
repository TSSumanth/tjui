import axios from "axios";

const API_URL = "http://localhost:1000/api/plentry";


export const getReportByDateRange = async (startdate, enddate) => {
    const response = await axios.get(API_URL, {
        params: {
            startdate: startdate,
            enddate: enddate
        }
    });
    
    return response.data;
};


export const deleteEntry = async (date) => {
    const response = await axios.delete(API_URL, {
        params: {
            date: date
        }
    });
    console.log(response.status)
    if (! (response.status === 204)) {
        throw new Error("Failed to delete record");
    }
    return true;
};

export const updateEntry = async (entryobject) => {
    console.log(entryobject)
    const response = await axios.patch(API_URL, entryobject,{
        params: {
            date: entryobject.date
        }
    });
    console.log(response.status)
    if (! (response.status === 200)) {
        throw new Error("Failed to update record");
    }
    return true;
};

export const addEntry = async (entryobject) => {
    console.log(entryobject)
    const response = await axios.post(API_URL, entryobject,{});
    console.log(response.status)
    if (! (response.status === 201)) {
        throw new Error("Failed to Create record");
    }
    return true;
};