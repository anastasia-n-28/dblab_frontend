import { useEffect, useState } from "react";
import AdminTableComponent from "../../components/AdminTableComponent.jsx";
import axios from "axios";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";
import API_CONFIG from '../../config/api.js';

const Proposal = () => {
    const [proposalTypeOptions, setProposalTypeOptions] = useState([]);
    const [directionOptions, setDirectionOptions] = useState([]);
    const authHeader = useAuthHeader();

    useEffect(() => {
        axios.get(`${API_CONFIG.BASE_URL}/proposalType/getall`, {
            headers: {
                'Authorization': authHeader.split(' ')[1],
            }
        })
        .then(response => {
            const options = response.data.map(proposalType => ({
                id: proposalType.proposal_type_Id,
                name: proposalType.name
            }));
            setProposalTypeOptions(options);
        });

        axios.get(`${API_CONFIG.BASE_URL}/direction/getall`, {
            headers: {
                'Authorization': authHeader.split(' ')[1],
            }
        })
        .then(response => {
            const options = response.data.map(direction => ({
                id: direction.direction_Id,
                name: direction.name
            }));
            setDirectionOptions(options);
        });
    }, []);

    const columns = [
        { key: "proposal_Id", title: "ID" },
        { key: "title", title: "Назва" },
        { key: "description", title: "Опис" },
        { key: "status", title: "Статус", type: "select", options: ['Pending', 'Approved', 'Rejected'] },
        { key: "complexity", title: "Складність", type: "select", options: ['Low', 'Medium', 'High'] },
        { key: "teacher_Id", title: "Викладач" },
        { key: "proposal_type_Id", title: "Тип пропозиції", type: "select", options: proposalTypeOptions },
        { key: "direction_Id", title: "Напрям", type: "select", options: directionOptions }
    ];

    return (
        <div>
            <AdminTableComponent
                tableName={"Пропозиції"}
                columns={columns}
                endpoint={"proposal"}
                idField={"proposal_Id"}
            />
        </div>
    );
};

export default Proposal;