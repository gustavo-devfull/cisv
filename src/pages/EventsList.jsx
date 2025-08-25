import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';

const fmt = (s) => (s ?? '').toString();
const fmtBRDate = (val) => {
  if (!val) return '—';
  const iso = fmt(val).slice(0,10);
  const [y,m,d] = iso.split('-');
  return (y && m && d) ? `${d}/${m}/${y}` : fmt(val);
};

export default function EventsList() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('startDate', 'desc'));
    const unsub = onSnapshot(q, (snap) => setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h5 d-flex align-items-center gap-1">
          <span className="material-symbols-outlined">event</span>
          Eventos
        </h1>
        <Link to="/events/new" className="btn btn-primary">Novo Evento</Link>
      </div>
      <div className="table-responsive card p-0">
        <table className="table table-striped table-hover mb-0">
          <thead>
            <tr>
              <th>Título</th>
              <th>Tipo</th>
              <th><span className="material-symbols-outlined align-middle me-1">calendar_month</span>Período</th>
              <th>Status</th>
              <th className="text-end">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id}>
                <td>{e.title || '—'}</td>
                <td>{e.type || '—'}</td>
                <td>{fmtBRDate(e.startDate)} → {fmtBRDate(e.endDate)}</td>
                <td><span className="badge bg-secondary">{e.status || '—'}</span></td>
                <td className="text-end">
                  <Link className="btn btn-sm btn-outline-secondary" to={`/events/${e.id}`}>Editar</Link>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan="5" className="text-muted">Nenhum evento encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
