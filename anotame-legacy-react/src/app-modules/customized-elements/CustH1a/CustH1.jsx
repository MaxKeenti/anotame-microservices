import React from 'react';
import './CustH1.css'; // Customized css for cutomized h1

function CustH1({ children }) {
    return (
        <h1 className="custom-h1">
            {children}
        </h1>
    );
}

export default CustH1;
