import React, { useState } from 'react';
import './styles/Tooltip.css';

const Tooltip = ({ text, children }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div 
            className="tooltip-wrapper"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div className="tooltip-box">
                    {text}
                    <div className="tooltip-arrow" />
                </div>
            )}
        </div>
    );
};

export default Tooltip;