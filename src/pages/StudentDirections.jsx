import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_CONFIG from '../config/api';
import './styles/ClientPages.css';

const StudentDirections = () => {
    const [directions, setDirections] = useState([]);

    useEffect(() => {
        axios.get(`${API_CONFIG.BASE_URL}/Direction/getall`)
            .then(response => {
                setDirections(response.data.map(d => ({
                    id: d.direction_Id,
                    name: d.name || d.direction_name,
                    description: d.description || d.direction_Description
                })));
            })
            .catch(error => console.error(error));
    }, []);

    return (
        <div className="client-page">
            <h1 className="page-title">Напрями</h1>
            <div className="cards-grid">
                {directions.map(dir => (
                    <div key={dir.id} className="item-card" style={{flexDirection: 'column'}}>
                        <div className="card-header">
                            <h3 className="card-title">{dir.name}</h3>
                        </div>
                        <p className="card-description">{dir.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StudentDirections;