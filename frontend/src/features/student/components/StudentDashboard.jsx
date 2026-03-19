import React from 'react';
import { Link } from 'react-router-dom';

import { useState, useEffect } from 'react';

const StudentDashboard = () => {
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    // Ping the backend API!
    fetch("http://localhost:8000/api/student/profile")
      .then(res => res.json())
      .then(data => setProfileData(data.message))
      .catch(err => console.error("Failed to connect to backend", err));
  }, []);

  return (
    <div>
      <nav style={{ padding: '15px 20px', backgroundColor: '#28a745', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>ASPIRE Student Portal</h2>
        <div>
          <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>Change Role</Link>
        </div>
      </nav>
      
      <main style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <h1>Student Dashboard</h1>
        <p>Welcome, Student. This is your personal dashboard.</p>

        {/* Display the backend data */}
        <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
          <h3>Backend Connection Profile 🔌</h3>
          {profileData 
            ? <p style={{ color: 'green', fontWeight: 'bold' }}>Success! Backend says: "{profileData}"</p> 
            : <p style={{ color: 'orange' }}>⏳ Fetching data from the FastAPI backend...</p>
          }
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
