
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db } from '../firebase';

export default function RegistrantForm() {
  const { id } = useParams();
  const isNew = id === 'new';
  const nav = useNavigate();
  const { register, handleSubmit, reset } = useForm();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    (async () => {
      if (!isNew) {
        const snap = await getDoc(doc(db, 'registrants', id));
        if (snap.exists()) reset(snap.data());
        const q = query(collection(db, 'registrations'), where('registrantId', '==', `registrants/${id}`), orderBy('createdAt','desc'));
        const unsub = onSnapshot(q, (s) => setHistory(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => unsub();
      }
    })();
  }, [id]);

  const onSubmit = async (data) => {
    const payload = { ...data, updatedAt: serverTimestamp() };
    if (isNew) {
      await addDoc(collection(db, 'registrants'), { ...payload, createdAt: serverTimestamp() });
    } else {
      await setDoc(doc(db, 'registrants', id), payload, { merge: true });
    }
    nav('/registrants');
  };

  return (
    <div className="container py-4">
      <div className="row g-4">
        <div className="col-lg-8">
          <h1 className="h4 mb-3">{isNew ? 'Novo Inscrito' : 'Editar Inscrito'}</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="card p-4 shadow-sm">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Nome</label>
                <input className="form-control" {...register('firstName', { required: true })} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Sobrenome</label>
                <input className="form-control" {...register('lastName', { required: true })} />
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
            <div className="d-flex gap-2 mt-4">
              <button className="btn btn-primary" type="submit">Salvar</button>
              <Link to="/registrants" className="btn btn-outline-secondary">Cancelar</Link>
            </div>
          </form>
        </div>
        <div className="col-lg-4">
          {!isNew && (
            <div className="card shadow-sm">
              <div className="card-body">
                <h6 className="text-muted">Eventos já frequentados</h6>
                <ul className="list-group list-group-flush">
                  {history.map(h => (
                    <li key={h.id} className="list-group-item">
                      <div className="fw-semibold">{h.role} — {h.status}</div>
                      <small className="text-muted">{h.eventId?.split('/')[1]}</small>
                    </li>
                  ))}
                  {!history.length && <li className="list-group-item">Nenhum registro</li>}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
