// src/pages/GuestInscritoForm.jsx
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { auth, db, storage } from "../firebase";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref as storageRef, uploadBytesResumable } from "firebase/storage";

const YesNo = ({ name, register, label }) => (
  <div className="mb-2">
    <div className="form-label mb-1">{label}</div>
    <div className="d-flex gap-3">
      <label className="form-check-label">
        <input type="radio" className="form-check-input me-1" value="nao" {...register(name)} /> Não
      </label>
      <label className="form-check-label">
        <input type="radio" className="form-check-input me-1" value="sim" {...register(name)} /> Sim
      </label>
    </div>
  </div>
);

// Componente de upload de foto
const PhotoUpload = ({ photoUrl, setPhotoFile, uploadProgress }) => (
  <div>
    <label className="form-label">Foto</label>
    {photoUrl && <img src={photoUrl} alt="Foto do inscrito" className="img-thumbnail d-block mb-2" style={{ width: 150, height: 150, objectFit: 'cover' }} />}
    <input type="file" className="form-control" accept="image/*" onChange={e => setPhotoFile(e.target.files[0])} />
    {uploadProgress > 0 && uploadProgress < 100 && (
      <div className="progress mt-2">
        <div className="progress-bar" style={{ width: `${uploadProgress}%` }}>{Math.round(uploadProgress)}%</div>
      </div>
    )}
  </div>
);

