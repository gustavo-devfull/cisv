// src/components/LotsEditor.jsx
import { useEffect } from 'react';

const DEFAULT_LOTS = [
  { name: '1º Lote', startDate: '2025-01-01', endDate: '2025-01-31', priceBRL: 400.00 },
  { name: '2º Lote', startDate: '2025-02-01', endDate: '2025-02-28', priceBRL: 500.00 },
  { name: '3º Lote', startDate: '2025-03-01', endDate: '2025-03-31', priceBRL: 600.00 },
];

export default function LotsEditor({ value, onChange }) {
  useEffect(() => {
    if (!value || !Array.isArray(value)) onChange([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateLot = (idx, field, v) => {
    const next = [...(value || [])];
    next[idx] = { ...next[idx], [field]: field === 'priceBRL' ? Number(v) : v };
    onChange(next);
  };

  const addLot = () =>
    onChange([...(value || []), { name: '', startDate: '', endDate: '', priceBRL: 0 }]);

  const removeLot = (idx) =>
    onChange((value || []).filter((_, i) => i !== idx));

  const fillDefault = () => onChange(DEFAULT_LOTS);

  return (
    <div className="card p-3">
      <div className="d-flex align-items-center mb-2">
        <h6 className="mb-0">Lotes de inscrição</h6>
        <div className="ms-auto d-flex gap-2">
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={fillDefault}>
            Preencher 3 lotes (exemplo)
          </button>
          <button type="button" className="btn btn-sm btn-outline-primary" onClick={addLot}>
            + Adicionar lote
          </button>
        </div>
      </div>

      {(value || []).map((lot, idx) => (
        <div key={idx} className="row g-2 align-items-end border rounded p-2 mb-2">
          <div className="col-md-3">
            <label className="form-label">Nome</label>
            <input
              className="form-control"
              value={lot.name || ''}
              onChange={(e)=>updateLot(idx, 'name', e.target.value)}
              placeholder="Ex.: 1º Lote"
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Início</label>
            <input
              type="date"
              className="form-control"
              value={lot.startDate || ''}
              onChange={(e)=>updateLot(idx, 'startDate', e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Fim</label>
            <input
              type="date"
              className="form-control"
              value={lot.endDate || ''}
              onChange={(e)=>updateLot(idx, 'endDate', e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              value={lot.priceBRL ?? 0}
              onChange={(e)=>updateLot(idx, 'priceBRL', e.target.value)}
            />
          </div>
          <div className="col-md-1 text-end">
            <button type="button" className="btn btn-outline-danger" onClick={()=>removeLot(idx)}>
              Remover
            </button>
          </div>
        </div>
      ))}

      {!value?.length && <div className="text-muted">Nenhum lote adicionado.</div>}
    </div>
  );
}
