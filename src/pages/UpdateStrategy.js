import React from 'react';
import { useLocation, useParams } from "react-router-dom";
import UpdateStrategy from '../components/Strategies/UpdateStrategy';

const UpdateStrategyPage = () => {
    const { id } = useParams();
    const location = useLocation();
    const strategy = location.state?.strategy;
    console.log("Details: " + strategy)
    return (
        <div>
            <UpdateStrategy id={id} />
        </div>);
};

export default UpdateStrategyPage;