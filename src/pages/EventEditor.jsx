// src/pages/EventEditor.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  collection, addDoc, doc, getDoc, setDoc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import LotsEditor from '../components/LotsEditor';

const TIPOS = [
  { value: 'Village', label: 'Village' },
  { value: 'StepUp', label: 'Step Up' },
  { value: 'Interchange', label: 'Intercâmbio' },
  { value: 'YouthMeeting', label: 'Youth Meeting' },
  { value: 'SeminarCamp', label: 'Seminar Camp' },
  { value: 'IPP', label: 'IPP' },
  { value: 'Mosaic', label: 'Mosaic' },
  { value: 'JB', label: 'JB' },
];

const STATUS = [
  { value: 'draft', label: 'Rascunho' },
  { value: 'open', label: 'Inscrições Abertas' },
  { value: 'closed', label: 'Encerrado' },
  { value: 'archived', label: 'Arquivado' },
];

export default function EventEditor() {
  const { id } = useParams();           // 'new' ou um id real
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: '',
    type: TIPOS[0].value,
    startDate: '',
    endDate: '',
    location: '',
    status: 'draft',
    description: '',
    registrationLots: [],
  });

  useEffect(() => {
    const load = async () => {
      if (id && id !== 'new') {
        const snap = await getDoc(doc(db, 'events', id));
        if (snap.exists()) {
          const data = snap.data();
          setForm({
            title: data.title || '',
            type: data.type || TIPOS[0].value,
            startDate: (data.startDate || '').slice(0,10),
            endDate: (data.endDate || '').slice(0,10),
            location: data.location || '',
            status: data.status || 'draft',
            description: data.description || '',
            registrationLots: Array.isArray(data.registrationLots) ? data.registrationLots : [],
          });
        }
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const onChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const onSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      // Se preferir Timestamp, converta aqui
      // startDate: Timestamp.fromDate(new Date(form.startDate)),
      // endDate: Timestamp.fromDate(new Date(form.endDate)),
      updatedAt: serverTimestamp(),
    };

    if (id === 'new' || !id) {
      await addDoc(collection(db, 'events'), {
        ...payload,
        createdAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, 'events', id), payload, { merge: true });
    }

    navigate('/events');
  };

  if (loading) return <div className="container-fluid">Carregando…</div>;

  return (
    <div className="container-fluid">
      <form className="card p-3" onSubmit={onSubmit}>
        <div className="d-flex align-items-start gap-2 mb-3">
          <h5 className="mb-0">{id === 'new' ? 'Novo Evento' : 'Editar Evento'}</h5>
          <Link to="/events" className="btn btn-sm btn-outline-light ms-auto">Voltar</Link>
        </div>

        <div className="row g-2">
          <div className="col-md-6">
            <label className="form-label">Título</label>
            <input
              className="form-control"
              value={form.title}
              onChange={e=>onChange('title', e.target.value)}
              required
            />
          </div>

          <div className="col-md-3">
            <label className="form-label">Tipo</label>
            <select
              className="form-select"
              value={form.type}
              onChange={e=>onChange('type', e.target.value)}
            >
              {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div className="col-md-3">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={form.status}
              onChange={e=>onChange('status', e.target.value)}
            >
              {STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div className="col-md-3">
            <label className="form-label">Início</label>
            <input
              type="date"
              className="form-control"
              value={form.startDate}
              onChange={e=>onChange('startDate', e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <label className="form-label">Fim</label>
            <input
              type="date"
              className="form-control"
              value={form.endDate}
              onChange={e=>onChange('endDate', e.target.value)}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Local do evento</label>
            <input
              className="form-control"
              value={form.location}
              onChange={e=>onChange('location', e.target.value)}
              placeholder="Ex.: Rua X, 123 — Cidade/UF"
            />
          </div>

          <div className="col-12">
            <label className="form-label">Descrição</label>
            <textarea
              rows={4}
              className="form-control"
              value={form.description}
              onChange={e=>onChange('description', e.target.value)}
            />
          </div>
        </div>

        <div className="mt-3">
          <LotsEditor
            value={form.registrationLots}
            onChange={(lots)=>onChange('registrationLots', lots)}
          />
        </div>

        <div className="d-flex justify-content-end gap-2 mt-3">
          <Link to="/events" className="btn btn-outline-light">Cancelar</Link>
          <button className="btn btn-primary" type="submit">
            {id === 'new' ? 'Criar evento' : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}
