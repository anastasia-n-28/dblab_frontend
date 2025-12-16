import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_CONFIG from '../config/api';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import useAuthHeader from 'react-auth-kit/hooks/useAuthHeader';
import { Clock, CheckCircle, XCircle, FileText, AlertCircle, Search, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import './styles/ClientPages.css';

const Dashboard = () => {
    const [requests, setRequests] = useState([]); 
    const [activeProjects, setActiveProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const authUser = useAuthUser();
    const authHeader = useAuthHeader();
    const navigate = useNavigate();
    const { addToast } = useToast();
    
    const userId = authUser?.id || authUser?.user_Id;

    useEffect(() => {
        const fetchData = async () => {
            if (!userId) return;
            try {
                const response = await axios.get(`${API_CONFIG.BASE_URL}/work/user/${userId}`, {
                    headers: { 'Authorization': authHeader }
                });
                
                const allWorks = response.data;
                
                // Фільтруємо
                const myRequests = allWorks.filter(w => 
                    w.status === 'В обробці' || w.status === 'Відхилена' || w.status === 'pending'
                );
                
                const myProjects = allWorks.filter(w => 
                    w.status === 'Активна' || w.status === 'Завершена' || w.status === 'active'
                );

                setRequests(myRequests);
                setActiveProjects(myProjects);
            } catch (error) {
                console.error("Error loading dashboard:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [userId]);

    const handleCancelRequest = async (workId) => {
        if (!window.confirm("Ви дійсно хочете скасувати цю заявку?")) return;

        const previousRequests = [...requests];
        setRequests(requests.filter(req => req.work_Id !== workId));

        try {
            await axios.delete(`${API_CONFIG.BASE_URL}/work/student/delete/${workId}`, {
                headers: { 'Authorization': authHeader }
            });
            addToast("Заявку скасовано", "success");
        } catch (error) {
            setRequests(previousRequests);
            console.error("Error cancelling:", error);
            const msg = error.response?.data?.message || "Не вдалось скасувати";
            addToast(msg, "error");
        }
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'В обробці': 
            case 'pending':
                return <span className="badge badge-yellow"><Clock size={14}/> На розгляді</span>;
            case 'Активна': 
            case 'active':
                return <span className="badge badge-green"><CheckCircle size={14}/> Активна</span>;
            case 'Завершена': 
            case 'completed':
                return <span className="badge badge-blue"><CheckCircle size={14}/> Завершена</span>;
            case 'Відхилена': 
            case 'rejected':
                return <span className="badge badge-red"><XCircle size={14}/> Відхилено</span>;
            default: return <span className="badge badge-gray">{status}</span>;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('uk-UA');
    };

    if (loading) return <div className="loading">Завантаження кабінету...</div>;

    return (
        <div className="client-page">
            <h1 className="page-title">Особистий кабінет</h1>

            {/* БЛОК 1: Мої Заявки */}
            <div className="dashboard-section">
                <h2 className="section-title">Мої заявки</h2>
                {requests.length > 0 ? (
                    <div className="cards-grid-list">
                        {requests.map(req => {
                            const cardClass = (req.status === 'Відхилена' || req.status === 'rejected') 
                                ? 'item-card rejected-card' 
                                : 'item-card request-card';

                            return (
                                <div key={req.work_Id} className={cardClass}>
                                    <div className="card-header">
                                        <h3>{req.Proposal?.name || req.name}</h3>
                                        {getStatusBadge(req.status)}
                                    </div>
                                    
                                    <div className="request-body" style={{textAlign: 'center', margin: '20px 0'}}>
                                        <p className="date-text" style={{color: '#666', fontSize: '0.9rem'}}>
                                            Подано: {formatDate(req.begining_date)}
                                        </p>
                                        
                                        {req.review && (
                                            <div className="feedback-box" style={{marginTop: '20px'}}>
                                                <AlertCircle size={16} style={{display:'inline', marginBottom:'-3px', marginRight:'5px'}} />
                                                <span><strong>Коментар викладача:</strong> {req.review}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="card-footer-right">
                                        <button 
                                            className="cancel-btn-text" 
                                            onClick={() => handleCancelRequest(req.work_Id)}
                                            title="Видалити з історії"
                                        >
                                            <Trash2 size={16} /> {req.status === 'Відхилена' ? 'Видалити' : 'Скасувати'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="no-results-message">
                        <p>У вас немає активних заявок.</p>
                        <button className="action-btn" onClick={() => navigate('/studentproposals')}>
                            <Search size={18} /> Знайти тему для роботи
                        </button>
                    </div>
                )}
            </div>

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
                                    <button 
                                        className="action-btn-outline" 
                                        onClick={() => navigate(`/work/${project.work_Id}`)}
                                    >
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