// src/pages/RegistrantForm.jsx
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  addDoc, collection, doc, getDoc, onSnapshot, orderBy, query,
  serverTimestamp, setDoc, where
} from 'firebase/firestore';
import { db } from '../firebase';

const ROLE_LABEL = {
  participant: 'Participante', leader: 'Líder', JC: 'JC', chaperone: 'Acompanhante', staff: 'Staff'
};
const STATUS_LABEL = {
  pending: 'Pendente', applied: 'Inscrito', approved: 'Aprovado', waitlist: 'Lista de Espera',
  rejected: 'Rejeitado', canceled: 'Cancelado', completed: 'Concluído'
};

const fmtDate = (ts) => {
  try { return ts?.toDate ? ts.toDate().toLocaleDateString('pt-BR') : '—'; } catch { return '—'; }
};

export default function RegistrantForm() {
  const { id } = useParams();
  const isNew = id === 'new';
  const nav = useNavigate();
  const openQuestionnaireAfterSave = useRef(false);

  const { register, handleSubmit, reset } = useForm();
  const [history, setHistory] = useState([]);
  const [eventsById, setEventsById] = useState({});

  useEffect(() => {
    if (isNew) return;
    let unsub = () => {};
    (async () => {
      const snap = await getDoc(doc(db, 'registrants', id));
      if (snap.exists()) reset(snap.data());
      const qy = query(
        collection(db, 'registrations'),
        where('registrantId', '==', `registrants/${id}`),
        orderBy('createdAt', 'desc')
      );
      unsub = onSnapshot(qy, (s) => setHistory(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
    })();
    return () => unsub();
  }, [id, isNew, reset]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'events'), (s) => {
      const map = Object.fromEntries(s.docs.map((d) => [d.id, { id: d.id, ...d.data() }]));
      setEventsById(map);
    });
    return () => unsub();
  }, []);

  const onSubmit = async (data) => {
    const payload = { ...data, updatedAt: serverTimestamp() };
    if (isNew) {
      const ref = await addDoc(collection(db, 'registrants'), { ...payload, createdAt: serverTimestamp() });
      if (openQuestionnaireAfterSave.current) {
        nav(`/registrants/${ref.id}/questionnaire`);
      } else {
        nav('/registrants');
      }
    } else {
      await setDoc(doc(db, 'registrants', id), payload, { merge: true });
      if (openQuestionnaireAfterSave.current) {
        nav(`/registrants/${id}/questionnaire`);
      } else {
        nav('/registrants');
      }
    }
  };

  const eventTitleFromPath = (path) => {
    const evId = path ? String(path).split('/')[1] : '';
    return eventsById[evId]?.title || evId || '—';
  };

  return (
    <div className="container-fluid">
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card p-4 shadow-sm">
            <h1 className="h5 mb-3">{isNew ? 'Novo Inscrito' : 'Editar Inscrito'}</h1>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Nome</label>
                  <input className="form-control" {...register('firstName')} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Sobrenome</label>
                  <input className="form-control" {...register('lastName')} />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Nascimento</label>
                  <input type="date" className="form-control" {...register('birthDate')} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Telefone</label>
                  <input className="form-control" {...register('phone')} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">E-mail</label>
                  <input type="email" className="form-control" {...register('email')} />
                </div>

                <div className="col-12">
                  <label className="form-label">Endereço</label>
                  <input className="form-control" {...register('address.street')} placeholder="Rua, número" />
                </div>
                <div className="col-md-4">
                  <input className="form-control" {...register('address.city')} placeholder="Cidade" />
                </div>
                <div className="col-md-4">
                  <input className="form-control" {...register('address.state')} placeholder="Estado" />
                </div>
                <div className="col-md-4">
                  <input className="form-control" {...register('address.country')} placeholder="País" />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Responsável</label>
                  <input className="form-control" {...register('guardian.name')} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Contato do Responsável</label>
                  <input className="form-control" {...register('guardian.phone')} />
                </div>

                <div className="col-12">
                  <label className="form-label">Observações</label>
                  <textarea rows="3" className="form-control" {...register('notes')} />
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2 mt-4">
                <button className="btn btn-primary" type="submit"
                  onClick={() => (openQuestionnaireAfterSave.current = false)}>
                  Salvar
                </button>

                {/* Salvar e já abrir o questionário */}
                <button className="btn btn-outline-primary" type="submit"
                  onClick={() => (openQuestionnaireAfterSave.current = true)}>
                  Salvar e abrir formulário complementar
                </button>

                <Link to="/registrants" className="btn btn-outline-secondary">Cancelar</Link>

                {/* Atalho direto quando já existe ID */}
                {!isNew && (
                  <Link to={`/registrants/${id}/questionnaire`} className="btn btn-secondary ms-auto">
                    Formulário complementar
                  </Link>
                )}
              </div>
            </form>
          </div>
        </div>

        <div className="col-lg-4">
          {!isNew && (
            <div className="card shadow-sm">
              <div className="card-body">
                <h6 className="text-muted">Eventos já frequentados</h6>
                <ul className="list-group list-group-flush">
                  {history.map((h) => (
                    <li key={h.id} className="list-group-item bg-transparent">
                      <div className="fw-semibold">
                        {ROLE_LABEL[h.role] || h.role || '—'} — {STATUS_LABEL[h.status] || h.status || '—'}
                      </div>
                      <small className="text-muted">
                        {eventTitleFromPath(h.eventId)}
                        {h.updatedAt ? ` • Atualizado: ${fmtDate(h.updatedAt)}` : ''}
                      </small>
                    </li>
                  ))}
                  {!history.length && (
                    <li className="list-group-item bg-transparent text-muted">Nenhum registro</li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
