
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">CISV Manager</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="nav">
          {user && (
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item"><NavLink className="nav-link" to="/">Dashboard</NavLink></li>
              <li className="nav-item"><NavLink className="nav-link" to="/events">Eventos</NavLink></li>
              <li className="nav-item"><NavLink className="nav-link" to="/registrants">Inscritos</NavLink></li>
              <li className="nav-item"><NavLink className="nav-link" to="/registrations">Inscrições</NavLink></li>
            </ul>
          )}
          <ul className="navbar-nav ms-auto">
            {user ? (
              <li className="nav-item"><button className="btn btn-outline-light btn-sm" onClick={logout}>Sair</button></li>
            ) : (
              <li className="nav-item"><NavLink className="nav-link" to="/login">Entrar</NavLink></li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
