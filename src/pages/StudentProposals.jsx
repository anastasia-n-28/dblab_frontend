import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_CONFIG from '../config/api';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import useAuthHeader from 'react-auth-kit/hooks/useAuthHeader';
import { Search, Filter, ChevronRight } from 'lucide-react';
import './styles/ClientPages.css';
import { useSearchParams } from 'react-router-dom';

const StudentProposals = () => {
    const [proposals, setProposals] = useState([]);
    const [filteredProposals, setFilteredProposals] = useState([]);
    const [directions, setDirections] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [searchParams] = useSearchParams();
    
    // Фільтри
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDirections, setSelectedDirections] = useState([]);

    const authUser = useAuthUser();
    const authHeader = useAuthHeader();

    // Завантаження даних
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [propRes, dirRes, teachRes] = await Promise.all([
                    axios.get(`${API_CONFIG.BASE_URL}/proposal/getall`), // Тут можна без авторизації, якщо це публічна сторінка
                    axios.get(`${API_CONFIG.BASE_URL}/direction/getall`),
                    axios.get(`${API_CONFIG.BASE_URL}/teacher/getall`)
                ]);

                const enrichedProposals = propRes.data.map(p => ({
                    ...p,
                    teacherName: teachRes.data.find(t => t.teacher_Id === p.teacher_Id)?.full_name || 'Unknown',
                    directionName: dirRes.data.find(d => d.direction_Id === p.direction_Id)?.name || 'General'
                }));

                setProposals(enrichedProposals);
                setFilteredProposals(enrichedProposals);
                setDirections(dirRes.data);
                setTeachers(teachRes.data);
            } catch (error) {
                console.error("Error loading data:", error);
            }
        };
        fetchData();
    }, []);

    // useEffect для обробки URL параметрів
    useEffect(() => {
        const dirId = searchParams.get('directionId');
        if (dirId) {
            const id = parseInt(dirId);
            if (!isNaN(id)) {
                setSelectedDirections([id]);
            }
        }
    }, [searchParams]);

    // Логіка фільтрації
    useEffect(() => {
        let result = proposals;

        // 1. Пошук за назвою
        if (searchQuery) {
            result = result.filter(p => 
                p.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // 2. Фільтр за напрямом (checkboxes)
        if (selectedDirections.length > 0) {
            result = result.filter(p => selectedDirections.includes(p.direction_Id));
        }

        // 3. Показуємо тільки доступні пропозиції
        result = result.filter(p => p.status === 'Available');

        setFilteredProposals(result);
    }, [searchQuery, selectedDirections, proposals]);

    const handleDirectionChange = (id) => {
        setSelectedDirections(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    // Запис на тему
    const handleEnroll = async (proposalId) => {
        if (!authUser) {
            alert("Будь ласка, увійдіть в систему, щоб записатися.");
            return;
        }

        const confirm = window.confirm("Ви дійсно бажаєте записатися на цю тему?");
        if (!confirm) return;

        try {
            await axios.post(`${API_CONFIG.BASE_URL}/work/create`, {
                name: "Нова робота (Заявка)", 
                attachment_date: new Date(),
                proposal_Id: proposalId,
                user_Id: authUser.user_Id, // Беремо ID залогіненого юзера
                review: "Очікує підтвердження",
                comment: "Заявка подана через сайт"
            }, {
                headers: { 'Authorization': authHeader }
            });
            alert("Заявку успішно подано!");
        } catch (error) {
            console.error(error);
            alert("Помилка при подачі заявки.");
        }
    };

    return (
        <div className="client-page">
            <h1 className="page-title">Доступні пропозиції</h1>

            {/* Панель фільтрів */}
            <div className="filter-panel">
                <div className="search-box">
                    <Search className="search-icon" size={20} />
                    <input 
                        type="text" 
                        className="search-input" 
                        placeholder="Пошук за назвою..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="filters-group">
                    <div className="filter-label"><Filter size={18} /> Напрями:</div>
                    <div className="checkbox-group">
                        {directions.map(dir => (
                            <label key={dir.direction_Id} className="custom-checkbox">
                                <input 
                                    type="checkbox" 
                                    checked={selectedDirections.includes(dir.direction_Id)}
                                    onChange={() => handleDirectionChange(dir.direction_Id)}
                                />
                                {dir.name}
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Сітка карток */}
            <div className="cards-grid">
                {filteredProposals.map(proposal => (
                    <div key={proposal.proposal_Id} className="item-card">
                        <div className="card-content">
                            <div className="card-header">
                                <h3 className="card-title">{proposal.name}</h3>
                                <div className="card-badges">
                                    <span className="badge badge-blue">{proposal.directionName}</span>
                                    <span className={`badge ${proposal.status === 'Available' ? 'badge-green' : 'badge-gray'}`}>
                                        {proposal.status}
                                    </span>
                                </div>
                            </div>
                            
                            <p className="card-description">{proposal.description}</p>
                            
                            <div className="card-footer">
                                <span style={{fontSize: '0.9rem', color: '#555'}}>Викладач:</span>
                                <div className="teacher-tags">
                                    <span className="teacher-tag">{proposal.teacherName}</span>
                                </div>
                            </div>
                        </div>

                        {proposal.status === 'Available' && (
                            <button className="action-btn enroll-btn" onClick={() => handleEnroll(proposal.proposal_Id)}>
                                Записатися
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StudentProposals;