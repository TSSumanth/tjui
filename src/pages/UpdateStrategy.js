import React from "react";
import { useLocation, useParams } from "react-router-dom";
import { ModifyStrategyDetails } from "../components/Strategies/UpdateStrategy";
import Header from '../components/Header/Header'
const UpdateStrategyPage = () => {
    const { id } = useParams();
    const location = useLocation();
    const strategy = location.state?.strategy;
    console.log("Details: "+ strategy)
    return (
        <div>
            <Header />
            <ModifyStrategyDetails id={id}/>
        </div>);
};

export default UpdateStrategyPage;