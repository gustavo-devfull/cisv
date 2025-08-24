
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthProvider from './auth/AuthProvider';
import PrivateRoute from './auth/PrivateRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EventsList from './pages/EventsList';
import EventForm from './pages/EventForm';
import RegistrantsList from './pages/RegistrantsList';
import RegistrantForm from './pages/RegistrantForm';
import Registrations from './pages/Registrations';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<PrivateRoute />}>
            <Route index element={<Dashboard />} />
            <Route path="/events" element={<EventsList />} />
            <Route path="/events/:id" element={<EventForm />} />
            <Route path="/registrants" element={<RegistrantsList />} />
            <Route path="/registrants/:id" element={<RegistrantForm />} />
            <Route path="/registrations" element={<Registrations />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
