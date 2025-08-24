import PublicRegistration from "./pages/PublicRegistration"// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthProvider from './auth/AuthProvider';
import PrivateRoute from './auth/PrivateRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Home from './pages/Dashboard';
import Events from './pages/Events';
// 🔽 troquei EventForm por EventEditor
import EventEditor from './pages/EventEditor';
import Registrants from './pages/Registrants';
import RegistrantForm from './pages/RegistrantForm';
import Registrations from './pages/Registrations';
// 🔽 novo
import Volunteers from './pages/Volunteers';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
            {/* 🔓 Página pública para inscrição/questionário */}
  <Route path="/inscricao" element={<PublicRegistration />} />
          <Route element={<PrivateRoute />}>
            <Route index element={<Layout><Home /></Layout>} />

            {/* Eventos */}
            <Route path="/events" element={<Layout><Events /></Layout>} />
            <Route path="/events/new" element={<Layout><EventEditor /></Layout>} />
            <Route path="/events/:id" element={<Layout><EventEditor /></Layout>} />

            {/* Inscritos e inscrições */}
            <Route path="/registrants" element={<Layout><Registrants /></Layout>} />
            <Route path="/registrants/:id" element={<Layout><RegistrantForm /></Layout>} />
            <Route path="/registrations" element={<Layout><Registrations /></Layout>} />

            {/* Voluntários */}
            <Route path="/volunteers" element={<Layout><Volunteers /></Layout>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
