import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './navbar.css';
import { ReactComponent as GithubIcon } from './github.svg';
import { ReactComponent as DmIcon } from './dm.svg';

const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [selectedButton, setSelectedButton] = useState<string | null>(
        location.pathname === '/' ? 'search' : 'about'
    );

    const handleButtonClick = (buttonName: string) => {
        setSelectedButton(buttonName);
        if (buttonName === 'about') {
            navigate('/about');
        } else if (buttonName === 'search') {
            navigate('/');
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <button
                    className={`navbar-button ${selectedButton === 'search' ? 'selected' : ''}`}
                    onClick={() => handleButtonClick('search')}

                >
                    Search
                </button>
                <button
                    className={`navbar-button ${selectedButton === 'about' ? 'selected' : ''}`}
                    onClick={() => handleButtonClick('about')}
                >
                    About
                </button>
            </div>
            <div className="navbar-right">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="navbar-icon">
                    <GithubIcon width="20" height="20" fill="currentColor" />
                </a>
                <a href="https://example.com/dm" className="navbar-icon">
                    <DmIcon width="20" height="20" fill="currentColor" />
                </a>
            </div>
        </nav>
    );
};

export default Navbar;
