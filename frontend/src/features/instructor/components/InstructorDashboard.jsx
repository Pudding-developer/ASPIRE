import React from 'react';
import { Link } from 'react-router-dom';

const InstructorDashboard = () => {
  return (
    <div>
      <nav style={{ padding: '15px 20px', backgroundColor: '#007bff', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>ASPIRE Instructor Portal</h2>
        <div>
          <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>Change Role</Link>
        </div>
      </nav>
      
      <main style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <h1>Instructor Dashboard</h1>
        <p>Welcome, Instructor. This is your personal dashboard.</p>
      </main>
    </div>
  );
};

export default InstructorDashboard;
