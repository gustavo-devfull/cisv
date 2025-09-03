// src/pages/GuestRegister.jsx
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../firebase";
import { db } from "../firebase";

export default function GuestRegister() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const nav = useNavigate();
  const [invite, setInvite] = useState(null);
  const [err, setErr] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    (async () => {
      if (!token) { setErr("Link inválido."); return; }
      const ref = doc(db, "invites", token);
      const snap = await getDoc(ref);
      if (!snap.exists()) { setErr("Convite inexistente ou expirado."); return; }
      const data = snap.data();
      if (data.status === "revoked") { setErr("Este convite foi revogado."); return; }
      setInvite(data);
    })();
  }, [token]);

  const onSubmit = async ({ name, email, password }) => {
    setErr("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) await updateProfile(cred.user, { displayName: name });
      await updateDoc(doc(db, "invites", token), {
        ownerUid: cred.user.uid,
        status: "registered",
        updatedAt: new Date(),
      });
      nav(`/guest/form?token=${token}`, { replace: true });
    } catch (e) {
      setErr("Falha ao criar conta. Verifique os dados.");
      console.warn(e);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <div className="card p-4 my-4">
        <h1 className="h5 mb-2">Cadastro do responsável</h1>
        <div className="text-muted mb-3">Convite para preencher o formulário do inscrito.</div>

        {invite && (
          <div className="alert alert-light py-2">
            <div><strong>Responsável:</strong> {invite.guardianName || "—"}</div>
            <div><strong>E-mail:</strong> {invite.guardianEmail || "—"}</div>
            {invite.eventId && <div><strong>Evento:</strong> {invite.eventId}</div>}
          </div>
        )}
        {err && <div className="alert alert-danger">{err}</div>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-2">
            <label className="form-label">Nome</label>
            <input className="form-control" {...register("name")} />
          </div>
          <div className="mb-2">
            <label className="form-label">E-mail</label>
            <input className="form-control" type="email" defaultValue={invite?.guardianEmail} {...register("email", { required: true })} />
            {errors.email && <div className="text-danger small">Informe o e-mail</div>}
          </div>
          <div className="mb-3">
            <label className="form-label">Senha</label>
            <input className="form-control" type="password" {...register("password", { required: true, minLength: 6 })} />
            {errors.password && <div className="text-danger small">Mínimo 6 caracteres</div>}
          </div>
          <button className="btn btn-primary w-100" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Criando conta…" : "Criar conta e continuar"}
          </button>
        </form>

        <div className="text-center mt-3">
          Já tem conta?{" "}
          <Link to={`/guest/login?token=${token}`}>Entrar</Link>
        </div>
      </div>
    </div>
  );
}
