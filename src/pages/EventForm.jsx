
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const TYPES = ['Village','StepUp','Interchange','YouthMeeting','SeminarCamp','IPP','Mosaic','JB'];

export default function EventForm() {
  const { id } = useParams();
  const isNew = id === 'new';
  const nav = useNavigate();
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    (async () => {
      if (!isNew) {
        const snap = await getDoc(doc(db, 'events', id));
        if (snap.exists()) reset(snap.data());
      }
    })();
  }, [id]);

  const onSubmit = async (data) => {
    const payload = { ...data, capacity: Number(data.capacity || 0), updatedAt: serverTimestamp() };
    if (isNew) {
      await addDoc(collection(db, 'events'), { ...payload, createdAt: serverTimestamp(), status: data.status || 'draft' });
    } else {
      await setDoc(doc(db, 'events', id), payload, { merge: true });
    }
    nav('/events');
  };

  return (
    <div className="container py-4" style={{ maxWidth: 820 }}>
      <h1 className="h4 mb-3">{isNew ? 'Novo Evento' : 'Editar Evento'}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="card p-4 shadow-sm">
        <div className="row g-3">
          <div className="col-md-8">
            <label className="form-label">Título</label>
            <input className="form-control" {...register('title', { required: true })} />
          </div>
          <div className="col-md-4">
            <label className="form-label">Tipo</label>
            <select className="form-select" {...register('type', { required: true })}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label">Início</label>
            <input type="date" className="form-control" {...register('startDate', { required: true })} />
          </div>
          <div className="col-md-3">
            <label className="form-label">Fim</label>
            <input type="date" className="form-control" {...register('endDate', { required: true })} />
          </div>
          <div className="col-md-2">
            <label className="form-label">Ano</label>
            <input type="number" className="form-control" {...register('year', { valueAsNumber: true })} />
          </div>
          <div className="col-md-2">
            <label className="form-label">Capacidade</label>
            <input type="number" className="form-control" {...register('capacity', { valueAsNumber: true })} />
          </div>
          <div className="col-md-2">
            <label className="form-label">Status</label>
            <select className="form-select" {...register('status')}>
              <option>draft</option>
              <option>open</option>
              <option>closed</option>
              <option>archived</option>
            </select>
          </div>
          <div className="col-12">
            <label className="form-label">Descrição</label>
            <textarea rows="4" className="form-control" {...register('description')} />
          </div>
        </div>
        <div className="d-flex gap-2 mt-4">
          <button className="btn btn-primary" type="submit">Salvar</button>
        </div>
      </form>
    </div>
  );
}
