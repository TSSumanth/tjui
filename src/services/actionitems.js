import axios from "axios";

const API_URL = "http://localhost:1000/api/actionitems";

export const getactiveactionitems = async () => {
    const response = await axios.get(API_URL + "/activeactionitems");
    return response.data;
};

export const updateactionitem = async (item) => {
    const response = await axios.patch(API_URL + '/' + item.id, item)
    if (!(response.status === 200))
        throw new Error("Unable to Update action item")
    return true;
};


export const addactionitem = async (item) => {
    const response = await axios.post(API_URL , item)
    if (!(response.status === 201))
        throw new Error("Unable to add action item")
    return true;
};