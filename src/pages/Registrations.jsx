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

  // 🔻 REMOVIDO: atualização inline do status
  // const updateStatus = async (id, status) => {
  //   await setDoc(doc(db, 'registrations', id), { status, updatedAt: serverTimestamp() }, { merge: true });
  // };

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

  // abrir modal com dados atuais
  const openEdit = (r) => {
    setEditData({
      id: r.id,
      eventId: getDocId(r.eventId), // só o ID
      role: r.role,
      status: r.status
    });
    setEditOpen(true);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    await setDoc(
      doc(db, 'registrations', editData.id),
      {
        eventId: `events/${editData.eventId}`,
        role: editData.role,
        status: editData.status,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    setEditOpen(false);
  };

  return (
    <div className="container-fluid">
      {/* criar vínculo */}
      <form className="card p-3 mb-3" onSubmit={create}>
        <div className="row g-2 align-items-end">
          <div className="col-md-4">
            <label className="form-label">Evento</label>
            <select
              className="form-select"
              value={form.eventId}
              onChange={e=>setForm({...form, eventId:e.target.value})}
              required
            >
              <option value="">Selecione...</option>
              {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label">Inscrito</label>
            <select
              className="form-select"
              value={form.registrantId}
              onChange={e=>setForm({...form, registrantId:e.target.value})}
              required
            >
              <option value="">Selecione...</option>
              {people.map(p => (
                <option key={p.id} value={p.id}>
                  {[p.firstName, p.lastName].filter(Boolean).join(' ')}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label">Papel</label>
            <select
              className="form-select"
              value={form.role}
              onChange={e=>setForm({...form, role:e.target.value})}
            >
              {PAPEIS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <button className="btn btn-primary w-100" type="submit">Vincular</button>
          </div>
        </div>
      </form>

      {/* filtros */}
      <div className="card p-3 mb-3">
        <div className="row g-2">
          <div className="col-md-5">
            <label className="form-label">Filtrar por Evento</label>
            <select
              className="form-select"
              value={filters.eventId}
              onChange={e=>setFilters({...filters, eventId:e.target.value})}
            >
              <option value="">Todos</option>
              {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={filters.status}
              onChange={e=>setFilters({...filters, status:e.target.value})}
            >
              <option value="">Todos</option>
              {STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="col-md-4 d-flex align-items-end">
            <div className="ms-auto small text-muted">
              {Object.entries(summary).map(([k,v]) =>
                <span key={k} className="me-3">{statusLabel(k)}: <strong>{v}</strong></span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* tabela */}
      <div className="table-responsive card p-0">
        <table className="table table-hover table-dark mb-0">
          <thead>
            <tr>
              <th>Evento</th>
              <th>Inscrito</th>
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
              const ev  = eventsById[evId];
              const per = peopleById[regId];
              const registrantName = per ? [per.firstName, per.lastName].filter(Boolean).join(' ') : regId || '—';
              const eventTitle     = ev ? ev.title : evId || '—';
              return (
                <tr key={r.id}>
                  <td>{eventTitle}</td>
                  <td>{registrantName}</td>
                  <td>{roleLabel(r.role)}</td>

                  {/* 🔒 Somente leitura: badge em vez de <select> */}
                  <td style={{minWidth: 160}}>
                    <span className={`badge text-bg-${statusColor(r.status)}`}>
                      {statusLabel(r.status)}
                    </span>
                  </td>

                  <td>{r.updatedAt?.toDate ? r.updatedAt.toDate().toLocaleDateString() : '-'}</td>
                  <td className="text-end" style={{minWidth: 220}}>
                    <button
                      className="btn btn-sm btn-primary me-2"
                      onClick={() => openEdit(r)}
                    >
                      Gerenciar
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => removeRegistration(r.id)}
                      title="Excluir inscrição"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr>
                <td colSpan="6" className="text-muted">Nenhuma inscrição.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de edição (Status, Evento, Papel) */}
      {editOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ background: 'rgba(0,0,0,.45)', zIndex: 1050 }}
          onClick={() => setEditOpen(false)}
        >
          <div
            className="card p-3"
            style={{
              width: 'min(520px, 96vw)',
              margin: '10vh auto 0',
              background: 'var(--connect-panel)',
              color: 'var(--connect-text)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h5 className="mb-3">Gerenciar inscrição</h5>
            <form onSubmit={saveEdit}>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Evento</label>
                  <select
                    className="form-select"
                    value={editData.eventId}
                    onChange={(e)=>setEditData({...editData, eventId: e.target.value})}
                    required
                  >
                    <option value="">Selecione...</option>
                    {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Papel</label>
                  <select
                    className="form-select"
                    value={editData.role}
                    onChange={(e)=>setEditData({...editData, role: e.target.value})}
                  >
                    {PAPEIS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={editData.status}
                    onChange={(e)=>setEditData({...editData, status: e.target.value})}
                  >
                    {STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-outline-light" onClick={()=>setEditOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvar alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
