// src/pages/Registrants.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../firebase";

const ROLE_LABEL = {
  participant: "Participante",
  leader: "Líder",
  JC: "JC",
  chaperone: "Acompanhante",
  staff: "Staff",
};

const STATUS_LABEL = {
  pending: "Pendente",
  applied: "Inscrito",
  approved: "Aprovado",
  waitlist: "Lista de Espera",
  rejected: "Rejeitado",
  canceled: "Cancelado",
  completed: "Concluído",
};

const fmtBRDate = (val) => {
  if (!val) return "—";
  try {
    if (val?.toDate) return val.toDate().toLocaleDateString("pt-BR");
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
};

// recebe "events/ABC" ou "ABC" e retorna "ABC"
const eventIdFromPath = (path) => {
  if (!path) return "";
  const parts = String(path).split("/");
  return parts.length > 1 ? parts[1] : parts[0];
};

export default function Registrants() {
  const [registrants, setRegistrants] = useState([]);
  const [registrationsByRegistrant, setRegsByReg] = useState({});
  const [eventsById, setEventsById] = useState({});
  const [qText, setQ] = useState("");
  const [cityFilter, setCityFilter] = useState("");

  // 1) inscritos
  useEffect(() => {
    const qy = query(collection(db, "registrants"), orderBy("lastName"));
    const unsub = onSnapshot(qy, (snap) =>
      setRegistrants(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, []);

  // 2) inscrições → agrupa por registrantId
  useEffect(() => {
    const qy = query(collection(db, "registrations"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(qy, (snap) => {
      const grouped = {};
      for (const d of snap.docs) {
        const reg = { id: d.id, ...d.data() };
        const key = String(reg.registrantId || "");
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(reg);
      }
      setRegsByReg(grouped);
    });
    return () => unsub();
  }, []);

  // 3) eventos → mapa id -> dados
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "events"), (s) => {
      const map = Object.fromEntries(s.docs.map((d) => [d.id, { id: d.id, ...d.data() }]));
      setEventsById(map);
    });
    return () => unsub();
  }, []);

  // cidades únicas ordenadas
  const cityOptions = useMemo(() => {
    const set = new Set(
      registrants
        .map((p) => (p?.address?.city || "").trim())
        .filter(Boolean)
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [registrants]);

  // busca por nome/email + filtro por cidade
  const filtered = useMemo(() => {
    const q = (qText || "").toLowerCase();
    return registrants.filter((p) => {
      const name = [p.firstName, p.lastName].filter(Boolean).join(" ").toLowerCase();
      const mail = (p.email || "").toLowerCase();
      const city = (p?.address?.city || "").toLowerCase();
      const matchText = !q || name.includes(q) || mail.includes(q);
      const matchCity = !cityFilter || city === cityFilter.toLowerCase();
      return matchText && matchCity;
    });
  }, [registrants, qText, cityFilter]);

  return (
    <div className="container-fluid">
      {/* Filtros topo */}
      <div className="row g-2 align-items-end mb-3">
        <div className="col-md">
          <label className="form-label">Buscar</label>
          <input
            className="form-control"
            placeholder="Nome ou e-mail..."
            value={qText}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Cidade</label>
          <select
            className="form-select"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          >
            <option value="">Todas</option>
            {cityOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="col-md-auto">
          <Link to="/registrants/new" className="btn btn-primary w-100">Novo Inscrito</Link>
        </div>
      </div>

      {/* Grid de cards de inscritos */}
      <div className="row g-3">
        {filtered.map((p) => {
          const fullName = [p.firstName, p.lastName].filter(Boolean).join(" ") || "Sem nome";
          const city = p?.address?.city || "Cidade não informada";
          const regs = registrationsByRegistrant[`registrants/${p.id}`] || [];

          return (
            <div className="col-sm-6 col-lg-4 col-xxl-3" key={p.id}>
              <div className="card h-100 p-3">
                {/* Cabeçalho do card (inscrito) */}
                <div className="d-flex align-items-start justify-content-between">
                  <h6 className="mb-1">{fullName}</h6>
                </div>
                <div className="small text-muted">
                  <span className="material-symbols-outlined align-middle me-1">location_city</span>
                  {city}
                </div>

                {/* Cards de eventos do inscrito */}
                <div className="mt-3">
                  <div className="fw-semibold mb-2">Eventos</div>

                  {regs.length ? (
                    <div className="d-flex flex-column gap-2">
                      {regs.map((r) => {
                        const evId = eventIdFromPath(r.eventId);
                        const ev = eventsById[evId];
                        const evTitle = ev?.title || evId || "—";
                        const start = fmtBRDate(ev?.startDate);
                        const end = fmtBRDate(ev?.endDate);
                        const role = ROLE_LABEL[r.role] || r.role || "—";
                        const status = STATUS_LABEL[r.status] || r.status || "—";

                        return (
                          <div key={r.id} className="border rounded p-2">
                            <div className="fw-semibold">{evTitle}</div>
                            <div className="text-muted">
                              {role} — {status}
                            </div>
                            <div className="small text-muted d-flex align-items-center">
                              <span className="material-symbols-outlined align-middle me-1">calendar_month</span>
                              {start} → {end}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-muted small">Nenhuma participação cadastrada.</div>
                  )}
                </div>

                {/* Ações */}
                <div className="d-flex gap-2 mt-auto pt-3">
                  <Link to={`/registrants/${p.id}`} className="btn btn-sm btn-outline-secondary">
                    Ver / Editar
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        {!filtered.length && (
          <div className="text-muted">Nenhum inscrito encontrado.</div>
        )}
      </div>
    </div>
  );
}
