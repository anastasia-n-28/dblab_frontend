import { useEffect, useState } from "react";
import AdminTableComponent from "../../components/AdminTableComponent.jsx";
import axios from "axios";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";
import API_CONFIG from '../../config/api.js';

const Work = () => {
    const authHeader = useAuthHeader();

    useEffect(() => {
        axios.get(`${API_CONFIG.BASE_URL}/work/getall`, {
            headers: {
                'Authorization': authHeader.split(' ')[1],
            }
        })
        .catch(error => {
            console.error("Error fetching works:", error);
        });
    }, []);

    const columns = [
        { key: "work_Id", title: "ID" },
        { key: "attachment_date", title: "Дата прикріплення", type: "date" },
        { key: "review", title: "Перегляд" },
        { key: "comment", title: "Коментар" },
        { key: "name", title: "Назва" },
        { key: "file", title: "Файл", modalHidden: true },
        { key: "proposal_Id", title: "Пропозиція", type: "select" },
        { key: "user_Id", title: "Користувач" }
    ];

    return (
        <div>
            <AdminTableComponent
                tableName={"Роботи"}
                columns={columns}
                endpoint={"work"}
                idField={"work_Id"}
            />
        </div>
    );
};

export default Work;