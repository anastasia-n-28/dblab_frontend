import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_CONFIG from '../config/api';
import { Search, BookOpen, ChevronRight } from 'lucide-react';
import './styles/ClientPages.css';

const StudentResults = () => {
    const [results, setResults] = useState([]);
    const [filteredResults, setFilteredResults] = useState([]);
    const [resultTypes, setResultTypes] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('All');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resRes, typesRes] = await Promise.all([
                    axios.get(`${API_CONFIG.BASE_URL}/result/getall`),
                    axios.get(`${API_CONFIG.BASE_URL}/result_type/getall`)
                ]);

                // Збагачуємо дані назвами типів
                const enrichedResults = resRes.data.map(r => ({
                    ...r,
                    typeName: typesRes.data.find(t => t.result_type_Id === r.result_type_Id)?.name || 'Result'
                }));

                setResults(enrichedResults);
                setFilteredResults(enrichedResults);
                setResultTypes(typesRes.data);
            } catch (error) {
                console.error("Error loading results:", error);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        let data = results;

        if (searchQuery) {
            data = data.filter(r => 
                r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (r.full_name && r.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        if (selectedType !== 'All') {
            data = data.filter(r => r.result_type_Id === parseInt(selectedType));
        }

        setFilteredResults(data);
    }, [searchQuery, selectedType, results]);

    return (
        <div className="client-page">
            <h1 className="page-title">Результати наших студентів</h1>

            <div className="filter-panel">
                <div className="search-box">
                    <Search className="search-icon" size={20} />
                    <input 
                        type="text" 
                        className="search-input" 
                        placeholder="Пошук роботи або студента..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="filters-group">
                    <div className="filter-label"><BookOpen size={18} /> Тип:</div>
                    <select 
                        className="search-input" 
                        style={{minWidth: '200px', paddingLeft: '15px'}}
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
            </div>

            <div className="cards-grid">
                {filteredResults.map(result => (
                    <div key={result.result_Id} className="item-card">
                        <div className="card-content">
                            <div className="card-header">
                                <h3 className="card-title">{result.name}</h3>
                                <div className="card-badges">
                                    <span className="badge badge-blue">{result.typeName}</span>
                                    <span className="badge badge-gray">{result.year} рік</span>
                                </div>
                            </div>
                            
                            <p className="card-description">
                                Автор: <strong>{result.full_name}</strong>
                                <br/>
                                {result.pages ? `Обсяг: ${result.pages} стор.` : ''}
                            </p>
                            
                            <div className="card-footer">
                                <button className="action-btn">
                                    Детальніше <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StudentResults;