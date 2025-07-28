import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/Login';
import Register from './pages/Register'; // ✅ Add Register Page
import JobSeekerPage from './pages/JobSeeker';
import EmployerPage from './pages/EmployerPage';
import ApplyForm from './pages/ApplyForm';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<Register />} /> {/* ✅ Register route */}
      <Route path="/jobseeker" element={<JobSeekerPage />} />
      <Route path="/employer" element={<EmployerPage />} />
      <Route path='/form' element={<ApplyForm />} /> 
    </Routes>
  );
}
