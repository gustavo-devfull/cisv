// src/pages/RegistrantForm.jsx
import { useEffect, useRef, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { getDownloadURL, ref as storageRef, uploadBytesResumable } from 'firebase/storage';

const ROLE_LABEL = { participant: 'Participante', leader: 'Líder', JC: 'JC', chaperone: 'Acompanhante', staff: 'Staff' };
const STATUS_LABEL = { pending: 'Pendente', applied: 'Inscrito', approved: 'Aprovado', waitlist: 'Lista de Espera', rejected: 'Rejeitado', canceled: 'Cancelado', completed: 'Concluído' };
const fmtDate = (ts) => (ts?.toDate ? ts.toDate().toLocaleDateString('pt-BR') : '—');

// Componente de upload de foto (reutilizado)
const PhotoUpload = ({ photoUrl, setPhotoFile, uploadProgress }) => (
  <div>
    <label className="form-label">Foto</label>
    {photoUrl ? 
      <img src={photoUrl} alt="Foto do inscrito" className="img-thumbnail d-block mb-2" style={{ width: 150, height: 150, objectFit: 'cover' }} /> :
      <div className="border rounded bg-light d-flex justify-content-center align-items-center mb-2" style={{ width: 150, height: 150 }}>
        <small className="text-muted">Sem foto</small>
      </div>
    }
    <input type="file" className="form-control" accept="image/*" onChange={e => setPhotoFile(e.target.files[0])} />
    {uploadProgress > 0 && uploadProgress < 100 && (
      <div className="progress mt-2">
        <div className="progress-bar" style={{ width: `${uploadProgress}%` }}>{Math.round(uploadProgress)}%</div>
      </div>
    )}
  </div>
);

export default function RegistrantForm() {
  const { id } = useParams();
  const isNew = id === 'new';
  const nav = useNavigate();
  const openQuestionnaireAfterSave = useRef(false);

  // State para upload
  const [photoFile, setPhotoFile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: useMemo(() => ({ form: { basic: {} } }), [])
  });

  const [history, setHistory] = useState([]);
  const [eventsById, setEventsById] = useState({});

  useEffect(() => {
    if (isNew) return;
    let unsub = () => {};
    (async () => {
      const snap = await getDoc(doc(db, 'registrants', id));
      if (snap.exists()) {
        const data = snap.data();
        reset(data);
        setPhotoUrl(data.form?.basic?.photoUrl || "");
      }
      const qy = query(collection(db, 'registrations'), where('registrantId', '==', `registrants/${id}`), orderBy('createdAt', 'desc'));
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

  const handleUpload = (file, registrantId) => {
    return new Promise((resolve, reject) => {
      if (!file) return resolve(null);
      const fileRef = storageRef(storage, `registrants/${registrantId}/photo`);
      const uploadTask = uploadBytesResumable(fileRef, file);
      uploadTask.on('state_changed',
        (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
        (error) => { console.error("Upload error", error); reject("Falha ao enviar foto."); },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  const onSubmit = async (data) => {
    try {
      let registrantId = id;
      // Se for novo, precisamos salvar primeiro para ter um ID para o upload
      if (isNew) {
        const docRef = await addDoc(collection(db, 'registrants'), { form: data.form, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        registrantId = docRef.id;
      }

      const uploadedPhotoUrl = await handleUpload(photoFile, registrantId);
      if (uploadedPhotoUrl) {
        data.form.basic.photoUrl = uploadedPhotoUrl;
      }

      const payload = { ...data, updatedAt: serverTimestamp() };
      await setDoc(doc(db, 'registrants', registrantId), payload, { merge: true });

      if (openQuestionnaireAfterSave.current) {
        nav(`/registrants/${registrantId}/questionnaire`);
      } else {
        nav('/registrants');
      }
    } catch (e) {
      console.error(e);
      alert(typeof e === 'string' ? e : 'Falha ao salvar.');
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
                {/* Coluna da Foto */}
                <div className="col-md-4">
                  <PhotoUpload photoUrl={photoUrl} setPhotoFile={setPhotoFile} uploadProgress={uploadProgress} />
                </div>

                {/* Coluna dos Dados */}
                <div className="col-md-8">
                  <div className="row g-3">
                    <div className="col-md-6"><label className="form-label">Nome</label><input className="form-control" {...register('form.basic.firstName')} /></div>
                    <div className="col-md-6"><label className="form-label">Sobrenome</label><input className="form-control" {...register('form.basic.lastName')} /></div>
                    <div className="col-12"><label className="form-label">Nascimento</label><input type="date" className="form-control" {...register('form.basic.birthDate')} /></div>
                  </div>
                </div>

                <div className="col-md-6"><label className="form-label">Telefone</label><input className="form-control" {...register('form.basic.phone')} /></div>
                <div className="col-md-6"><label className="form-label">E-mail</label><input type="email" className="form-control" {...register('form.basic.email')} /></div>
                <div className="col-12"><label className="form-label">Endereço</label><input className="form-control" {...register('form.basic.address.street')} placeholder="Rua, número" /></div>
                <div className="col-md-4"><input className="form-control" {...register('form.basic.address.city')} placeholder="Cidade" /></div>
                <div className="col-md-4"><input className="form-control" {...register('form.basic.address.state')} placeholder="Estado" /></div>
                <div className="col-md-4"><input className="form-control" {...register('form.basic.address.country')} placeholder="País" /></div>
                <div className="col-md-6"><label className="form-label">Responsável</label><input className="form-control" {...register('form.basic.guardian.name')} /></div>
                <div className="col-md-6"><label className="form-label">Contato do Responsável</label><input className="form-control" {...register('form.basic.guardian.phone')} /></div>
                <div className="col-12"><label className="form-label">Observações</label><textarea rows="3" className="form-control" {...register('form.basic.notes')} /></div>
              </div>

              <div className="d-flex flex-wrap gap-2 mt-4">
                <button className="btn btn-primary" type="submit" disabled={isSubmitting} onClick={() => (openQuestionnaireAfterSave.current = false)}>{isSubmitting ? 'Salvando...': 'Salvar'}</button>
                <button className="btn btn-outline-primary" type="submit" disabled={isSubmitting} onClick={() => (openQuestionnaireAfterSave.current = true)}>{isSubmitting ? 'Salvando...': 'Salvar e abrir formulário complementar'}</button>
                <Link to="/registrants" className="btn btn-outline-secondary">Cancelar</Link>
                {!isNew && <Link to={`/registrants/${id}/questionnaire`} className="btn btn-secondary ms-auto">Formulário complementar</Link>}
              </div>
            </form>
          </div>
        </div>

        <div className="col-lg-4">
          {!isNew && (
            <div className="card shadow-sm"><div className="card-body">
              <h6 className="text-muted">Eventos já frequentados</h6>
              <ul className="list-group list-group-flush">
                {history.map((h) => (
                  <li key={h.id} className="list-group-item bg-transparent">
                    <div className="fw-semibold">{ROLE_LABEL[h.role] || h.role || '—'} — {STATUS_LABEL[h.status] || h.status || '—'}</div>
                    <small className="text-muted">{eventTitleFromPath(h.eventId)}{h.updatedAt ? ` • Atualizado: ${fmtDate(h.updatedAt)}` : ''}</small>
                  </li>
                ))}
                {!history.length && <li className="list-group-item bg-transparent text-muted">Nenhum registro</li>}
              </ul>
            </div></div>
          )}
        </div>
      </div>
    </div>
  );
}
