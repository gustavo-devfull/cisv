// src/pages/GuestMy.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";

export default function GuestMy() {
  const [params] = useSearchParams();
  const token = params.get("token") || ""; // opcional (se veio de um link antigo)
  const nav = useNavigate();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  // exige login
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      if (!u) nav(`/guest/login${token ? `?token=${token}` : ""}`, { replace: true });
    });
    return () => unsub();
  }, [nav, token]);

  // carrega todas as registrations do ownerUid
  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;
    const qy = query(
      collection(db, "registrations"),
      where("ownerUid", "==", u.uid),
      orderBy("updatedAt", "desc")
    );
    const unsub = onSnapshot(qy, (s) => {
      const rows = s.docs.map((d) => ({ id: d.id, ...d.data() }));
      setList(rows);
      setLoading(false);
    });
    return () => unsub();
  }, [auth.currentUser?.uid]); // eslint-disable-line

  const fmtDate = (ts) => {
    if (!ts) return "—";
    const ms = ts?.seconds ? ts.seconds * 1000 : (typeof ts === "number" ? ts : Date.parse(ts));
    if (!ms) return "—";
    return new Date(ms).toLocaleDateString();
    // se quiser hora: .toLocaleString()
  };

  return (
    <div className="container" style={{ maxWidth: 980 }}>
      <div className="d-flex align-items-center my-3">
        <h1 className="h5 mb-0">Minhas inscrições</h1>
        <div className="ms-auto d-flex gap-2">
          <Link to={`/guest/form?id=new`} className="btn btn-primary">
            Adicionar inscrito
          </Link>
        </div>
      </div>

      {loading && <div className="text-muted">Carregando…</div>}

      {!loading && !list.length && (
        <div className="card p-4">
          <p className="mb-3">Você ainda não cadastrou nenhum inscrito.</p>
          <Link to={`/guest/form?id=new`} className="btn btn-primary">Adicionar inscrito</Link>
        </div>
      )}

      <div className="row g-3">
        {list.map((r) => {
          const nome = r.form?.basic?.firstName || r.form?.participante_nome || "Inscrito";
          const sobrenome = r.form?.basic?.lastName || "";
          const title = `${nome} ${sobrenome}`.trim();
          const evento = r.eventId ? r.eventId.split("/")[1] : "—";
          const statusMap = {
            pending: { label: "Pendente", cls: "badge bg-secondary" },
            submitted: { label: "Enviado", cls: "badge bg-success" },
            registered: { label: "Registrado", cls: "badge bg-primary" },
            completed: { label: "Concluído", cls: "badge bg-success" },
            canceled: { label: "Cancelado", cls: "badge bg-danger" },
          };
          const st = statusMap[r.status] || { label: r.status || "—", cls: "badge bg-light text-dark" };

          return (
            <div className="col-12 col-md-6 col-lg-4" key={r.id}>
              <div className="card h-100 shadow-sm">
                <div className="card-body d-flex flex-column">
                  <div className="d-flex align-items-start justify-content-between">
                    <h2 className="h6 mb-2">{title}</h2>
                    <span className={st.cls}>{st.label}</span>
                  </div>
                  <div className="small text-muted mb-2">
                    <div><strong>Evento:</strong> {evento}</div>
                    <div><strong>Atualizado:</strong> {fmtDate(r.updatedAt)}</div>
                  </div>

                  <div className="mt-auto d-flex gap-2">
                    {/* editar essa inscrição */}
                    <Link to={`/guest/form?id=${r.id}`} className="btn btn-outline-primary btn-sm">
                      Editar
                    </Link>
                    {/* se quiser visualizar read-only num futuro */}
                    {/* <Link to={`/guest/view?id=${r.id}`} className="btn btn-outline-secondary btn-sm">Ver</Link> */}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sair (opcional) */}
      <div className="text-end mt-3">
        <Link to={`/guest/login${token ? `?token=${token}` : ""}`} className="btn btn-outline-secondary btn-sm">
          Sair
        </Link>
      </div>
    </div>
  );
}
