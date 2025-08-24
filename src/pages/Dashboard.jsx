// src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, orderBy, query, limit as qlimit } from 'firebase/firestore';
import { db } from '../firebase';

/** ===== Helpers (iguais/compatíveis com Events.jsx) ===== */
const statusBadge = (status) => {
  const map = {
    open:     { text: "Inscrições Abertas", cls: "bg-primary-subtle text-primary-emphasis" },
    draft:    { text: "Rascunho",            cls: "bg-secondary-subtle text-secondary-emphasis" },
    closed:   { text: "Encerrado",           cls: "bg-dark-subtle text-dark-emphasis" },
    archived: { text: "Arquivado",           cls: "bg-dark-subtle text-dark-emphasis" }
  };
  return map[status] || { text: String(status || "—"), cls: "bg-secondary-subtle text-secondary-emphasis" };
};

const fmtBRDate = (val) => {
  if (!val) return '—';
  try {
    let d;
    if (val?.toDate) d = val.toDate();                // Firestore Timestamp
    else if (typeof val === 'string') d = new Date(val);
    else if (typeof val === 'number') d = new Date(val);
    else d = new Date(String(val));

    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('pt-BR');
  } catch {
    return '—';
  }
};

const fmtBRL = (n) =>
  (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const todayISO = () => new Date().toISOString().slice(0,10);
const isInRange = (iso, start, end) => start && end && start <= iso && iso <= end;
const getCurrentLot = (lots = [], today = todayISO()) =>
  lots.find(l => isInRange(today, l.startDate, l.endDate));
const getNextLot = (lots = [], today = todayISO()) =>
  [...lots].filter(l => l.startDate && l.startDate > today).sort((a,b) => a.startDate.localeCompare(b.startDate))[0];

/** ===== Helpers de inscritos ===== */
const toDateObj = (val) => {
  if (!val) return null;
  try {
    if (val?.toDate) return val.toDate(); // Firestore Timestamp
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
  return age >= 0 && age < 140 ? age : null; // sanity check
};

const fullName = (r) =>
  [r?.firstName, r?.lastName].filter(Boolean).join(' ') || r?.name || 'Sem nome';

/** ===== Página ===== */
export default function Dashboard() {
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentRegistrants, setRecentRegistrants] = useState([]);

  useEffect(() => {
    // Eventos recentes
    const qyE = query(collection(db, 'events'), orderBy('startDate', 'desc'), qlimit(6));
    const unsubE = onSnapshot(qyE, s => setRecentEvents(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    // Inscritos recentes
    const qyR = query(collection(db, 'registrants'), orderBy('createdAt','desc'), qlimit(8));
    const unsubR = onSnapshot(qyR, s => setRecentRegistrants(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => { unsubE(); unsubR(); };
  }, []);

  const events = useMemo(() => recentEvents || [], [recentEvents]);
  const registrants = useMemo(() => recentRegistrants || [], [recentRegistrants]);

  return (
    <div className="container-fluid">

      {/* ===== Eventos recentes ===== */}
      <div className="d-flex align-items-center mb-2">
        <h5 className="mb-0">Eventos recentes</h5>
        <Link to="/events" className="btn btn-sm btn-outline-light ms-auto">Ver todos</Link>
      </div>

      <div className="row g-3 mb-4">
        {events.map(e => {
          const lots = Array.isArray(e.registrationLots) ? e.registrationLots : [];
          const hasLots = lots.length > 0;
          const current = hasLots ? getCurrentLot(lots) : null;
          const next = hasLots && !current ? getNextLot(lots) : null;
          const b = statusBadge(e.status);

          return (
            <div className="col-md-6 col-xl-4" key={e.id}>
              <div className="card h-100 p-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="mb-1">
                      {e.title || 'Sem título'}
                      {!hasLots && <span className="badge text-bg-secondary align-middle ms-2">Sem lotes</span>}
                    </h6>
                    <div className="small text-muted">
                      {fmtBRDate(e.startDate)} → {fmtBRDate(e.endDate)}
                    </div>
                    {e.location && <div className="small text-muted">📍 {e.location}</div>}

                    {hasLots ? (
                      <div className="mt-2 small">
                        {current ? (
                          <div>
                            <span className="badge text-bg-success me-2">Lote atual</span>
                            {current.name} — {fmtBRL(current.priceBRL)}
                          </div>
                        ) : next ? (
                          <div>
                            <span className="badge text-bg-warning me-2">Próximo lote</span>
                            {next.name} — {fmtBRL(next.priceBRL)}
                          </div>
                        ) : (
                          <div className="text-muted">Nenhum lote vigente.</div>
                        )}
                      </div>
                    ) : (
                      <div className="small mt-2 px-2 py-1 rounded bg-warning-subtle text-warning-emphasis">
                        Adicione <strong>lotes</strong> para abrir valores/prazos.
                      </div>
                    )}
                  </div>
                  <span className={`badge rounded-pill ${b.cls}`}>{b.text}</span>
                </div>

                <p className="mt-2 mb-3">{(e.description || '—').slice(0, 100)}</p>

                <div className="d-flex gap-2 mt-auto">
                  <Link to={`/events/${e.id}`} className="btn btn-sm btn-danger">Editar</Link>
                  <Link to={`/registrations?event=${e.id}`} className="btn btn-sm btn-primary">Inscrições</Link>
                </div>
              </div>
            </div>
          );
        })}
        {!events.length && (
          <div className="text-muted">Nenhum evento encontrado.</div>
        )}
      </div>

      {/* ===== Inscritos recentes ===== */}
      <div className="d-flex align-items-center mb-2">
        <h5 className="mb-0">Inscritos recentes</h5>
        <Link to="/registrants" className="btn btn-sm btn-outline-light ms-auto">Ver todos</Link>
      </div>

      <div className="row g-3">
        {registrants.map(r => {
          // tenta diferentes campos comuns para data de nascimento
          const birth = r.birthDate ?? r.dateOfBirth ?? r.dob ?? null;
          const age = calcAge(birth);
          const name = fullName(r);

          return (
            <div className="col-sm-6 col-lg-4 col-xxl-3" key={r.id}>
              <div className="card h-100 p-3">
                <div className="d-flex align-items-start justify-content-between">
                  <h6 className="mb-1">{name}</h6>
                  {age != null && (
                    <span className="badge text-bg-info">{age} anos</span>
                  )}
                </div>

                <div className="small text-muted">
                  {r.address.city || 'Cidade não informada'}
                </div>

                <div className="small mt-2">
                  <span className="text-muted">Inscrito em: </span>
                  <strong>{fmtBRDate(r.createdAt)}</strong>
                </div>

                <div className="d-flex gap-2 mt-auto pt-3">
                  <Link to={`/registrants/${r.id}`} className="btn btn-sm btn-primary">Ver / Editar</Link>
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
  );
}
