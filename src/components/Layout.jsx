// src/components/Layout.jsx
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useState } from "react";
import logoCisv from "../assets/CISV_logo_moderno.jpg"; // 🔹 import do logo

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
        <div className="d-flex align-items-center justify-content-center mb-4">
          <Link
            to="/"
            className="d-flex align-items-center justify-content-center text-decoration-none"
            style={{ height: 120 }}
          >
            <img
              src={logoCisv}
              alt="CISV"
              style={{ height: 120, width: "auto", mixBlendMode: "multiply",  }}
            />
          </Link>
        </div>

        {user && (
          <ul className="nav nav-pills flex-column gap-1">
            <li className="nav-item">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `nav-link d-flex align-items-center gap-2 ${
                    isActive ? "active" : ""
                  }`
                }
              >
                <span className="material-symbols-outlined">home</span>
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/events"
                className={({ isActive }) =>
                  `nav-link d-flex align-items-center gap-2 ${
                    isActive ? "active" : ""
                  }`
                }
              >
                <span className="material-symbols-outlined">event</span>
                Eventos
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/registrants"
                className={({ isActive }) =>
                  `nav-link d-flex align-items-center gap-2 ${
                    isActive ? "active" : ""
                  }`
                }
              >
                <span className="material-symbols-outlined">group</span>
                Inscritos
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/registrations"
                className={({ isActive }) =>
                  `nav-link d-flex align-items-center gap-2 ${
                    isActive ? "active" : ""
                  }`
                }
              >
                <span className="material-symbols-outlined">assignment</span>
                Inscrições
              </NavLink>
            </li>

            <li className="nav-item">
  <NavLink to="/form-links" className={({ isActive }) => `nav-link d-flex align-items-center gap-2 ${isActive ? "active" : ""}`}>
    <span className="material-symbols-outlined">link</span>
    Links de formulário
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
              className="btn btn-outline-secondary d-md-none d-flex align-items-center gap-1"
              onClick={() => setOpen((v) => !v)}
              aria-label="Alternar menu lateral"
            >
              <span className="material-symbols-outlined">menu</span>
              Menu
            </button>

            {/* Busca */}
            <div className="input-group">
              <span className="input-group-text bg-white">
                <span className="material-symbols-outlined">search</span>
              </span>
              <input
                className="form-control"
                placeholder="Buscar eventos, inscritos..."
                aria-label="Buscar"
              />
            </div>

            <div className="ms-auto d-flex align-items-center gap-2">
              {user ? (
                <>
                  <span className="small text-muted d-none d-sm-inline">
                    {user.email}
                  </span>
                  <button
                    className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                    onClick={logout}
                  >
                    <span className="material-symbols-outlined">logout</span>
                    Sair
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                >
                  <span className="material-symbols-outlined">login</span>
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
