import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StudentPortal } from './pages/StudentPortal';
import { AdminDashboard } from './pages/AdminDashboard';
import './styles/index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StudentPortal />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
