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

// status → badge classes
const statusBadge = (status) => {
  const map = {
    open:     { text: "Inscrições Abertas", icon: "event_available", cls: "text-primary" },
    draft:    { text: "Rascunho",            icon: "draft",           cls: "text-secondary" },
    closed:   { text: "Encerrado",           icon: "event_busy",      cls: "text-danger" },
    archived: { text: "Arquivado",           icon: "inventory_2",     cls: "text-muted" }
  };
  return map[status] || { text: String(status || "—"), icon: "help", cls: "text-secondary" };
};

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

          return (
            <div className="col-md-6 col-xl-4" key={e.id}>
              <div className="card h-100 p-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="small text-muted d-flex align-items-center">
                      <span className="material-symbols-outlined me-1">category</span>
                      {displayType(e.type)}
                    </div>
                    <h5 className="mb-1">
                      {e.title}{' '}
                      {!hasLots && <span className="badge text-bg-secondary align-middle ms-1">Sem lotes</span>}
                    </h5>

                    {/* Datas do evento */}
                    <div className="small text-muted d-flex align-items-center">
                      <span className="material-symbols-outlined me-1">calendar_month</span>
                      <span><strong>{fmtBRDate(e.startDate)}</strong> → <strong>{fmtBRDate(e.endDate)}</strong></span>
                    </div>

                    {/* Local */}
                    {e.location && (
                      <div className="small text-muted d-flex align-items-center">
                        <span className="material-symbols-outlined me-1">location_on</span>
                        {e.location}
                      </div>
                    )}

                    {/* Lotes */}
                    {hasLots ? (
                      <div className="mt-3">
                        {/* Lote vigente em destaque */}
                        {current ? (
                          <div className="border rounded p-2 mb-2 shadow-sm">
                            <div className="d-flex align-items-center mb-1">
                              <span className="badge text-bg-success me-2">Lote vigente</span>
                              <strong>{current.name}</strong>
                            </div>
                            <div className="small">
                              <span className="material-symbols-outlined me-1 align-middle">sell</span>
                              {fmtBRL(current.priceBRL)}
                            </div>
                            <div className="small d-flex align-items-center">
                              <span className="material-symbols-outlined me-1">calendar_today</span>
                              <strong>{fmtBRDate(current.startDate)}</strong> – <strong>{fmtBRDate(current.endDate)}</strong>
                            </div>
                          </div>
                        ) : (
                          <div className="small text-muted mb-2 d-flex align-items-center">
                            <span className="material-symbols-outlined me-1">schedule</span>
                            Nenhum lote vigente no momento.
                          </div>
                        )}

                        {/* Demais lotes, um por linha */}
                        <div className="small">
                          {lots
                            .filter(l => !current || l.name !== current.name)
                            .map((l, idx) => (
                              <div key={idx} className="py-1 border-top">
                                <div className="d-flex align-items-center">
                                  <span className="material-symbols-outlined me-1">layers</span>
                                  <strong className="me-2">{l.name}</strong>
                                  <span className="text-muted">{fmtBRL(l.priceBRL)}</span>
                                </div>
                                <div className="text-muted d-flex align-items-center">
                                  <span className="material-symbols-outlined me-1">calendar_today</span>
                                  {fmtBRDate(l.startDate)} – {fmtBRDate(l.endDate)}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ) : (
                      <div className="small mt-2 px-2 py-1 rounded bg-warning-subtle text-warning-emphasis d-flex align-items-center">
                        <span className="material-symbols-outlined me-1">warning</span>
                        Adicione <strong>lotes de inscrição</strong> para abrir e comunicar valores e prazos.
                      </div>
                    )}
                  </div>

                  <span className={`d-flex align-items-center ${b.cls}`}>
  <span className="material-symbols-outlined me-1">{b.icon}</span>
  {b.text}
</span>

                </div>

                <p className="mt-2 mb-3">{(e.description || '—').slice(0, 120)}</p>

                <div className="d-flex gap-2 mt-auto">
                  <Link to={`/events/${e.id}`} className="btn btn-sm btn-danger">Editar</Link>
                  <Link to={`/registrations?event=${e.id}`} className="btn btn-sm btn-primary">Gerenciar inscrições</Link>
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
