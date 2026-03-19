import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
      <h1>Welcome to ASPIRE</h1>
      <p>Please select your role to continue:</p>
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        <Link 
          to="/instructor" 
          style={{ padding: '15px 30px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold' }}
        >
          I am an Instructor
        </Link>
        <Link 
          to="/student" 
          style={{ padding: '15px 30px', backgroundColor: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold' }}
        >
          I am a Student
        </Link>
      </div>
    </div>
  );
};

export default LandingPage;
