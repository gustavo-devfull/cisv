// src/pages/Registrations.jsx
import { useEffect, useMemo, useState } from 'react';
import {
  addDoc, collection, onSnapshot, orderBy, query, serverTimestamp,
  setDoc, where, doc, deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';

const PAPEIS = [
  { value: 'participant', label: 'Participante' },
  { value: 'leader', label: 'Líder' },
  { value: 'JC', label: 'JC' },
  { value: 'chaperone', label: 'Acompanhante' },
  { value: 'staff', label: 'Staff' },
];

const STATUS = [
  { value: 'applied',   label: 'Inscrito' },
  { value: 'approved',  label: 'Aprovado' },
  { value: 'waitlist',  label: 'Lista de Espera' },
  { value: 'rejected',  label: 'Rejeitado' },
  { value: 'canceled',  label: 'Cancelado' },
  { value: 'completed', label: 'Concluído' },
];

const statusLabel = (value) => STATUS.find(s => s.value === value)?.label ?? value;
const roleLabel   = (value) => PAPEIS.find(p => p.value === value)?.label ?? value;
const getDocId    = (path) => (path ? String(path).split('/')[1] : '');

// 🔸 Cor do badge por status (Bootstrap 5: text-bg-*)
const statusColor = (value) => {
  switch (value) {
    case 'approved':  return 'success';
    case 'applied':   return 'primary';
    case 'waitlist':  return 'warning';
    case 'rejected':  return 'danger';
    case 'canceled':  return 'secondary';
    case 'completed': return 'info';
    default:          return 'light';
  }
};

export default function Registrations() {
  const [events, setEvents] = useState([]);
  const [people, setPeople] = useState([]);
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({ eventId: '', status: '' });
  const [form, setForm] = useState({
    eventId: '',
    registrantId: '',
    role: PAPEIS[0].value,
    status: STATUS[0].value
  });

  // modal de edição
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({ id: '', eventId: '', role: PAPEIS[0].value, status: STATUS[0].value });

  useEffect(() => {
    const unsubE = onSnapshot(
      query(collection(db, 'events'), orderBy('startDate','desc')),
      s => setEvents(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const unsubP = onSnapshot(
      query(collection(db, 'registrants'), orderBy('lastName')),
      s => setPeople(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => { unsubE(); unsubP(); };
  }, []);

  useEffect(() => {
    let qy = query(collection(db, 'registrations'), orderBy('createdAt','desc'));
    if (filters.eventId) qy = query(qy, where('eventId','==', `events/${filters.eventId}`));
    if (filters.status)  qy = query(qy, where('status','==', filters.status));
    const unsub = onSnapshot(qy, s => setRows(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [filters]);

  const eventsById = useMemo(() => Object.fromEntries(events.map(e => [e.id, e])), [events]);
  const peopleById = useMemo(() => Object.fromEntries(people.map(p => [p.id, p])), [people]);

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
    setForm({
      eventId: '',
      registrantId: '',
      role: PAPEIS[0].value,
      status: STATUS[0].value
    });
  };

  const removeRegistration = async (id) => {
    const ok = window.confirm('Excluir esta inscrição? Esta ação não pode ser desfeita.');
    if (!ok) return;
    await deleteDoc(doc(db, 'registrations', id));
  };

  const eventQueryParam = new URLSearchParams(window.location.search).get('event');
  useEffect(() => {
    if (eventQueryParam) setFilters(prev => ({ ...prev, eventId: eventQueryParam }));
  }, [eventQueryParam]);

  const summary = useMemo(() => rows.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {}), [rows]);

  const openEdit = (r) => {
    setEditData({ id: r.id, eventId: getDocId(r.eventId), role: r.role, status: r.status });
    setEditOpen(true);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    await setDoc(doc(db, 'registrations', editData.id), {
      eventId: `events/${editData.eventId}`,
      role: editData.role,
      status: editData.status,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    setEditOpen(false);
  };

  return (
    <div className="container-fluid">
      <form className="card p-3 mb-3" onSubmit={create}>
        {/* ... form de criação ... */}
      </form>

      <div className="card p-3 mb-3">
        {/* ... filtros ... */}
      </div>

      <div className="table-responsive card p-0">
        <table className="table table-hover table-dark mb-0">
          <thead>
            <tr>
              <th>Inscrito</th>
              <th>Evento</th>
              <th>Papel</th>
              <th>Status</th>
              <th>Atualizado</th>
              <th className="text-end">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const evId = getDocId(r.eventId);
              const regId = getDocId(r.registrantId);
              const ev = eventsById[evId];
              const per = peopleById[regId];
              const registrantName = per ? [per.form?.basic?.firstName, per.form?.basic?.lastName].filter(Boolean).join(' ') : regId || '—';
              const eventTitle = ev ? ev.title : evId || '—';
              const photoUrl = per?.form?.basic?.photoUrl;
              return (
                <tr key={r.id}>
                  <td>
                    <div className="d-flex align-items-center">
                      {photoUrl && <img src={photoUrl} alt="Foto" className="rounded-circle me-2" style={{ width: 32, height: 32, objectFit: 'cover' }} />}
                      <span>{registrantName}</span>
                    </div>
                  </td>
                  <td>{eventTitle}</td>
                  <td>{roleLabel(r.role)}</td>
                  <td style={{minWidth: 160}}>
                    <span className={`badge text-bg-${statusColor(r.status)}`}>{statusLabel(r.status)}</span>
                  </td>
                  <td>{r.updatedAt?.toDate ? r.updatedAt.toDate().toLocaleDateString() : '-'}</td>
                  <td className="text-end" style={{minWidth: 220}}>
                    <button className="btn btn-sm btn-primary me-2" onClick={() => openEdit(r)}>Gerenciar</button>
                    <button className="btn btn-sm btn-danger" onClick={() => removeRegistration(r.id)} title="Excluir inscrição">Excluir</button>
                  </td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr><td colSpan="6" className="text-muted">Nenhuma inscrição.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editOpen && (
        <div className="position-fixed top-0 start-0 w-100 h-100" style={{ background: 'rgba(0,0,0,.45)', zIndex: 1050 }} onClick={() => setEditOpen(false)}>
          <div className="card p-3" style={{ width: 'min(520px, 96vw)', margin: '10vh auto 0', background: 'var(--connect-panel)', color: 'var(--connect-text)' }} onClick={(e) => e.stopPropagation()}>
            <h5 className="mb-3">Gerenciar inscrição</h5>
            <form onSubmit={saveEdit}>
              {/* ... form de edição ... */}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
