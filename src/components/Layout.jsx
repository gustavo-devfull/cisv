// src/components/Layout.jsx
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useState } from "react";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(true); // colapsar sidebar em telas menores

  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside
        className={`sidebar p-3 border-end ${open ? "" : "d-none d-md-block"}`}
        style={{ width: 260 }}
      >
        <div className="d-flex align-items-center justify-content-between mb-4">
          <Link to="/" className="h5 mb-0 text-decoration-none">CISV Connect</Link>
        </div>

        {user && (
          <ul className="nav nav-pills flex-column gap-1">
            <li className="nav-item">
              <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                🏠 Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/events" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                📅 Eventos
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/registrants" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                👤 Inscritos
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/registrations" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                🧾 Inscrições
              </NavLink>
            </li>
          </ul>
        )}

        <div className="mt-auto small text-muted pt-3">v0.1</div>
      </aside>

      {/* Main */}
      <main className="flex-grow-1 d-flex flex-column">
        {/* Topbar */}
        <div className="topbar p-2 border-bottom">
          <div className="container-fluid d-flex align-items-center gap-2">
            {/* Toggle sidebar (mobile) */}
            <button
              className="btn btn-outline-secondary d-md-none"
              onClick={() => setOpen((v) => !v)}
              aria-label="Alternar menu"
            >
              ☰
            </button>

            <input
              className="form-control"
              placeholder="Buscar eventos, inscritos..."
            />

            <div className="ms-auto d-flex align-items-center gap-2">
              {user ? (
                <>
                  <span className="small text-muted">{user.email}</span>
                  <button className="btn btn-outline-secondary btn-sm" onClick={logout}>
                    Sair
                  </button>
                </>
              ) : (
                <Link to="/login" className="btn btn-primary btn-sm">
                  Entrar
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-3">
          {/* Suporta uso como wrapper ou com <Outlet /> */}
          {children ?? <Outlet />}
        </div>
      </main>
    </div>
  );
}
