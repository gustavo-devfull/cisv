// src/pages/GuestSuccess.jsx
import { Link } from "react-router-dom";

export default function GuestSuccess() {
  return (
    <div className="container" style={{maxWidth: 640}}>
      <div className="card p-4 my-4 text-center">
        <h1 className="h5">Formulário salvo!</h1>
        <p className="text-muted">Recebemos suas informações. Você pode voltar pelo mesmo link para editar quando quiser.</p>
        <Link to="/" className="btn btn-primary">OK</Link>
      </div>
    </div>
  );
}
