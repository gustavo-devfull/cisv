// src/pages/Events.jsx
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';

const TIPOS = [
  { value: 'Village',      label: 'Village' },
  { value: 'StepUp',       label: 'Step Up' },
  { value: 'Interchange',  label: 'Intercâmbio' },
  { value: 'YouthMeeting', label: 'Youth Meeting' },
  { value: 'SeminarCamp',  label: 'Seminar Camp' },
  { value: 'IPP',          label: 'IPP' },
  { value: 'Mosaic',       label: 'Mosaic' },
  { value: 'JB',           label: 'JB' },
];

const norm = (s) =>
  (s ?? '')
    .toString()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s|_/g, '');

const labelFromValue = (val) => TIPOS.find(t => t.value === val)?.label ?? val;

// status → badge
const statusBadge = (status) => {
  const map = {
    open:     { text: "Inscrições Abertas", cls: "bg-primary-subtle text-primary-emphasis" },
    draft:    { text: "Rascunho",            cls: "bg-secondary-subtle text-secondary-emphasis" },
    closed:   { text: "Encerrado",           cls: "bg-dark-subtle text-dark-emphasis" },
    archived: { text: "Arquivado",           cls: "bg-dark-subtle text-dark-emphasis" }
  };
  return map[status] || { text: String(status || "—"), cls: "bg-secondary-subtle text-secondary-emphasis" };
};

/** Helpers */
const fmtBRDate = (val) => {
  if (!val) return '—';
  const s = String(val);
  const iso = s.length >= 10 ? s.slice(0,10) : s; // YYYY-MM-DD
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return s;
  return `${d}/${m}/${y}`;
};
const fmtBRL = (n) => (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const todayISO = () => new Date().toISOString().slice(0,10);
const isInRange = (iso, start, end) => start && end && start <= iso && iso <= end;
const getCurrentLot = (lots = [], today = todayISO()) => lots.find(l => isInRange(today, l.startDate, l.endDate));
const getNextLot = (lots = [], today = todayISO()) =>
  [...lots].filter(l => l.startDate && l.startDate > today).sort((a,b) => a.startDate.localeCompare(b.startDate))[0];

export default function Events() {
  const [rows, setRows] = useState([]);
  const [qText, setQ] = useState('');
  const [tipo, setTipo] = useState('');

  useEffect(() => {
    const qy = query(collection(db, 'events'), orderBy('startDate', 'desc'));
    const unsub = onSnapshot(qy, (snap) => setRows(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const sel = norm(tipo);
    const selLabel = norm(labelFromValue(tipo));
    return rows.filter(e => {
      const txt = (qText || '').toLowerCase();
      const matchesText =
        !txt ||
        (e.title || '').toLowerCase().includes(txt) ||
        (e.description || '').toLowerCase().includes(txt);
      if (!tipo) return matchesText;
      const evType = norm(e.type);
      const matchesType = evType === sel || evType === selLabel;
      return matchesText && matchesType;
    });
  }, [rows, qText, tipo]);

  const displayType = (eType) => {
    const t = TIPOS.find(t => norm(t.value) === norm(eType) || norm(t.label) === norm(eType));
    return t?.label ?? eType ?? '—';
  };

  return (
    <div className="container-fluid">
      <div className="d-flex align-items-end gap-2 mb-3">
        <div className="flex-grow-1">
          <label className="form-label">Buscar</label>
          <input
            className="form-control"
            placeholder="Título, descrição..."
            value={qText}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div style={{ minWidth: 220 }}>
          <label className="form-label">Tipo</label>
          <select
            className="form-select"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="">Todos</option>
            {TIPOS.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <Link to="/events/new" className="btn btn-primary">Novo Evento</Link>
      </div>

      <div className="row g-3">
        {filtered.map(e => {
          const b = statusBadge(e.status);
          const lots = Array.isArray(e.registrationLots) ? e.registrationLots : [];
          const hasLots = lots.length > 0;
          const current = hasLots ? getCurrentLot(lots) : null;
          const next = hasLots && !current ? getNextLot(lots) : null;

          return (
            <div className="col-md-6 col-xl-4" key={e.id}>
              <div className="card h-100 p-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="small text-muted">{displayType(e.type)}</div>
                    <h5 className="mb-1">
                      {e.title}{' '}
                      {/* 🆕 Badge “Sem lotes” ao lado do título quando não houver lotes */}
                      {!hasLots && <span className="badge text-bg-secondary align-middle ms-1">Sem lotes</span>}
                    </h5>

                    {/* Datas do evento (BR) */}
                    <div className="small text-muted">
                      {fmtBRDate(e.startDate)} → {fmtBRDate(e.endDate)}
                    </div>

                    {/* Local (se houver) */}
                    {e.location && <div className="small text-muted">📍 {e.location}</div>}

                    {/* Lotes de inscrição */}
                    {hasLots ? (
                      <div className="mt-2">
                        {current ? (
                          <div className="small">
                            <span className="badge text-bg-success me-2">Lote atual</span>
                            <strong>{current.name}</strong> — {fmtBRL(current.priceBRL)}
                            {' '}· {fmtBRDate(current.startDate)}–{fmtBRDate(current.endDate)}
                          </div>
                        ) : next ? (
                          <div className="small">
                            <span className="badge text-bg-warning me-2">Próximo lote</span>
                            <strong>{next.name}</strong> — {fmtBRL(next.priceBRL)}
                            {' '}· {fmtBRDate(next.startDate)}–{fmtBRDate(next.endDate)}
                          </div>
                        ) : (
                          <div className="small text-muted">Nenhum lote vigente.</div>
                        )}

                        {/* Linha compacta com todos os lotes */}
                        <div className="small mt-1">
                          {lots.map((l, i) => (
                            <span key={i} className="me-2">
                              {l.name}: {fmtBRL(l.priceBRL)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* 🆕 Aviso discreto quando não há lotes */
                      <div className="small mt-2 px-2 py-1 rounded bg-warning-subtle text-warning-emphasis">
                        Adicione <strong>lotes de inscrição</strong> para abrir e comunicar valores e prazos.
                      </div>
                    )}
                  </div>

                  <span className={`badge rounded-pill ${b.cls}`}>{b.text}</span>
                </div>

                <p className="mt-2 mb-3">{(e.description || '—').slice(0, 120)}</p>

                <div className="d-flex gap-2 mt-auto">
                  <Link to={`/events/${e.id}`} className="btn btn-sm btn-danger">Editar</Link>
                  <Link to={`/registrations?event=${e.id}`} className="btn btn-sm btn-primary">
                    Gerenciar inscrições
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
        {!filtered.length && (
          <div className="text-muted">Nenhum evento encontrado.</div>
        )}
      </div>
    </div>
  );
}
