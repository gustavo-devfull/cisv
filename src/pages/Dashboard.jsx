// src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  limit as qlimit,
} from "firebase/firestore";
import { db } from "../firebase";

// Helpers de status
const statusBadge = (status) => {
  const map = {
    open: {
      text: "Inscrições Abertas",
      icon: "event_available",
      cls: "text-primary",
    },
    draft: { text: "Rascunho", icon: "draft", cls: "text-secondary" },
    closed: { text: "Encerrado", icon: "event_busy", cls: "text-danger" },
    archived: { text: "Arquivado", icon: "inventory_2", cls: "text-muted" },
  };
  return (
    map[status] || { text: String(status || "—"), icon: "help", cls: "text-secondary" }
  );
};

const fmtBRDate = (val) => {
  if (!val) return "—";
  try {
    let d;
    if (val?.toDate) d = val.toDate();
    else d = new Date(val);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
};

const fmtBRL = (n) =>
  (Number(n) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const todayISO = () => new Date().toISOString().slice(0, 10);
const isInRange = (iso, start, end) => start && end && start <= iso && iso <= end;
const getCurrentLot = (lots = [], today = todayISO()) =>
  lots.find((l) => isInRange(today, l.startDate, l.endDate));
const getNextLot = (lots = [], today = todayISO()) =>
  [...lots]
    .filter((l) => l.startDate && l.startDate > today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];

const toDateObj = (val) => {
  if (!val) return null;
  try {
    if (val?.toDate) return val.toDate();
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

const calcAge = (birth) => {
  const d = toDateObj(birth);
  if (!d) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age >= 0 && age < 140 ? age : null;
};

const fullName = (r) =>
  [r?.firstName, r?.lastName].filter(Boolean).join(" ") ||
  r?.name ||
  "Sem nome";

export default function Dashboard() {
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentRegistrants, setRecentRegistrants] = useState([]);

  useEffect(() => {
    const qyE = query(
      collection(db, "events"),
      orderBy("startDate", "desc"),
      qlimit(6)
    );
    const unsubE = onSnapshot(qyE, (s) =>
      setRecentEvents(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const qyR = query(
      collection(db, "registrants"),
      orderBy("createdAt", "desc"),
      qlimit(8)
    );
    const unsubR = onSnapshot(qyR, (s) =>
      setRecentRegistrants(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unsubE();
      unsubR();
    };
  }, []);

  const events = useMemo(() => recentEvents || [], [recentEvents]);
  const registrants = useMemo(() => recentRegistrants || [], [recentRegistrants]);

  return (
    <div className="container-fluid">
      {/* ===== Card Eventos recentes ===== */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <h5 className="mb-0 text-uppercase">
              Eventos recentes
            </h5>
            <Link to="/events" className="btn btn-sm btn-outline-primary ms-auto">
              Ver todos
            </Link>
          </div>

          <div className="row g-3">
            {events.map((e) => {
              const lots = Array.isArray(e.registrationLots) ? e.registrationLots : [];
              const current = lots.length ? getCurrentLot(lots) : null;
              const next = lots.length && !current ? getNextLot(lots) : null;
              const b = statusBadge(e.status);

              return (
                <div className="col-md-6 col-xl-4" key={e.id}>
                  <div className="card h-100 p-3">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="mb-1 d-flex align-items-center">
                      
                          {e.title || "Sem título"}
                        </h6>
                        <div className="small text-muted">
                          <span className="material-symbols-outlined me-1">
                            calendar_month
                          </span>
                          {fmtBRDate(e.startDate)} → {fmtBRDate(e.endDate)}
                        </div>
                        {e.location && (
                          <div className="small text-muted">
                            <span className="material-symbols-outlined me-1">
                              location_on
                            </span>
                            {e.location}
                          </div>
                        )}

                        {lots.length ? (
                          <div className="mt-2 small">
                            {current ? (
                              <div>
                                <span className="badge text-bg-success me-2">
                                  Lote atual
                                </span>
                                {current.name} — {fmtBRL(current.priceBRL)}
                              </div>
                            ) : next ? (
                              <div>
                                <span className="badge text-bg-warning me-2">
                                  Próximo lote
                                </span>
                                {next.name} — {fmtBRL(next.priceBRL)}
                              </div>
                            ) : (
                              <div className="text-muted">Nenhum lote vigente.</div>
                            )}
                          </div>
                        ) : (
                          <div className="small mt-2 px-2 py-1 rounded bg-warning-subtle text-warning-emphasis">
                            <span className="material-symbols-outlined me-1">warning</span>
                            Adicione <strong>lotes</strong> para abrir valores/prazos.
                          </div>
                        )}
                      </div>
                      <span className={`d-flex align-items-center ${b.cls}`}>
                        <span className="material-symbols-outlined me-1">
                          {b.icon}
                        </span>{" "}
                        {b.text}
                      </span>
                    </div>

                    <p className="mt-2 mb-3">
                      {(e.description || "—").slice(0, 100)}
                    </p>

                    <div className="d-flex gap-2 mt-auto">
                      <Link to={`/events/${e.id}`} className="btn btn-sm btn-danger">
                        Editar
                      </Link>
                      <Link
                        to={`/registrations?event=${e.id}`}
                        className="btn btn-sm btn-primary"
                      >
                        Inscrições
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
            {!events.length && (
              <div className="text-muted">Nenhum evento encontrado.</div>
            )}
          </div>
        </div>
      </div>

      {/* ===== Card Inscritos recentes ===== */}
      <div className="card">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <h5 className="mb-0 text-uppercase">
              Inscritos recentes
            </h5>
            <Link
              to="/registrants"
              className="btn btn-sm btn-outline-primary ms-auto"
            >
              Ver todos
            </Link>
          </div>

          <div className="row g-3">
            {registrants.map((r) => {
              const birth = r.birthDate ?? r.dateOfBirth ?? r.dob ?? null;
              const age = calcAge(birth);
              const name = fullName(r);

              return (
                <div className="col-sm-6 col-lg-4 col-xxl-3" key={r.id}>
                  <div className="card h-100 p-3">
                    <div className="d-flex align-items-start justify-content-between">
                      <h6 className="mb-1 d-flex align-items-center">
                        <span className="material-symbols-outlined me-1">
                          person
                        </span>
                        {name}
                      </h6>
                      {age != null && (
                        <span className="badge text-bg-info">{age} anos</span>
                      )}
                    </div>

                    <div className="small text-muted d-flex align-items-center">
                      <span className="material-symbols-outlined me-1">
                        location_city
                      </span>
                      {r.address?.city || "Cidade não informada"}
                    </div>

                    <div className="small mt-2 d-flex align-items-center">
                      <span className="material-symbols-outlined me-1">
                        calendar_today
                      </span>
                      <span className="text-muted">Inscrito em: </span>
                      <strong className="ms-1">{fmtBRDate(r.createdAt)}</strong>
                    </div>

                    <div className="d-flex gap-2 mt-auto pt-3">
                      <Link
                        to={`/registrants/${r.id}`}
                        className="btn btn-sm btn-primary"
                      >
                        Ver / Editar
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
            {!registrants.length && (
              <div className="text-muted">Nenhum inscrito encontrado.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
