// src/pages/FormLinks.jsx
import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { nanoid } from "nanoid"; // npm i nanoid (ou use fallback abaixo)

function makeToken() {
  try { return nanoid(24); }
  catch { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
}

// Mapa de tradução + estilo do badge para o status
const statusView = (status) => {
  const map = {
    pending:  { label: "Pendente",  cls: "badge bg-secondary" },
    registered:{ label: "Registrado", cls: "badge bg-primary"   },
    submitted:{ label: "Enviado",   cls: "badge bg-success"   },
    revoked:  { label: "Revogado",  cls: "badge bg-danger"    },
  };
  return map[status] || { label: status || "—", cls: "badge bg-light text-dark" };
};

export default function FormLinks() {
  const [events, setEvents] = useState([]);
  const [invites, setInvites] = useState([]);
  const [form, setForm] = useState({ guardianName: "", guardianEmail: "", eventId: "", note: "" });

  // Carrega eventos (para mostrar o título)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "events"), (s) =>
      setEvents(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, []);

  // Índice rápido id->evento
  const eventIndex = useMemo(() => {
    const idx = {};
    for (const ev of events) idx[ev.id] = ev;
    return idx;
  }, [events]);

  // Carrega convites
  useEffect(() => {
    const qy = query(collection(db, "invites"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(qy, (s) =>
      setInvites(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, []);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const linkFor = (tok) => `${origin}/guest/register?token=${tok}`;

  const createInvite = async (e) => {
    e.preventDefault();
    const token = makeToken();
    const payload = {
      token,
      guardianName: form.guardianName || "",
      guardianEmail: (form.guardianEmail || "").trim().toLowerCase(),
      eventId: form.eventId || null,        // guarda só o ID do evento
      note: form.note || "",
      status: "pending",                    // pending | registered | submitted | revoked
      ownerUid: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      regDocId: token,
    };
    try {
      await setDoc(doc(db, "invites", token), payload);
      setForm({ guardianName: "", guardianEmail: "", eventId: "", note: "" });
    } catch (e2) {
      alert("Sem permissão para criar convites. Verifique suas regras/credenciais.");
      console.warn(e2);
    }
  };

  const setStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, "invites", id), { status, updatedAt: new Date() });
    } catch (e) {
      alert("Sem permissão para atualizar o status do convite.");
      console.warn(e);
    }
  };

  const sorted = useMemo(() => invites, [invites]);

  return (
    <div className="container-fluid">
      <h1 className="h5 mb-3">Links de Formulário (Responsáveis)</h1>

      <div className="card p-3 mb-4">
        <form className="row g-3" onSubmit={createInvite}>
          <div className="col-md-4">
            <label className="form-label">Nome do Responsável</label>
            <input
              className="form-control"
              value={form.guardianName}
              onChange={(e) => setForm(f => ({ ...f, guardianName: e.target.value }))}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">E-mail do Responsável</label>
            <input
              className="form-control"
              type="email"
              value={form.guardianEmail}
              onChange={(e) => setForm(f => ({ ...f, guardianEmail: e.target.value }))}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Vincular a um evento (opcional)</label>
            <select
              className="form-select"
              value={form.eventId}
              onChange={(e) => setForm(f => ({ ...f, eventId: e.target.value }))}
            >
              <option value="">— Selecionar —</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>
                  {ev.title || ev.name || ev.id}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12">
            <label className="form-label">Observação (opcional)</label>
            <input
              className="form-control"
              value={form.note}
              onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))}
            />
          </div>
          <div className="col-12 d-flex gap-2">
            <button className="btn btn-primary" type="submit">Gerar link</button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table mb-0 align-middle">
            <thead>
              <tr>
                <th>Responsável</th>
                <th>E-mail</th>
                <th>Evento</th>
                <th>Status</th>
                <th>Link</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(iv => {
                const url = linkFor(iv.id);
                const ev = iv.eventId ? eventIndex[iv.eventId] : null;
                const eventLabel = ev?.title || ev?.name || iv.eventId || "—";
                const s = statusView(iv.status);

                return (
                  <tr key={iv.id}>
                    <td>{iv.guardianName || "—"}</td>
                    <td>{iv.guardianEmail || "—"}</td>
                    <td>
                      <span className="fw-semibold">{eventLabel}</span>
                      {iv.eventId && ev?.startDate && (
                        <div className="small text-muted">
                          {new Date(ev.startDate.seconds ? ev.startDate.seconds * 1000 : ev.startDate).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td>
                      {/* Destaque do status com badge traduzido */}
                      <span className={s.cls}>{s.label}</span>
                    </td>
                    <td style={{ maxWidth: 320 }}>
                      <div className="small text-truncate">{url}</div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary mt-1"
                        onClick={() => navigator.clipboard?.writeText(url)}
                      >
                        Copiar
                      </button>
                    </td>
                    <td className="text-end">
                      <div className="btn-group">
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => setStatus(iv.id, "registered")}>
                          Marcar registrado
                        </button>
                        <button className="btn btn-sm btn-outline-success" onClick={() => setStatus(iv.id, "submitted")}>
                          Marcar enviado
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => setStatus(iv.id, "revoked")}>
                          Revogar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!sorted.length && (
                <tr>
                  <td colSpan="6" className="text-muted">Nenhum convite criado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
