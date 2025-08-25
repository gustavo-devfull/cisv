// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import AuthProvider from './auth/AuthProvider';
import PrivateRoute from './auth/PrivateRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Home from './pages/Dashboard';
import Events from './pages/Events';
import EventEditor from './pages/EventEditor';
import Registrants from './pages/Registrants';
import RegistrantForm from './pages/RegistrantForm';
import Registrations from './pages/Registrations';
import Volunteers from './pages/Volunteers';

// Páginas públicas
import PublicRegistration from './pages/PublicRegistration';

// 🔽 novo: formulário complementar anexado ao inscrito
import RegistrantQuestionnaire from './pages/RegistrantQuestionnaire';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/inscricao" element={<PublicRegistration />} />

          {/* Protegidas */}
          <Route element={<PrivateRoute />}>
            <Route index element={<Layout><Home /></Layout>} />

            {/* Eventos */}
            <Route path="/events" element={<Layout><Events /></Layout>} />
            <Route path="/events/new" element={<Layout><EventEditor /></Layout>} />
            <Route path="/events/:id" element={<Layout><EventEditor /></Layout>} />

            {/* Inscritos e inscrições */}
            <Route path="/registrants" element={<Layout><Registrants /></Layout>} />
            <Route path="/registrants/:id" element={<Layout><RegistrantForm /></Layout>} />
            {/* 🔽 rota do formulário complementar do inscrito */}
            <Route path="/registrants/:id/questionnaire" element={<Layout><RegistrantQuestionnaire /></Layout>} />

            <Route path="/registrations" element={<Layout><Registrations /></Layout>} />

            {/* Voluntários */}
            <Route path="/volunteers" element={<Layout><Volunteers /></Layout>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