export default function GuestInscritoForm() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const nav = useNavigate();

  const [invite, setInvite] = useState(null);
  const [err, setErr] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [showExtra, setShowExtra] = useState(false);

  // State para o upload da foto
  const [photoFile, setPhotoFile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: useMemo(() => ({
      basic: {
        firstName: "",
        lastName: "",
        birthDate: "",
        phone: "",
        email: "",
        address: { street: "", city: "", state: "", country: "" },
        guardian: { name: "", phone: "" },
        notes: "",
        photoUrl: "", // campo para a foto
      },
      questionnaire: {},
    }), []),
  });

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      if (!u) nav(`/guest/login?token=${token}`, { replace: true });
    });
    return () => unsub();
  }, [nav, token]);

  useEffect(() => {
    (async () => {
      try {
        if (!token) { setErr("Link inválido."); return; }

        const invRef = doc(db, "invites", token);
        const invSnap = await getDoc(invRef);
        if (!invSnap.exists()) { setErr("Convite inexistente ou expirado."); return; }
        const inv = invSnap.data();
        if (inv.status === "revoked") { setErr("Este convite foi revogado."); return; }
        setInvite(inv);

        const regRef = doc(db, "registrations", token);
        const regSnap = await getDoc(regRef);
        if (regSnap.exists()) {
          const data = regSnap.data();
          reset({ basic: data.form?.basic || {}, questionnaire: data.form?.questionnaire || {} });
          setPhotoUrl(data.form?.basic?.photoUrl || ""); // Carrega a foto existente
        }
        setLoaded(true);
      } catch (e) {
        console.warn(e);
        setErr("Falha ao carregar dados.");
      }
    })();
  }, [token, reset]);

  const handleUpload = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) return resolve(null);
      const fileRef = storageRef(storage, `registrations/${token}/photo`);
      const uploadTask = uploadBytesResumable(fileRef, file);
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Upload error", error);
          reject("Falha ao enviar foto.");
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  const onSubmit = async (data) => {
    setErr("");
    const u = auth.currentUser;
    if (!u) { setErr("Sessão expirada. Entre novamente."); return; }

    try {
      const uploadedPhotoUrl = await handleUpload(photoFile);
      if (uploadedPhotoUrl) {
        data.basic.photoUrl = uploadedPhotoUrl;
      }

      const payload = {
        ownerUid: u.uid,
        inviteToken: token,
        status: "pending",
        eventId: invite?.eventId ? `events/${invite.eventId}` : null,
        updatedAt: serverTimestamp(),
        form: {
          basic: data.basic || {},
          questionnaire: data.questionnaire || {},
        },
      };

      const ref = doc(db, "registrations", token);
      await setDoc(ref, { ...payload, createdAt: serverTimestamp() }, { merge: true });

      await updateDoc(doc(db, "invites", token), {
        status: "submitted",
        updatedAt: serverTimestamp(),
        ownerUid: auth.currentUser.uid,
      });

      nav("/guest/sucesso", { replace: true });

    } catch(e) {
      console.error(e);
      setErr(typeof e === 'string' ? e : "Falha ao salvar. Tente novamente.")
    }
  };

  if (err) {
    return (
      <div className="container" style={{ maxWidth: 720 }}>
        <div className="alert alert-danger my-4">{err}</div>
      </div>
    );
  }

  if (!loaded) return null;

  return (
    <div className="container" style={{ maxWidth: 980 }}>
      <div className="card p-4 my-4">
        <div className="d-flex align-items-center mb-2">
          <h1 className="h5 mb-0">Formulário do Inscrito</h1>
          <div className="ms-auto">
            <Link to={`/guest/login?token=${token}`} className="btn btn-outline-secondary btn-sm">Sair</Link>
          </div>
        </div>
        {invite?.eventId && <div className="text-muted mb-3">Evento: <strong>{invite.eventId}</strong></div>}
        <div className="alert alert-light py-2">Preencha e salve. Você pode voltar depois pelo mesmo link para editar.</div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <h6 className="mt-2">Dados do Inscrito</h6>
          <div className="row g-3">
            <div className="col-md-4">
                <PhotoUpload photoUrl={photoUrl} setPhotoFile={setPhotoFile} uploadProgress={uploadProgress} />
            </div>
            <div className="col-md-8">
              <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Nome</label>
                    <input className="form-control" {...register("basic.firstName")} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Sobrenome</label>
                    <input className="form-control" {...register("basic.lastName")} />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label">Nascimento</label>
                    <input type="date" className="form-control" {...register("basic.birthDate")} />
                  </div>
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label">Telefone</label>
              <input className="form-control" {...register("basic.phone")} />
            </div>
            <div className="col-md-6">
              <label className="form-label">E-mail</label>
              <input type="email" className="form-control" {...register("basic.email")} />
            </div>

            <div className="col-12">
              <label className="form-label">Endereço</label>
              <input className="form-control" placeholder="Rua, número" {...register("basic.address.street")} />
            </div>
            <div className="col-md-4">
              <input className="form-control" placeholder="Cidade" {...register("basic.address.city")} />
            </div>
            <div className="col-md-4">
              <input className="form-control" placeholder="Estado" {...register("basic.address.state")} />
            </div>
            <div className="col-md-4">
              <input className="form-control" placeholder="País" {...register("basic.address.country")} />
            </div>

            <div className="col-md-6">
              <label className="form-label">Responsável</label>
              <input className="form-control" {...register("basic.guardian.name")} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Contato do Responsável</label>
              <input className="form-control" {...register("basic.guardian.phone")} />
            </div>

            <div className="col-12">
              <label className="form-label">Observações</label>
              <textarea rows="3" className="form-control" {...register("basic.notes")} />
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 mt-4">
            <button type="button" className="btn btn-outline-primary" onClick={() => setShowExtra((v) => !v)}>
              {showExtra ? "Ocultar formulário complementar" : "Formulário complementar"}
            </button>
          </div>

          {showExtra && (
            <div className="mt-4 border-top pt-3">
              <h6 className="mb-2">Ambiente familiar</h6>
              <div className="mb-3"><label className="form-label">Quem mora com o(a) participante? Como é a relação?</label><textarea rows={3} className="form-control" {...register("questionnaire.af_quem_mora")} /></div>
              <div className="mb-3"><label className="form-label">Possui irmãos? Se sim, como é a relação/interação?</label><YesNo name="questionnaire.af_irmaos" register={register} label="Possui irmãos?" /><textarea rows={3} className="form-control" placeholder="Explique (opcional)" {...register("questionnaire.af_irmaos_ctx")} /></div>
              <div className="mb-3"><label className="form-label">Familiares mais próximos e relação</label><textarea rows={3} className="form-control" {...register("questionnaire.af_familia_proxima")} /></div>
              <div className="mb-3"><label className="form-label">Responsabilidades dentro de casa</label><textarea rows={3} className="form-control" {...register("questionnaire.af_responsabilidades")} /></div>
              <div className="mb-3"><label className="form-label">Obedece ordens de familiares/adultos?</label><YesNo name="questionnaire.af_obedece" register={register} label="Obedece ordens?" /><textarea rows={3} className="form-control" placeholder="Se não, explique" {...register("questionnaire.af_obedece_ctx")} /></div>
              <div className="mb-3"><label className="form-label">Outras questões familiares?</label><YesNo name="questionnaire.af_outras" register={register} label="Outras questões?" /><textarea rows={3} className="form-control" placeholder="Explique (opcional)" {...register("questionnaire.af_outras_ctx")} /></div>
              <hr className="my-4" />
              <h6 className="mb-2">Ambiente externo</h6>
              <div className="mb-3"><label className="form-label">Atividades extracurriculares</label><textarea rows={3} className="form-control" {...register("questionnaire.ae_atividades")} /></div>
              <div className="mb-3"><label className="form-label">Relação com a turma da escola</label><textarea rows={3} className="form-control" {...register("questionnaire.ae_turma")} /></div>
              <div className="mb-3"><label className="form-label">Possui apoio escolar?</label><YesNo name="questionnaire.ae_apoio" register={register} label="Apoio escolar?" /><textarea rows={3} className="form-control" placeholder="Explique (opcional)" {...register("questionnaire.ae_apoio_ctx")} /></div>
              <hr className="my-4" />
              <h6 className="mb-2">Histórico fisiológico</h6>
              <div className="mb-3"><label className="form-label">Hábitos de sono</label><textarea rows={3} className="form-control" {...register("questionnaire.hf_sono")} /></div>
              <div className="mb-3"><label className="form-label">Sonambulismo?</label><YesNo name="questionnaire.hf_sonambulismo" register={register} label="Sonambulismo?" /><textarea rows={3} className="form-control" placeholder="Explique (opcional)" {...register("questionnaire.hf_sonambulismo_ctx")} /></div>
              <div className="mb-3"><label className="form-label">Dificuldade/resistência na alimentação?</label><YesNo name="questionnaire.hf_alimentacao" register={register} label="Dificuldade na alimentação?" /><textarea rows={3} className="form-control" placeholder="Explique (opcional)" {...register("questionnaire.hf_alimentacao_ctx")} /></div>
              <div className="mb-3"><label className="form-label">Como a família lida quando recusa alimento?</label><textarea rows={3} className="form-control" {...register("questionnaire.hf_recusa")} /></div>
              <div className="mb-3">
                <label className="form-label">Funcionamento do intestino fora do cotidiano</label>
                <div className="row g-2"><div className="col-md-6"><select className="form-select" {...register("questionnaire.hf_intestino")}><option value="">Selecione…</option><option value="regular">Regular</option><option value="prisao_de_ventre">Prisão de ventre</option><option value="solto">Solto</option><option value="inconstante">Inconstante</option></select></div><div className="col-md-6"><textarea rows={2} className="form-control" placeholder="Observações (opcional)" {...register("questionnaire.hf_intestino_ctx")} /></div></div>
              </div>
              <hr className="my-4" />
              <h6 className="mb-2">Pessoal</h6>
              <div className="row g-3"><div className="col-md-6"><label className="form-label">Já viajou sem a família por período similar?</label><YesNo name="questionnaire.p_javiajou" register={register} label="Já viajou?" /></div><div className="col-md-6"><label className="form-label">Por quantos dias? (se sim)</label><input className="form-control" {...register("questionnaire.p_javiajou_dias")} /></div></div>
              <div className="mb-3"><label className="form-label">Enjoo/mal-estar/medo em viagens?</label><YesNo name="questionnaire.p_enjoo" register={register} label="Enjoo/medo?" /><textarea rows={3} className="form-control" placeholder="Explique (opcional)" {...register("questionnaire.p_enjoo_ctx")} /></div>
              <div className="mb-3"><label className="form-label">O que fazer se a saudade causar desconforto?</label><textarea rows={3} className="form-control" {...register("questionnaire.p_saudade")} /></div>
              <div className="mb-3"><label className="form-label">Características gerais de personalidade</label><textarea rows={3} className="form-control" {...register("questionnaire.p_personalidade")} /></div>
              <div className="mb-3"><label className="form-label">Existe algo que incomoda?</label><div className="d-flex flex-wrap gap-3"><label><input type="checkbox" className="form-check-input me-1" {...register("questionnaire.p_inc_timidez")} /> Timidez excessiva</label><label><input type="checkbox" className="form-check-input me-1" {...register("questionnaire.p_inc_ansiedade")} /> Ansiedades</label><label><input type="checkbox" className="form-check-input me-1" {...register("questionnaire.p_inc_social")} /> Dificuldades de socialização</label><label><input type="checkbox" className="form-check-input me-1" {...register("questionnaire.p_inc_fala")} /> Dificuldade na fala</label><label><input type="checkbox" className="form-check-input me-1" {...register("questionnaire.p_inc_peso")} /> Peso</label><label><input type="checkbox" className="form-check-input me-1" {...register("questionnaire.p_inc_altura")} /> Altura</label></div><input className="form-control mt-2" placeholder="Outros (opcional)" {...register("questionnaire.p_inc_outros")} /></div>
              <div className="mb-3"><label className="form-label">O que o(a) deixa animado(a)</label><textarea rows={3} className="form-control" {...register("questionnaire.p_anima")} /></div>
              <div className="mb-3"><label className="form-label">Atividades com família e amigos</label><textarea rows={3} className="form-control" {...register("questionnaire.p_atividades")} /></div>
              <div className="mb-3"><label className="form-label">O que gosta de fazer sozinho(a)?</label><textarea rows={3} className="form-control" {...register("questionnaire.p_sozinho")} /></div>
              <div className="mb-3"><label className="form-label">Possui alguma “mania”? (explicar)</label><YesNo name="questionnaire.p_mania" register={register} label="Mania?" /><input className="form-control" placeholder="Explique (opcional)" {...register("questionnaire.p_mania_ctx")} /></div>
              <div className="mb-3"><label className="form-label">O que deixa desconfortável/irrita?</label><textarea rows={3} className="form-control" {...register("questionnaire.p_irrita")} /></div>
              <div className="mb-3"><label className="form-label">Possui algum medo? (explicar)</label><YesNo name="questionnaire.p_medo" register={register} label="Medo?" /><textarea rows={3} className="form-control" placeholder="Explique (opcional)" {...register("questionnaire.p_medo_ctx")} /></div>
              <div className="mb-3"><label className="form-label">O que acalma quando está incomodado(a)?</label><textarea rows={3} className="form-control" {...register("questionnaire.p_acalma")} /></div>
              <div className="mb-3"><label className="form-label">Comportamento com desconforto físico</label><textarea rows={3} className="form-control" {...register("questionnaire.p_desconforto_fisico")} /></div>
              <div className="mb-3"><label className="form-label">Comportamento com desconforto emocional</label><textarea rows={3} className="form-control" {...register("questionnaire.p_desconforto_emocional")} /></div>
              <div className="mb-3"><label className="form-label">Situação atual/passada que cause desconforto</label><YesNo name="questionnaire.p_situacao" register={register} label="Há situação?" /><textarea rows={3} className="form-control" placeholder="Explique (opcional)" {...register("questionnaire.p_situacao_ctx")} /></div>
              <div className="mb-3"><label className="form-label">Como estão lidando (participante e família)?</label><textarea rows={3} className="form-control" {...register("questionnaire.p_como_lida")} /></div>
              <hr className="my-4" />
              <h6 className="mb-2">Necessidades específicas</h6>
              <div className="row g-2 mb-2"><div className="col-6 col-md-3"><label><input type="checkbox" className="form-check-input me-1" {...register("questionnaire.ne_auditiva")} /> Auditiva</label></div><div className="col-6 col-md-3"><label><input type="checkbox" className="form-check-input me-1" {...register("questionnaire.ne_visual")} /> Visual</label></div><div className="col-6 col-md-3"><label><input type="checkbox" className="form-check-input me-1" {...register("questionnaire.ne_fisica")} /> Física</label></div><div className="col-6 col-md-3"><label><input type="checkbox" className="form-check-input me-1" {...register("questionnaire.ne_psicossocial")} /> Psicossocial</label></div><div className="col-6 col-md-3"><label><input type="checkbox" className="form-check-input me-1" {...register("questionnaire.ne_intelectual")} /> Intelectual</label></div><div className="col-6 col-md-3"><label><input type="checkbox" className="form-check-input me-1" {...register("questionnaire.ne_altas")} /> Altas habilidades</label></div></div>
              <input className="form-control mb-3" placeholder="Outros (opcional)" {...register("questionnaire.ne_outros")} />
              <div className="mb-3"><label className="form-label">Possui alguma necessidade específica?</label><YesNo name="questionnaire.ne_possui" register={register} label="Possui necessidade específica?" /><textarea rows={3} className="form-control" placeholder="Explique (opcional)" {...register("questionnaire.ne_possui_ctx")} /></div>
              <div className="mb-3"><label className="form-label">Outras questões que impactem o bem-estar/segurança?</label><YesNo name="questionnaire.ne_outras" register={register} label="Outras questões?" /><textarea rows={3} className="form-control" placeholder="Explique (opcional)" {...register("questionnaire.ne_outras_ctx")} /></div>
            </div>
          )}

          <div className="d-flex gap-2 mt-4">
            <button className="btn btn-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? "Salvando…" : "Salvar"}</button>
            <Link to={`/guest/login?token=${token}`} className="btn btn-outline-secondary">Sair</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
