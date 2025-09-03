// src/pages/GuestLogin.jsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

export default function GuestLogin() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const nav = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm();
  const [msg, setMsg] = useState("");

  const onSubmit = async ({ email, password }) => {
    setMsg("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      nav(`/guest/form?token=${token}`, { replace: true });
    } catch (e) {
      setError("root", { message: "Não foi possível entrar. Verifique e-mail e senha." });
    }
  };

  return (
    <div className="container" style={{ maxWidth: 480 }}>
      <div className="card p-4 my-4">
        <h1 className="h5 mb-3">Entrar</h1>
        {msg && <div className="alert alert-info">{msg}</div>}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-2">
            <label className="form-label">E-mail</label>
            <input className="form-control" type="email" {...register("email", { required: true })}/>
            {errors.email && <div className="text-danger small">Informe o e-mail</div>}
          </div>
          <div className="mb-3">
            <label className="form-label">Senha</label>
            <input className="form-control" type="password" {...register("password", { required: true })}/>
            {errors.password && <div className="text-danger small">Informe a senha</div>}
          </div>
          {errors.root && <div className="alert alert-danger">{errors.root.message}</div>}
          <button className="btn btn-primary w-100" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <div className="text-center mt-3">
          Não tem conta?{" "}
          <Link to={`/guest/register?token=${token}`}>Criar conta</Link>
        </div>
      </div>
    </div>
  );
}
