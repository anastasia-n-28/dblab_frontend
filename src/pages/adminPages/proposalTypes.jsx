import { useEffect, useState } from "react";
import AdminTableComponent from "../../components/AdminTableComponent.jsx";
import axios from "axios";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";
import API_CONFIG from '../../config/api.js';

const ProposalType = () => {
    const authHeader = useAuthHeader();

    useEffect(() => {
        axios.get(`${API_CONFIG.BASE_URL}/proposal_type/getall`, {
            headers: {
                'Authorization': authHeader.split(' ')[1],
            }
        })
        .catch(error => {
            console.error("Error fetching proposal types:", error);
        });
    }, []);

    const columns = [
        { key: "proposal_type_Id", title: "ID" },
        { key: "name", title: "Назва" }
    ];

    return (
        <div>
            <AdminTableComponent
                tableName={"Типи пропозицій"}
                columns={columns}
                endpoint={"proposalType"}
                idField={"proposal_type_Id"}
            />
        </div>
    );
};

export default ProposalType;