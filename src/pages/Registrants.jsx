import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';

export default function Registrants() {
  const [rows, setRows] = useState([]);
  const [qText, setQ] = useState('');

  useEffect(() => {
    const qy = query(collection(db, 'registrants'), orderBy('lastName'));
    const unsub = onSnapshot(qy, (snap) => setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  const filtered = useMemo(() => rows.filter(p => {
    const full = `${p.firstName||''} ${p.lastName||''}`.toLowerCase();
    return qText ? (full.includes(qText.toLowerCase()) || (p.email||'').toLowerCase().includes(qText.toLowerCase())) : true;
  }), [rows, qText]);

  return (
    <div className="container-fluid">
      <div className="d-flex align-items-end gap-2 mb-3">
        <div className="flex-grow-1">
          <label className="form-label">Buscar</label>
          <input className="form-control" placeholder="Nome ou e-mail..." value={qText} onChange={e=>setQ(e.target.value)} />
        </div>
        <Link to="/registrants/new" className="btn btn-primary">Novo Inscrito</Link>
      </div>

      <div className="table-responsive card p-0">
        <table className="table table-hover mb-0">
          <thead>
            <tr>
              <th>Nome</th><th>E-mail</th><th>Telefone</th><th>Atualizado</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td>{p.firstName} {p.lastName}</td>
                <td>{p.email}</td>
                <td>{p.phone}</td>
                <td>{p.updatedAt?.toDate ? p.updatedAt.toDate().toLocaleDateString() : '-'}</td>
                <td className="text-end">
                  <Link className="btn btn-sm btn-outline-light" to={`/registrants/${p.id}`}>Editar</Link>
                </td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan="5" className="text-muted">Nenhum inscrito encontrado.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
