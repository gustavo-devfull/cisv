
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';

export default function RegistrantsList() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'registrants'), orderBy('lastName'));
    const unsub = onSnapshot(q, (snap) => setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4">Inscritos</h1>
        <Link to="/registrants/new" className="btn btn-primary">Novo Inscrito</Link>
      </div>
      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>Nome</th><th>E-mail</th><th>Telefone</th><th>Atualizado</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>{p.firstName} {p.lastName}</td>
                <td>{p.email}</td>
                <td>{p.phone}</td>
                <td>{p.updatedAt?.toDate ? p.updatedAt.toDate().toLocaleDateString() : '-'}</td>
                <td className="text-end">
                  <Link className="btn btn-sm btn-outline-secondary me-2" to={`/registrants/${p.id}`}>Editar</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
