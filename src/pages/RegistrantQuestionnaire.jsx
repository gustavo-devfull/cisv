// src/pages/RegistrantQuestionnaire.jsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";

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

export default function RegistrantQuestionnaire() {
  const { id } = useParams(); // registrantId
  const nav = useNavigate();

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  // Carrega rascunho existente (se houver)
  useEffect(() => {
    (async () => {
      const ref = doc(db, "registrants", id, "questionnaire", "info");
      const snap = await getDoc(ref);
      if (snap.exists()) reset(snap.data());
    })();
  }, [id, reset]);

  const onSubmit = async (data) => {
    const ref = doc(db, "registrants", id, "questionnaire", "info");
    await setDoc(
      ref,
      {
        ...data,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    nav(`/registrants/${id}`); // volta para o inscrito
  };

  return (
    <div className="container" style={{ maxWidth: 980 }}>
      <div className="d-flex align-items-center mb-3">
        <h1 className="h5 mb-0">Ficha de Informação Complementar</h1>
        <Link to={`/registrants/${id}`} className="btn btn-outline-secondary btn-sm ms-auto">Voltar</Link>
      </div>

      <div className="card p-4">
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* ===== Ambiente familiar ===== */}
          <h5 className="mb-3">Ambiente familiar</h5>

          <div className="mb-3">
            <label className="form-label">
              a) Quem mora com o(a) participante? Como é a relação?
            </label>
            <textarea rows={3} className="form-control" {...register("af_quem_mora")} />
          </div>

          <div className="mb-3">
            <label className="form-label">
              b) Possui irmãos? Se sim, como é a relação/interação?
            </label>
            <YesNo name="af_irmaos" register={register} label="Possui irmãos?" />
            <textarea rows={3} className="form-control" placeholder="Explique (opcional)" {...register("af_irmaos_ctx")} />
          </div>

          <div className="mb-3">
            <label className="form-label">
              c) Familiares mais próximos e relação/interação
            </label>
            <textarea rows={3} className="form-control" {...register("af_familia_proxima")} />
          </div>

          <div className="mb-3">
            <label className="form-label">
              d) Responsabilidades dentro de casa
            </label>
            <textarea rows={3} className="form-control" {...register("af_responsabilidades")} />
          </div>

          <div className="mb-3">
            <label className="form-label">
              e) Obedece ordens de familiares/adultos?
            </label>
            <YesNo name="af_obedece" register={register} label="Obedece ordens?" />
            <textarea rows={3} className="form-control" placeholder="Se não, explique o contexto" {...register("af_obedece_ctx")} />
          </div>

          <div className="mb-3">
            <label className="form-label">
              f) Outras questões familiares? (se sim, explicar contexto)
            </label>
            <YesNo name="af_outras" register={register} label="Outras questões?" />
            <textarea rows={3} className="form-control" placeholder="Explique (opcional)" {...register("af_outras_ctx")} />
          </div>

          <hr className="my-4" />

          {/* ===== Ambiente externo ===== */}
          <h5 className="mb-3">Ambiente externo</h5>

          <div className="mb-3">
            <label className="form-label">a) Atividades extracurriculares</label>
            <textarea rows={3} className="form-control" {...register("ae_atividades")} />
          </div>

          <div className="mb-3">
            <label className="form-label">b) Relação com a turma da escola</label>
            <textarea rows={3} className="form-control" {...register("ae_turma")} />
          </div>

          <div className="mb-3">
            <label className="form-label">
              c) Possui apoio escolar? (mediadora, T.O., agente educacional)
            </label>
            <YesNo name="ae_apoio" register={register} label="Possui apoio escolar?" />
            <textarea rows={3} className="form-control" placeholder="Explique (opcional)" {...register("ae_apoio_ctx")} />
          </div>

          <hr className="my-4" />

          {/* ===== Histórico fisiológico ===== */}
          <h5 className="mb-3">Histórico fisiológico</h5>

          <div className="mb-3">
            <label className="form-label">
              a) Hábitos de sono (duração, dificuldades, situações específicas…)
            </label>
            <textarea rows={4} className="form-control" {...register("hf_sono")} />
          </div>

          <div className="mb-3">
            <label className="form-label">
              b) Histórico de sonambulismo?
            </label>
            <YesNo name="hf_sonambulismo" register={register} label="Sonambulismo?" />
            <textarea rows={3} className="form-control" placeholder="Explique (opcional)" {...register("hf_sonambulismo_ctx")} />
          </div>

          <div className="mb-3">
            <label className="form-label">
              c) Dificuldade/resistência na alimentação?
            </label>
            <YesNo name="hf_alimentacao" register={register} label="Dificuldade na alimentação?" />
            <textarea rows={3} className="form-control" placeholder="Explique (opcional)" {...register("hf_alimentacao_ctx")} />
          </div>

          <div className="mb-3">
            <label className="form-label">
              d) Como a família lida quando recusa alimento?
            </label>
            <textarea rows={3} className="form-control" {...register("hf_recusa")} />
          </div>

          <div className="mb-3">
            <label className="form-label">
              e) Funcionamento do intestino fora do cotidiano (instruções)
            </label>
            <div className="row g-2">
              <div className="col-md-6">
                <select className="form-select" {...register("hf_intestino")}>
                  <option value="">Selecione…</option>
                  <option value="regular">Regular</option>
                  <option value="prisao_de_ventre">Prisão de ventre</option>
                  <option value="solto">Solto</option>
                  <option value="inconstante">Inconstante</option>
                </select>
              </div>
              <div className="col-md-6">
                <textarea rows={2} className="form-control" placeholder="Observações (opcional)" {...register("hf_intestino_ctx")} />
              </div>
            </div>
          </div>

          <hr className="my-4" />

          {/* ===== Pessoal ===== */}
          <h5 className="mb-3">Pessoal</h5>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">a) Já viajou sem a família por período similar?</label>
              <YesNo name="p_javiajou" register={register} label="Já viajou?" />
            </div>
            <div className="col-md-6">
              <label className="form-label">Por quantos dias? (se sim)</label>
              <input className="form-control" {...register("p_javiajou_dias")} />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">
              b) Enjoo/mal-estar/medo em viagens?
            </label>
            <YesNo name="p_enjoo" register={register} label="Enjoo/medo?" />
            <textarea rows={3} className="form-control" placeholder="Explique (opcional)" {...register("p_enjoo_ctx")} />
          </div>

          <div className="mb-3">
            <label className="form-label">
              c) O que fazer se a saudade de casa causar desconforto?
            </label>
            <textarea rows={3} className="form-control" {...register("p_saudade")} />
          </div>

          <div className="mb-3">
            <label className="form-label">d) Características gerais de personalidade</label>
            <textarea rows={3} className="form-control" {...register("p_personalidade")} />
          </div>

          <div className="mb-3">
            <label className="form-label">e) Características que incomodam</label>
            <div className="d-flex flex-wrap gap-3">
              <label><input type="checkbox" className="form-check-input me-1" {...register("p_inc_timidez")} /> Timidez excessiva</label>
              <label><input type="checkbox" className="form-check-input me-1" {...register("p_inc_ansiedade")} /> Ansiedades</label>
              <label><input type="checkbox" className="form-check-input me-1" {...register("p_inc_social")} /> Dificuldades de socialização</label>
              <label><input type="checkbox" className="form-check-input me-1" {...register("p_inc_fala")} /> Dificuldade na fala</label>
              <label><input type="checkbox" className="form-check-input me-1" {...register("p_inc_peso")} /> Peso</label>
              <label><input type="checkbox" className="form-check-input me-1" {...register("p_inc_altura")} /> Altura</label>
            </div>
            <input className="form-control mt-2" placeholder="Outros (opcional)" {...register("p_inc_outros")} />
          </div>

          <div className="mb-3">
            <label className="form-label">f) O que o(a) deixa animado(a)</label>
            <textarea rows={3} className="form-control" {...register("p_anima")} />
          </div>

          <div className="mb-3">
            <label className="form-label">g) Atividades com familiares e amigos</label>
            <textarea rows={3} className="form-control" {...register("p_atividades")} />
          </div>

          <div className="mb-3">
            <label className="form-label">h) O que gosta de fazer sozinho(a)?</label>
            <textarea rows={3} className="form-control" {...register("p_sozinho")} />
          </div>

          <div className="mb-3">
            <label className="form-label">i) Possui alguma “mania”? (explicar)</label>
            <YesNo name="p_mania" register={register} label="Mania?" />
            <textarea rows={3} className="form-control" placeholder="Explique (opcional)" {...register("p_mania_ctx")} />
          </div>

          <div className="mb-3">
            <label className="form-label">j) O que o(a) deixa desconfortável/irrita?</label>
            <textarea rows={3} className="form-control" {...register("p_irrita")} />
          </div>

          <div className="mb-3">
            <label className="form-label">k) Possui algum medo? (explicar)</label>
            <YesNo name="p_medo" register={register} label="Medo?" />
            <textarea rows={3} className="form-control" placeholder="Explique (opcional)" {...register("p_medo_ctx")} />
          </div>

          <div className="mb-3">
            <label className="form-label">l) O que acalma quando está incomodado(a)?</label>
            <textarea rows={3} className="form-control" {...register("p_acalma")} />
          </div>

          <div className="mb-3">
            <label className="form-label">m) Comportamento com desconforto físico</label>
            <textarea rows={3} className="form-control" {...register("p_desconforto_fisico")} />
          </div>

          <div className="mb-3">
            <label className="form-label">n) Comportamento com desconforto emocional</label>
            <textarea rows={3} className="form-control" {...register("p_desconforto_emocional")} />
          </div>

          <div className="mb-3">
            <label className="form-label">
              o) Situação atual/passada que possa causar desconforto (explicar)
            </label>
            <YesNo name="p_situacao" register={register} label="Há situação atual/passada?" />
            <textarea rows={3} className="form-control" placeholder="Explique (opcional)" {...register("p_situacao_ctx")} />
          </div>

          <div className="mb-3">
            <label className="form-label">p) Como estão lidando (participante e família)?</label>
            <textarea rows={3} className="form-control" {...register("p_como_lida")} />
          </div>

          <hr className="my-4" />

          {/* ===== Necessidades específicas ===== */}
          <h5 className="mb-3">Necessidades específicas</h5>

          <div className="row g-2 mb-2">
            <div className="col-6 col-md-3"><label><input type="checkbox" className="form-check-input me-1" {...register("ne_auditiva")} /> Auditiva</label></div>
            <div className="col-6 col-md-3"><label><input type="checkbox" className="form-check-input me-1" {...register("ne_visual")} /> Visual</label></div>
            <div className="col-6 col-md-3"><label><input type="checkbox" className="form-check-input me-1" {...register("ne_fisica")} /> Física</label></div>
            <div className="col-6 col-md-3"><label><input type="checkbox" className="form-check-input me-1" {...register("ne_psicossocial")} /> Psicossocial</label></div>
            <div className="col-6 col-md-3"><label><input type="checkbox" className="form-check-input me-1" {...register("ne_intelectual")} /> Intelectual</label></div>
            <div className="col-6 col-md-3"><label><input type="checkbox" className="form-check-input me-1" {...register("ne_altas")} /> Altas habilidades</label></div>
          </div>
          <input className="form-control mb-3" placeholder="Outros (opcional)" {...register("ne_outros")} />

          <div className="mb-3">
            <label className="form-label">b) Possui alguma necessidade específica? (explicar)</label>
            <YesNo name="ne_possui" register={register} label="Possui necessidade específica?" />
            <textarea rows={3} className="form-control" placeholder="Explique (opcional)" {...register("ne_possui_ctx")} />
          </div>

          <div className="mb-3">
            <label className="form-label">c) Outras questões que impactem o bem-estar/segurança?</label>
            <YesNo name="ne_outras" register={register} label="Outras questões?" />
            <textarea rows={3} className="form-control" placeholder="Explique (opcional)" {...register("ne_outras_ctx")} />
          </div>

          <div className="d-flex gap-2 mt-3">
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar formulário"}
            </button>
            <Link to={`/registrants/${id}`} className="btn btn-outline-secondary">Cancelar</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
