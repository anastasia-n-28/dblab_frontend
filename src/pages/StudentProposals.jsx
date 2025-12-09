import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_CONFIG from '../config/api';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import useAuthHeader from 'react-auth-kit/hooks/useAuthHeader';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, User, Tag } from 'lucide-react'; // Додана іконка Tag
import { useToast } from '../context/ToastContext';
import './styles/ClientPages.css';
import './styles/StudentProposals.css';

const StudentProposals = () => {
    const [proposals, setProposals] = useState([]);
    const [filteredProposals, setFilteredProposals] = useState([]);
    
    // Списки для фільтрів
    const [directions, setDirections] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [types, setTypes] = useState([]); // 1. Новий стейт для Типів
    
    // Значення фільтрів
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDirections, setSelectedDirections] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [selectedType, setSelectedType] = useState(''); // 2. Новий стейт вибраного Типу

    const authUser = useAuthUser();
    const authHeader = useAuthHeader();
    const [searchParams] = useSearchParams();
    const { addToast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 3. Додаємо запит на proposal_type/getall
                const [propRes, dirRes, teachRes, typeRes] = await Promise.all([
                    axios.get(`${API_CONFIG.BASE_URL}/proposal/getall`),
                    axios.get(`${API_CONFIG.BASE_URL}/direction/getall`),
                    axios.get(`${API_CONFIG.BASE_URL}/teacher/getall`),
                    axios.get(`${API_CONFIG.BASE_URL}/proposaltype/getall`) // Перевір endpoint!
                ]);

                // 4. Збагачуємо дані назвами типів
                const enrichedProposals = propRes.data.map(p => ({
                    ...p,
                    teacherName: teachRes.data.find(t => t.teacher_Id === p.teacher_Id)?.full_name || 'Невідомий',
                    directionName: dirRes.data.find(d => d.direction_Id === p.direction_Id)?.name || 'Загальний',
                    typeName: typeRes.data.find(t => t.proposal_type_Id === p.proposal_type_Id)?.name || 'Інше'
                }));

                setProposals(enrichedProposals);
                setFilteredProposals(enrichedProposals);
                setDirections(dirRes.data);
                setTeachers(teachRes.data);
                setTypes(typeRes.data);
            } catch (error) {
                console.error("Error loading data:", error);
            }
        };
        fetchData();
    }, []);

    // ... (useEffect для URL params залишаємо) ...

    useEffect(() => {
        let result = proposals;

        if (searchQuery) {
            result = result.filter(p => 
                p.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (selectedDirections.length > 0) {
            result = result.filter(p => selectedDirections.includes(p.direction_Id));
        }

        if (selectedTeacher && selectedTeacher !== '') {
            result = result.filter(p => p.teacher_Id === parseInt(selectedTeacher));
        }

        // 5. Нова логіка фільтрації
        if (selectedType && selectedType !== '') {
            result = result.filter(p => p.proposal_type_Id === parseInt(selectedType));
        }

        result = result.filter(p => p.status === 'Запропоновано');

        setFilteredProposals(result);
    }, [searchQuery, selectedDirections, selectedTeacher, selectedType, proposals]); // Додай selectedType в залежності

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
        const userId = authUser.user_Id || authUser.id;
        if (!userId) {
            alert("Помилка: Не знайдено ID користувача. Спробуйте вийти і зайти знову.");
            return;
        }
        const confirm = window.confirm("Ви дійсно бажаєте записатися на цю тему?");
        if (!confirm) return;

        try {
            await axios.post(`${API_CONFIG.BASE_URL}/work/student/create`, {
                name: "Нова робота (Заявка)", 
                begining_date: new Date(),
                proposal_Id: proposalId,
                user_Id: userId,
                review: "Очікує підтвердження",
                comment: "Заявка подана через сайт",
                file: "" 
            }, {
                headers: { 'Authorization': authHeader }
            });
            addToast("Заявку успішно надіслано! Перевірте кабінет.", "success");
        } catch (error) {
            console.error("Enrollment error:", error);
            const serverMessage = error.response?.data?.message || error.message;
            addToast(`Помилка при подачі заявки: ${serverMessage}`, "error");
        }
    };

    return (
        <div className="client-page">
            <h1 className="page-title">Доступні пропозиції</h1>

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

                {/* 6. Новий фільтр: Тип пропозиції */}
                <div className="filters-group">
                    <div className="filter-label"><Tag size={18} /> Тип:</div>
                    <select 
                        className="search-input" 
                        style={{minWidth: '180px', paddingLeft: '15px'}}
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                    >
                        <option value="">Всі типи</option>
                        {types.map(type => (
                            <option key={type.proposal_type_Id} value={type.proposal_type_Id}>
                                {type.name}
                            </option>
                        ))}
                    </select>
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

            <div className="cards-grid-list">
                {filteredProposals.length > 0 ? (
                    filteredProposals.map(proposal => (
                        <div key={proposal.proposal_Id} className="item-card proposal-card">
                            <div className="card-content">
                                <div className="card-header">
                                    <h3 className="card-title">{proposal.name}</h3>
                                    <div className="card-badges">
                                        <span className="badge badge-blue">{proposal.directionName}</span>
                                        <span className={`badge ${proposal.status === 'Запропоновано' ? 'badge-green' : 'badge-gray'}`}>
                                            {proposal.status}
                                        </span>
                                    </div>
                                </div>
                                
                                <p className="card-description-left">{proposal.description}</p>
                                
                                <div className="card-footer-col"> {/* Змінили клас на колонку або додали обгортку */}
                                    
                                    {/* 7. Відображення типу пропозиції */}
                                    <div className="proposal-type-row" style={{marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', color: '#666', fontSize: '0.9rem'}}>
                                        <Tag size={14} /> 
                                        <span style={{fontWeight: 600}}>Тип:</span> {proposal.typeName}
                                    </div>

                                    <div className="card-footer-row">
                                        <div className="teacher-tags">
                                            <span className="label">Керівник: </span>
                                            <span className="teacher-tag">{proposal.teacherName}</span>
                                        </div>

                                        {proposal.status === 'Запропоновано' && (
                                            <button className="enroll-btn-small" onClick={() => handleEnroll(proposal.proposal_Id)}>
                                                Записатися
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-results-message">
                        <p>За обраними критеріями пропозицій не знайдено.</p>
                        <button 
                            className="action-btn" 
                            onClick={() => {
                                setSelectedDirections([]); 
                                setSelectedTeacher(''); 
                                setSearchQuery('');
                                setSelectedType('');
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