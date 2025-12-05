import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_CONFIG from '../config/api';
import { Search, BookOpen, ChevronRight, Calendar, ArrowUpDown } from 'lucide-react'; // Додано нові іконки
import './styles/ClientPages.css';
import './styles/StudentResults.css';

const StudentResults = () => {
    const [results, setResults] = useState([]);
    const [filteredResults, setFilteredResults] = useState([]);
    const [resultTypes, setResultTypes] = useState([]);
    
    // Стани фільтрів
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('All');
    const [filterYear, setFilterYear] = useState('');
    const [sortOrder, setSortOrder] = useState('newest');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resRes, typesRes] = await Promise.all([
                    axios.get(`${API_CONFIG.BASE_URL}/result/getall`),
                    axios.get(`${API_CONFIG.BASE_URL}/resultType/getall`)
                ]);

                if (resRes.data && typesRes.data) {
                    const enrichedResults = resRes.data.map(r => ({
                        ...r,
                        typeName: typesRes.data.find(t => t.result_type_Id === r.result_type_Id)?.name || 'Result'
                    }));

                    setResults(enrichedResults);
                    setFilteredResults(enrichedResults);
                    setResultTypes(typesRes.data);
                }
            } catch (error) {
                console.error("Error loading results:", error);
            }
        };
        fetchData();
    }, []);

    // Ефект для фільтрації та сортування
    useEffect(() => {
        let data = [...results];

        // 1. Пошук (Назва або Автор)
        if (searchQuery) {
            data = data.filter(r => 
                r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (r.full_name && r.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        // 2. Фільтр за Типом
        if (selectedType !== 'All') {
            data = data.filter(r => r.result_type_Id === parseInt(selectedType));
        }

        // 3. Фільтр за Роком
        if (filterYear) {
            data = data.filter(r => r.year && r.year.toString().includes(filterYear));
        }

        // 4. Сортування
        data.sort((a, b) => {
            const yearA = a.year || 0;
            const yearB = b.year || 0;
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();

            switch (sortOrder) {
                case 'newest': // Від найновіших до найстаріших
                    return yearB - yearA;
                case 'oldest': // Від найстаріших до найновіших
                    return yearA - yearB;
                case 'name_asc': // А-Я
                    return nameA.localeCompare(nameB);
                case 'name_desc': // Я-А
                    return nameB.localeCompare(nameA);
                default:
                    return 0;
            }
        });

        setFilteredResults(data);
    }, [searchQuery, selectedType, filterYear, sortOrder, results]);

    return (
        <div className="client-page">
            <h1 className="page-title">Результати наших студентів</h1>

            <div className="filter-panel">
                {/* Пошук */}
                <div className="search-box">
                    <Search className="search-icon" size={20} />
                    <input 
                        type="text" 
                        id="search-query"
                        name="searchQuery"
                        className="search-input" 
                        placeholder="Пошук роботи або студента..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoComplete="off"
                    />
                </div>

                {/* Група фільтрів */}
                
                {/* Тип результату */}
                <div className="filters-group">
                    <label htmlFor="result-type-select" className="filter-label">
                        <BookOpen size={18} /> Тип:
                    </label>
                    <select 
                        id="result-type-select"
                        name="resultType"
                        className="search-input" 
                        style={{minWidth: '150px', paddingLeft: '15px'}}
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                    >
                        <option value="All">Всі типи</option>
                        {resultTypes.map(type => (
                            <option key={type.result_type_Id} value={type.result_type_Id}>
                                {type.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Рік публікації */}
                <div className="filters-group">
                    <label htmlFor="year-filter" className="filter-label">
                        <Calendar size={18} /> Рік:
                    </label>
                    <input 
                        type="number"
                        id="year-filter"
                        name="yearFilter"
                        className="search-input"
                        style={{width: '100px', paddingLeft: '15px'}}
                        placeholder="Рік"
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                        min="2000"
                        max="2099"
                    />
                </div>

                {/* Сортування */}
                <div className="filters-group">
                    <label htmlFor="sort-order" className="filter-label">
                        <ArrowUpDown size={18} /> Сортування:
                    </label>
                    <select 
                        id="sort-order"
                        name="sortOrder"
                        className="search-input" 
                        style={{minWidth: '180px', paddingLeft: '15px'}}
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                    >
                        <option value="newest">Спочатку нові</option>
                        <option value="oldest">Спочатку старі</option>
                        <option value="name_asc">За назвою (А-Я)</option>
                        <option value="name_desc">За назвою (Я-А)</option>
                    </select>
                </div>

            </div>

            <div className="cards-grid-results">
                {filteredResults.length > 0 ? (
                    filteredResults.map(result => (
                        <div key={result.result_Id} className="item-card result-card">
                            <div className="card-content">
                                <div className="card-header">
                                    <h3 className="card-title">{result.name}</h3>
                                    <div className="card-badges">
                                        <span className="badge badge-blue">{result.typeName}</span>
                                        <span className="badge badge-gray">{result.year} рік</span>
                                    </div>
                                </div>
                                
                                <p className="card-description-left">
                                    Автор: <strong>{result.full_name}</strong>
                                    <br/>
                                    {result.pages ? `Обсяг: ${result.pages} стор.` : ''}
                                </p>
                                
                                <div className="card-footer">
                                    <button className="action-btn" onClick={() => alert(`Деталі про: ${result.name}`)}>
                                        Детальніше <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-results">Результатів не знайдено.</div>
                )}
            </div>
        </div>
    );
};

export default StudentResults;