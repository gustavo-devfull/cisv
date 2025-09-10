
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-person-circle" viewBox="0 0 16 16">
        <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
        <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"/>
    </svg>
);

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
              <th></th><th>Nome</th><th>Nascimento</th><th>Telefone</th><th>Atualizado</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.form?.basic?.photoUrl ? 
                    <img src={p.form.basic.photoUrl} alt="Foto" className="rounded-circle" style={{ width: 32, height: 32, objectFit: 'cover' }} /> :
                    <UserIcon />
                  }
                </td>
                <td>{p.form?.basic?.firstName} {p.form?.basic?.lastName}</td>
                <td>{p.form?.basic?.birthDate}</td>
                <td>{p.form?.basic?.phone}</td>
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
