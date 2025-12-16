import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_CONFIG from '../config/api';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import useAuthHeader from 'react-auth-kit/hooks/useAuthHeader';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, User, Tag, Info, HelpCircle, Gauge } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import './styles/ClientPages.css';
import './styles/StudentProposals.css';
import SimpleTooltip from '../components/Tooltip';
import ComplexityDots from '../components/ComplexityDots';

const StudentProposals = () => {
    const [proposals, setProposals] = useState([]);
    const [filteredProposals, setFilteredProposals] = useState([]);
    const [directions, setDirections] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [types, setTypes] = useState([]); 
    
    // Фільтри
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDirections, setSelectedDirections] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [complexityRange, setComplexityRange] = useState([1, 3]); 

    const [selectedComplexity, setSelectedComplexity] = useState('');
    const authUser = useAuthUser();
    const authHeader = useAuthHeader();
    const [searchParams] = useSearchParams();
    const { addToast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [propRes, dirRes, teachRes, typeRes] = await Promise.all([
                    axios.get(`${API_CONFIG.BASE_URL}/proposal/getall`),
                    axios.get(`${API_CONFIG.BASE_URL}/direction/getall`),
                    axios.get(`${API_CONFIG.BASE_URL}/teacher/getall`),
                    axios.get(`${API_CONFIG.BASE_URL}/proposaltype/getall`).catch(() => ({ data: [] }))
                ]);

                const enrichedProposals = propRes.data.map(p => ({
                    ...p,
                    teacherName: teachRes.data.find(t => t.teacher_Id === p.teacher_Id)?.full_name || 'Невідомий',
                    directionName: dirRes.data.find(d => d.direction_Id === p.direction_Id)?.name || 'Загальний',
                    typeName: typeRes.data.find(t => t.proposal_type_Id === p.proposal_type_Id)?.name || 'Загальний'
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

    useEffect(() => {
        const dirId = searchParams.get('directionId');
        
        if (dirId) {
            const id = parseInt(dirId);
            if (!isNaN(id)) {
                console.log("Applying filter from URL:", id);
                setSelectedDirections([id]);

                setSearchQuery('');
                setSelectedTeacher('');
                setSelectedType('');
                setComplexityRange([1, 3]);
            }
        }
    }, [searchParams]);

    const getComplexityNum = (str) => {
        if (!str) return 2;
        const s = str.toLowerCase();
        if (s.includes('низька') || s.includes('low')) return 1;
        if (s.includes('висока') || s.includes('high')) return 3;
        return 2; 
    };

    useEffect(() => {
        if (proposals.length === 0) return;

        let result = proposals;

        if (searchQuery) {
            result = result.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        if (selectedDirections.length > 0) {
            result = result.filter(p => selectedDirections.includes(p.direction_Id));
        }
        
        if (selectedTeacher) {
            result = result.filter(p => p.teacher_Id === parseInt(selectedTeacher));
        }
        
        if (selectedType) {
            result = result.filter(p => p.proposal_type_Id === parseInt(selectedType));
        }

        result = result.filter(p => {
            const level = getComplexityNum(p.complexity);
            return level >= complexityRange[0] && level <= complexityRange[1];
        });

        // Тільки доступні
        result = result.filter(p => p.status === 'Запропоновано');

        setFilteredProposals(result);
        
    }, [proposals, searchQuery, selectedDirections, selectedTeacher, selectedType, complexityRange]); 

    const handleDirectionChange = (id) => {
        setSelectedDirections(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleSliderChange = (e, type) => {
        const val = parseInt(e.target.value);
        if (type === 'min') {
            const newMin = val;
            const newMax = Math.max(newMin, complexityRange[1]);
            setComplexityRange([newMin, newMax]);
        } else {
            const newMax = val;
            const newMin = Math.min(newMax, complexityRange[0]);
            setComplexityRange([newMin, newMax]);
        }
    };

    const handleEnroll = async (proposalId) => {
        if (!authUser) { alert("Увійдіть в систему"); return; }
        if (authUser.role && authUser.role !== 'student' && authUser.role !== 'admin') { alert("Викладачі не можуть записуватися."); return; }
        const userId = authUser.user_Id || authUser.id;
        if (!window.confirm("Записатися на цю тему?")) return;

        try {
            await axios.post(`${API_CONFIG.BASE_URL}/work/student/create`, {
                name: "Нова робота (Заявка)", 
                begining_date: new Date(),
                proposal_Id: proposalId,
                user_Id: userId,
                review: "Очікує підтвердження",
                comment: "Заявка через сайт",
                file: "" 
            }, { headers: { 'Authorization': authHeader } });
            addToast("Заявку надіслано!", "success");
        } catch (error) {
            const msg = error.response?.data?.message || error.message;
            addToast(`Помилка: ${msg}`, "error");
        }
    };

    return (
        <div className="client-page">
            <h1 className="page-title">Доступні пропозиції</h1>

            <div className="filter-panel">
                <div className="search-box">
                    <Search className="search-icon" size={20} />
                    <input type="text" className="search-input" placeholder="Пошук..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>

                <div className="filters-group">
                    <div className="filter-label"><Tag size={18} /> Тип:</div>
                    <select className="search-input" style={{minWidth: '150px'}} value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                        <option value="">Всі типи</option>
                        {types.map(t => <option key={t.proposal_type_Id} value={t.proposal_type_Id}>{t.name}</option>)}
                    </select>
                </div>

                <div className="filters-group">
                    <div className="filter-label"><User size={18} /> Викладач:</div>
                    <select className="search-input" style={{minWidth: '200px'}} value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)}>
                        <option value="">Всі викладачі</option>
                        {teachers.map(t => <option key={t.teacher_Id} value={t.teacher_Id}>{t.full_name}</option>)}
                    </select>
                </div>

                <div className="filters-group">
                    <div className="filter-label"><Gauge size={18} /> Складність:</div>
                    <select className="search-input" style={{minWidth: '200px'}} value={selectedComplexity} onChange={(e) => setSelectedComplexity(e.target.value)}>
                        <option value="">Складність</option>
                        <option value="Низька">Низька</option>
                        <option value="Середня">Середня</option>
                        <option value="Висока">Висока</option>
                    </select>
                </div>

                <div className="filters-group" style={{width: '100%', marginTop: '10px', flexDirection: 'column', alignItems: 'flex-start'}}>
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
                                        <SimpleTooltip text="Статус: Запропоновано">
                                            <span className={`badge ${proposal.status === 'Запропоновано' ? 'badge-green' : 'badge-gray'}`}>
                                                {proposal.status}
                                            </span>
                                        </SimpleTooltip>
                                    </div>
                                </div>
                                <p className="card-description-left">{proposal.description}</p>
                                <div className="card-footer-col">
                                    <div className="proposal-type-row">
                                        <Tag size={14} /> 
                                        <span style={{fontWeight: 600}}>Тип:</span> {proposal.typeName}

                                        <ComplexityDots levelStr={proposal.complexity} />
                                    
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
                        <button className="action-btn" onClick={() => {
                            setSelectedDirections([]); setSelectedTeacher(''); setSearchQuery(''); setSelectedType(''); setComplexityRange([1,3]);
                        }} style={{margin: '0 auto'}}>
                            Скинути фільтри
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentProposals;