import React from 'react';

const Sparkline = ({ data, width = 60, height = 20, color = "var(--primary-color)" }) => {
    if (!data || data.length < 2) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    // Перетворюємо дані на координати SVG (polyline points)
    const points = data.map((val, index) => {
        const x = (index / (data.length - 1)) * width;
        // Інвертуємо Y, бо в SVG 0 зверху
        const y = height - ((val - min) / range) * height; 
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{overflow: 'visible'}}>
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Точка на останньому значенні (щоб показати актуальний стан) */}
            <circle 
                cx={width} 
                cy={height - ((data[data.length - 1] - min) / range) * height} 
                r="2" 
                fill={color} 
            />
        </svg>
    );
};

export default Sparkline;