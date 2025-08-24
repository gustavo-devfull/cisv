
import { useEffect, useState } from 'react';
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db } from '../firebase';

const ROLES = ['participant','leader','JC','chaperone','staff'];
const STATUSES = ['applied','approved','waitlist','rejected','canceled','completed'];

export default function Registrations() {
  const [events, setEvents] = useState([]);
  const [people, setPeople] = useState([]);
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({ eventId: '', status: '' });

  useEffect(() => {
    const unsubE = onSnapshot(query(collection(db, 'events'), orderBy('startDate','desc')), (s) => setEvents(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubP = onSnapshot(query(collection(db, 'registrants'), orderBy('lastName')), (s) => setPeople(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubE(); unsubP(); };
  }, []);

  useEffect(() => {
    let q = query(collection(db, 'registrations'), orderBy('createdAt','desc'));
    if (filters.eventId) q = query(q, where('eventId','==', `events/${filters.eventId}`));
    if (filters.status) q = query(q, where('status','==', filters.status));
    const unsub = onSnapshot(q, (s) => setRows(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [filters]);

  const [form, setForm] = useState({ eventId: '', registrantId: '', role: 'participant', status: 'applied' });

  const create = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      eventId: `events/${form.eventId}`,
      registrantId: `registrants/${form.registrantId}`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await addDoc(collection(db, 'registrations'), payload);
    setForm({ eventId: '', registrantId: '', role: 'participant', status: 'applied' });
  };

  const updateStatus = async (id, status) => {
    await setDoc(doc(db, 'registrations', id), { status, updatedAt: serverTimestamp() }, { merge: true });
  };

  return (
    <div className="container py-4">
      <h1 className="h4 mb-3">Inscrições</h1>

      <form className="card p-3 mb-4" onSubmit={create}>
        <div className="row g-2 align-items-end">
          <div className="col-md-4">
            <label className="form-label">Evento</label>
            <select className="form-select" value={form.eventId} onChange={(e)=>setForm({...form, eventId:e.target.value})} required>
              <option value="">Selecione...</option>
              {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label">Inscrito</label>
            <select className="form-select" value={form.registrantId} onChange={(e)=>setForm({...form, registrantId:e.target.value})} required>
              <option value="">Selecione...</option>
              {people.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label">Papel</label>
            <select className="form-select" value={form.role} onChange={(e)=>setForm({...form, role:e.target.value})}>
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <button className="btn btn-primary w-100" type="submit">Vincular</button>
          </div>
        </div>
      </form>

      <div className="card p-3 mb-3">
        <div className="row g-2">
          <div className="col-md-6">
            <label className="form-label">Filtrar por Evento</label>
            <select className="form-select" value={filters.eventId} onChange={(e)=>setFilters({...filters, eventId:e.target.value})}>
              <option value="">Todos</option>
              {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Filtrar por Status</label>
            <select className="form-select" value={filters.status} onChange={(e)=>setFilters({...filters, status:e.target.value})}>
              <option value="">Todos</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>Evento</th><th>Inscrito</th><th>Papel</th><th>Status</th><th>Atualizado</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td>{r.eventId?.split('/')[1]}</td>
                <td>{r.registrantId?.split('/')[1]}</td>
                <td>{r.role}</td>
                <td>
                  <select className="form-select form-select-sm" value={r.status} onChange={(e)=>updateStatus(r.id, e.target.value)}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td>{r.updatedAt?.toDate ? r.updatedAt.toDate().toLocaleDateString() : '-'}</td>
                <td></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
