
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';

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
        <h1 className="h4">Eventos</h1>
        <Link to="/events/new" className="btn btn-primary">Novo Evento</Link>
      </div>
      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>Título</th><th>Tipo</th><th>Período</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id}>
                <td>{e.title}</td>
                <td>{e.type}</td>
                <td>{e.startDate} → {e.endDate}</td>
                <td><span className="badge bg-secondary">{e.status}</span></td>
                <td className="text-end">
                  <Link className="btn btn-sm btn-outline-secondary me-2" to={`/events/${e.id}`}>Editar</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
