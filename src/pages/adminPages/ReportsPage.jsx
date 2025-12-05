import React from 'react';
import axios from 'axios';
import API_CONFIG from '../../config/api';
import useAuthHeader from 'react-auth-kit/hooks/useAuthHeader';
import { FileText, Download } from 'lucide-react';
import '../styles/ClientPages.css'; // Використовуємо існуючі стилі карток

const ReportsPage = () => {
    const authHeader = useAuthHeader();

    const downloadFile = async (endpoint, filename) => {
        try {
            const response = await axios.get(`${API_CONFIG.BASE_URL}/report/${endpoint}`, {
                headers: { 'Authorization': authHeader },
                responseType: 'blob', // Важливо для завантаження файлів
            });

            // Створення посилання для скачування
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error downloading file:", error);
            alert("Помилка при формуванні звіту");
        }
    };

    return (
        <div className="client-page" style={{paddingTop: '50px'}}>
            <h1 className="page-title">Генерація звітів</h1>
            
            <div className="cards-grid-squares" style={{maxWidth: '800px'}}>
                {/* Картка для Плану */}
                <div className="item-card skill-card-visual" onClick={() => downloadFile('plan', 'Plan_DBLAB.docx')}>
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px'}}>
                        <FileText size={48} color="#009CCF" />
                        <h3 className="skill-title">План роботи</h3>
                        <p className="skill-description">
                            Завантажити автоматично сформований план роботи гуртка (список студентів, викладачів).
                        </p>
                        <span className="enroll-btn-small" style={{marginTop: '10px'}}>
                            <Download size={16} style={{marginRight: '5px'}}/> Завантажити .DOCX
                        </span>
                    </div>
                </div>

                {/* Картка для Звіту */}
                <div className="item-card skill-card-visual" onClick={() => downloadFile('year-report', 'Report_DBLAB.docx')}>
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px'}}>
                        <FileText size={48} color="#009CCF" />
                        <h3 className="skill-title">Річний звіт</h3>
                        <p className="skill-description">
                            Завантажити звіт про результати (публікації, конференції) за поточний рік.
                        </p>
                        <span className="enroll-btn-small" style={{marginTop: '10px'}}>
                            <Download size={16} style={{marginRight: '5px'}}/> Завантажити .DOCX
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;