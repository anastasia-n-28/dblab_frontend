import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_CONFIG from '../config/api';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import useAuthHeader from 'react-auth-kit/hooks/useAuthHeader';
import { Clock, CheckCircle, XCircle, FileText, AlertCircle, Trash2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import './styles/ClientPages.css';

const Dashboard = () => {
    const [works, setWorks] = useState([]);
    const [requests, setRequests] = useState([]); // Заявки (В обробці)
    const [activeProjects, setActiveProjects] = useState([]); // Активні роботи
    
    const authUser = useAuthUser();
    const authHeader = useAuthHeader();
    const userId = authUser?.id || authUser?.user_Id;
    const { addToast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            if (!userId) return;
            try {
                // Отримуємо ВСІ записи з таблиці Work для юзера
                const response = await axios.get(`${API_CONFIG.BASE_URL}/work/user/${userId}`, {
                    headers: { 'Authorization': authHeader }
                });
                
                const allWorks = response.data;
                
                // Розділяємо масив на дві частини за статусом
                // - статуси: 'В обробці', 'Активна', 'Завершена', 'Відхилена'
                
                const myRequests = allWorks.filter(w => 
                    w.status === 'В обробці' || w.status === 'Відхилена'
                );
                
                const myProjects = allWorks.filter(w => 
                    w.status === 'Активна' || w.status === 'Завершена'
                );

                setRequests(myRequests);
                setActiveProjects(myProjects);
            } catch (error) {
                console.error("Error loading dashboard:", error);
            }
        };
        fetchData();
    }, [userId]);

    const getStatusBadge = (status) => {
        switch(status) {
            case 'В обробці': return <span className="badge badge-yellow"><Clock size={14}/> На розгляді</span>;
            case 'Активна': return <span className="badge badge-green"><CheckCircle size={14}/> Активна</span>;
            case 'Завершена': return <span className="badge badge-blue"><CheckCircle size={14}/> Завершена</span>;
            case 'Відхилена': return <span className="badge badge-red"><XCircle size={14}/> Відхилено</span>;
            default: return <span className="badge badge-gray">{status}</span>;
        }
    };

    // Функція безпосереднього маніпулювання
    const handleCancelRequest = async (workId) => {
        if (!window.confirm("Ви дійсно хочете скасувати цю заявку?")) return;

        // Оптимістичне видалення (візуально прибираємо одразу)
        const previousRequests = [...requests];
        setRequests(requests.filter(req => req.work_Id !== workId));

        try {
            await axios.delete(`${API_CONFIG.BASE_URL}/work/student/delete/${workId}`, {
                headers: { 'Authorization': authHeader }
            }); 
            addToast("Заявку скасовано успішно", "success");
            
        } catch (error) {
            // Відкат змін, якщо помилка
            setRequests(previousRequests);
            console.error("Error cancelling:", error);
            const msg = error.response?.data?.message || "Не вдалось видалити заявку";
            addToast(msg, "error");
        }
    };

    return (
        <div className="client-page">
            <h1 className="page-title">Особистий кабінет</h1>

            {/* БЛОК 1: Мої Заявки */}
            <div className="dashboard-section">
                <h2 className="section-title">Мої заявки</h2>
                {requests.length > 0 ? (
                    <div className="cards-grid-list">
                        {requests.map(req => (
                            <div key={req.work_Id} className="item-card request-card">
                                <div className="card-header">
                                    <h3>{req.Proposal?.name || req.name}</h3>
                                    {getStatusBadge(req.status)}
                                </div>
                                <p className="date-text">Подано: {new Date(req.begining_date).toLocaleDateString()}</p>
                                {req.review && (
                                    <div className="feedback-box">
                                        <AlertCircle size={16} />
                                        <span><strong>Коментар викладача:</strong> {req.review}</span>
                                    </div>
                                )}
                                <button 
                                    className="cancel-btn-text" 
                                    onClick={() => handleCancelRequest(req.work_Id)}
                                    title="Скасувати заявку"
                                >
                                    <Trash2 size={16} /> Скасувати
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="empty-state">У вас немає активних заявок.</p>
                )}
            </div>

            <hr className="divider" />

            {/* БЛОК 2: Мої Роботи */}
            <div className="dashboard-section">
                <h2 className="section-title">Мої наукові роботи</h2>
                {activeProjects.length > 0 ? (
                    <div className="cards-grid-list">
                        {activeProjects.map(project => (
                            <div key={project.work_Id} className="item-card work-card-active">
                                <div className="card-header">
                                    <h3>{project.Proposal?.name || project.name}</h3>
                                    {getStatusBadge(project.status)}
                                </div>
                                <div className="work-actions">
                                    {/* Тут пізніше буде перехід на детальну сторінку */}
                                    <button className="action-btn-outline">
                                        <FileText size={16}/> Деталі та Результати
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="empty-state">У вас поки немає активних проєктів.</p>
                )}
            </div>
        </div>
    );
};

export default Dashboard;