import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_CONFIG from '../config/api';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import useAuthHeader from 'react-auth-kit/hooks/useAuthHeader';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, User } from 'lucide-react';
import './styles/ClientPages.css';
import './styles/StudentProposals.css';

const StudentProposals = () => {
    const [proposals, setProposals] = useState([]);
    const [filteredProposals, setFilteredProposals] = useState([]);
    const [directions, setDirections] = useState([]);
    const [teachers, setTeachers] = useState([]);
    
    // Фільтри
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDirections, setSelectedDirections] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState('');

    const authUser = useAuthUser();
    const authHeader = useAuthHeader();
    const [searchParams] = useSearchParams();

    // 1. Завантаження даних
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [propRes, dirRes, teachRes] = await Promise.all([
                    axios.get(`${API_CONFIG.BASE_URL}/proposal/getall`),
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

    // 2. Обробка URL параметрів (фільтр з головної сторінки)
    useEffect(() => {
        const dirId = searchParams.get('directionId');
        if (dirId) {
            const id = parseInt(dirId);
            if (!isNaN(id)) setSelectedDirections([id]);
        }
    }, [searchParams]);

    // 3. Логіка фільтрації
    useEffect(() => {
        let result = proposals;

        // Пошук
        if (searchQuery) {
            result = result.filter(p => 
                p.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Фільтр за Напрямами (Checkbox)
        if (selectedDirections.length > 0) {
            result = result.filter(p => selectedDirections.includes(p.direction_Id));
        }

        // Фільтр за Викладачем (Select)
        if (selectedTeacher && selectedTeacher !== '') {
            result = result.filter(p => p.teacher_Id === parseInt(selectedTeacher));
        }

        // Показуємо тільки доступні пропозиції
        result = result.filter(p => p.status === 'Available');

        setFilteredProposals(result);
    }, [searchQuery, selectedDirections, selectedTeacher, proposals]);

    const handleDirectionChange = (id) => {
        setSelectedDirections(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleEnroll = async (proposalId) => {
        if (!authUser) {
            alert("Будь ласка, увійдіть в систему або зареєструйтеся, щоб подати заявку.");
            return;
        }
        if (authUser.role && authUser.role !== 'student' && authUser.role !== 'admin') { 
             alert("Викладачі не можуть записуватися на теми.");
             return;
        }

        const confirm = window.confirm("Ви дійсно бажаєте записатися на цю тему?");
        if (!confirm) return;

        try {
            await axios.post(`${API_CONFIG.BASE_URL}/work/create`, {
                name: "Нова робота (Заявка)", 
                attachment_date: new Date(),
                proposal_Id: proposalId,
                user_Id: authUser.user_Id,
                review: "Очікує підтвердження",
                comment: "Заявка подана через сайт"
            }, {
                headers: { 'Authorization': authHeader }
            });
            alert("Заявку успішно подано! Викладач зв'яжеться з вами.");
        } catch (error) {
            console.error(error);
            alert("Помилка при подачі заявки. Можливо, ви вже маєте активну роботу.");
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
                    <div className="filter-label"><User size={18} /> Викладач:</div>
                    <select 
                        className="search-input" 
                        style={{minWidth: '200px', paddingLeft: '15px'}}
                        value={selectedTeacher}
                        onChange={(e) => setSelectedTeacher(e.target.value)}
                    >
                        <option value="">Всі викладачі</option>
                        {teachers.map(teacher => (
                            <option key={teacher.teacher_Id} value={teacher.teacher_Id}>
                                {teacher.full_name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filters-group" style={{width: '100%', marginTop: '10px'}}>
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

            {/* Сітка карток або повідомлення про порожній список */}
            <div className="cards-grid-list">
                {filteredProposals.length > 0 ? (
                    filteredProposals.map(proposal => (
                        <div key={proposal.proposal_Id} className="item-card proposal-card">
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
                                
                                <p className="card-description-left">{proposal.description}</p>
                                
                                <div className="card-footer-row">
                                    <div className="teacher-tags">
                                        <span className="label">Керівник: </span>
                                        <span className="teacher-tag">{proposal.teacherName}</span>
                                    </div>

                                    {proposal.status === 'Available' && (
                                        <button className="enroll-btn-small" onClick={() => handleEnroll(proposal.proposal_Id)}>
                                            Записатися
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    // БЛОК, ЯКИЙ ВІДОБРАЖАЄТЬСЯ, КОЛИ НЕМАЄ ПРОПОЗИЦІЙ
                    <div className="no-results-message">
                        <p>За обраними критеріями пропозицій не знайдено.</p>
                        <button 
                            className="action-btn" 
                            onClick={() => {
                                setSelectedDirections([]); 
                                setSelectedTeacher(''); 
                                setSearchQuery('');
                            }}
                            style={{margin: '0 auto'}}
                        >
                            Скинути фільтри
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentProposals;