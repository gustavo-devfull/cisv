// src/pages/Volunteers.jsx
import { useEffect, useMemo, useState } from 'react';
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

const ROLE_OPTIONS = [
  { value: 'event',    label: 'Ajudante de evento' },
  { value: 'planning', label: 'Ajudante de planejamento' },
  { value: 'admin',    label: 'Ajudante de administração' },
];

export default function Volunteers() {
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({ city: '', role: '' });
  const [form, setForm] = useState({ name: '', phone: '', email: '', city: '', roles: [] });

  useEffect(() => {
    const qy = query(collection(db, 'volunteers'), orderBy('createdAt','desc'));
    const unsub = onSnapshot(qy, s => setRows(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, 'volunteers'), {
      ...form,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setForm({ name: '', phone: '', email: '', city: '', roles: [] });
  };

  const removeVolunteer = async (id) => {
    if (!window.confirm('Excluir voluntário?')) return;
    await deleteDoc(doc(db, 'volunteers', id));
  };

  const toggleRole = (val) => {
    setForm(f => {
      const has = f.roles.includes(val);
      return { ...f, roles: has ? f.roles.filter(r => r !== val) : [...f.roles, val] };
    });
  };

  const filtered = useMemo(() => {
    return rows.filter(v => {
      const byCity = filters.city ? (v.city || '').toLowerCase().includes(filters.city.toLowerCase()) : true;
      const byRole = filters.role ? (v.roles || []).includes(filters.role) : true;
      return byCity && byRole;
    });
  }, [rows, filters]);

  return (
    <div className="container-fluid">
      <form className="card p-3 mb-3" onSubmit={create}>
        <h5 className="mb-3">Cadastrar voluntário</h5>
        <div className="row g-2">
          <div className="col-md-4">
            <label className="form-label">Nome</label>
            <input className="form-control" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />
          </div>
          <div className="col-md-3">
            <label className="form-label">Celular</label>
            <input className="form-control" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} />
          </div>
          <div className="col-md-3">
            <label className="form-label">E-mail</label>
            <input type="email" className="form-control" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
          </div>
          <div className="col-md-2">
            <label className="form-label">Cidade</label>
            <input className="form-control" value={form.city} onChange={e=>setForm({...form, city:e.target.value})} />
          </div>
        </div>

        <div className="mt-3">
          <label className="form-label d-block">Funções</label>
          <div className="d-flex flex-wrap gap-3">
            {ROLE_OPTIONS.map(opt => (
              <div className="form-check" key={opt.value}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`role-${opt.value}`}
                  checked={(form.roles || []).includes(opt.value)}
                  onChange={()=>toggleRole(opt.value)}
                />
                <label className="form-check-label" htmlFor={`role-${opt.value}`}>{opt.label}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 d-flex justify-content-end">
          <button className="btn btn-primary">Salvar voluntário</button>
        </div>
      </form>

      <div className="card p-3 mb-3">
        <div className="row g-2 align-items-end">
          <div className="col-md-4">
            <label className="form-label">Filtrar por cidade</label>
            <input className="form-control" value={filters.city} onChange={e=>setFilters({...filters, city:e.target.value})} placeholder="Ex.: São Paulo" />
          </div>
          <div className="col-md-3">
            <label className="form-label">Filtrar por função</label>
            <select className="form-select" value={filters.role} onChange={e=>setFilters({...filters, role:e.target.value})}>
              <option value="">Todas</option>
              {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="table-responsive card p-0">
        <table className="table table-hover table-dark mb-0">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Contato</th>
              <th>Cidade</th>
              <th>Funções</th>
              <th className="text-end">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(v => (
              <tr key={v.id}>
                <td>{v.name}</td>
                <td>
                  {v.phone && <div>{v.phone}</div>}
                  {v.email && <div>{v.email}</div>}
                </td>
                <td>{v.city || '—'}</td>
                <td>
                  {(v.roles || []).length
                    ? (v.roles || []).map(r => ROLE_OPTIONS.find(o => o.value === r)?.label || r).join(', ')
                    : '—'}
                </td>
                <td className="text-end">
                  <button className="btn btn-sm btn-danger" onClick={()=>removeVolunteer(v.id)}>Excluir</button>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan="5" className="text-muted">Nenhum voluntário encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
