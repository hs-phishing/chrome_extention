import React, { useState } from 'react';
import axios from 'axios';
import './home.css';
import { ReactComponent as SearchIcon } from './search.svg';

const Home: React.FC = () => {
    const [url, setUrl] = useState<string>('');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const handleSearch = async () => {
        if (url.trim() === '') return;

        setLoading(true);
        try {
            const response = await axios.post('/api/url/detailed', { url });
            console.log(response.data); // 서버 응답 확인
            setResult(response.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            setResult(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="home">
            <h1 className="title">Catch Phishing</h1>
            <div className="search-container">
                <SearchIcon className="search-icon" />
                <input
                    type="text"
                    className="search-input"
                    placeholder="Enter the suspicious URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            handleSearch();
                        }
                    }}
                />
            </div>

            <div className="url-title">
                {result ? (
                    <>
                        <h1>{result.url}</h1>
                        <p className="reliable-site">{result.is_reliable ? 'a reliable site' : 'not reliable'}</p>
                    </>
                ) : null}
            </div>

            {loading && <p>Loading...</p>}

            {result && (
                <div className="content-box">
                    <h2 className="about-heading">About</h2>

                    <div className="content">
                        <div className="left-section">
                            <div className="ip-score">
                                <p className="section-title">IP Score</p>
                                <div className={`status-box ${result.is_vpn ? 'danger' : 'safe'}`}>
                                    {result.is_vpn ? 'Danger' : 'Safe'}
                                </div>
                                <p>IP: {result.ip_address}</p>
                                <p>Country: {result.country}</p>
                                <p>Region: {result.region}</p>
                            </div>
                        </div>

                        <div className="right-section">
                            <h3>Reason & Summary</h3>
                            <p>{result.url_based_feature_list ? result.url_based_feature_list.join(', ') : 'N/A'}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
