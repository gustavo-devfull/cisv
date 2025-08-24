// src/pages/PublicRegistration.jsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";

const yesNo = [
  { value: "sim", label: "Sim" },
  { value: "nao", label: "Não" },
];

export default function PublicRegistration() {
  const [params] = useSearchParams();
  const eventIdParam = params.get("event") || ""; // ID do evento (opcional)
  const [eventTitle, setEventTitle] = useState("");
  const [sent, setSent] = useState(false);
  const [regCode, setRegCode] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: {} });

  // Busca título do evento (se veio query ?event=XYZ)
  useEffect(() => {
    (async () => {
      if (!eventIdParam) return;
      const eSnap = await getDoc(doc(db, "events", eventIdParam));
      if (eSnap.exists()) setEventTitle(eSnap.data()?.title || "");
    })();
  }, [eventIdParam]);

  const onSubmit = async (data) => {
    // 1) Cria a inscrição pendente
    const regPayload = {
      eventId: eventIdParam ? `events/${eventIdParam}` : null,
      status: "pending", // 🔵 Pendente
      role: "participant", // padrão (ajuste se quiser expor no formulário)
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      origin: "public-form",
    };
    const regRef = await addDoc(collection(db, "registrations"), regPayload);

    // 2) Salva o questionário como subdocumento
    // Guardamos também os "metadados" básicos do inscrito:
    const questionnaire = {
      // Cabeçalho básico
      participante: {
        nome: data.participante_nome || "",
        sexo: data.participante_sexo || "",
        nascimento: data.participante_nascimento || "",
      },
      responsaveis: [
        { nome: data.resp1_nome || "", tel: data.resp1_tel || "" },
        { nome: data.resp2_nome || "", tel: data.resp2_tel || "" },
      ],
      // Ambiente familiar
      ambiente_familiar: {
        quem_mora: data.af_quem_mora || "",
        irmaos: { possui: data.af_irmaos || "", contexto: data.af_irmaos_ctx || "" },
        familiares_proximos: data.af_familia_proxima || "",
        responsabilidades: data.af_responsabilidades || "",
        obedece_ordens: { valor: data.af_obedece || "", contexto: data.af_obedece_ctx || "" },
        outras_questoes: { valor: data.af_outras || "", contexto: data.af_outras_ctx || "" },
      },
      // Ambiente externo
      ambiente_externo: {
        atividades: data.ae_atividades || "",
        relacao_turma: data.ae_turma || "",
        apoio_escolar: { valor: data.ae_apoio || "", contexto: data.ae_apoio_ctx || "" },
      },
      // Histórico fisiológico
      historico_fisiologico: {
        sono: data.hf_sono || "",
        sonambulismo: { valor: data.hf_sonambulismo || "", contexto: data.hf_sonambulismo_ctx || "" },
        alimentacao: { valor: data.hf_alimentacao || "", contexto: data.hf_alimentacao_ctx || "" },
        recusa_alimentos: data.hf_recusa || "",
        intestino: data.hf_intestino || "", // regular, prisao_de_ventre, solto, inconstante
      },
      // Pessoal
      pessoal: {
        ja_viajou_sem_familia: { valor: data.p_javiajou || "", dias: data.p_javiajou_dias || "" },
        enjoos_viagem: { valor: data.p_enjoo || "", contexto: data.p_enjoo_ctx || "" },
        saudade_casa: data.p_saudade || "",
        personalidade: data.p_personalidade || "",
        incomodos: {
          timidez: !!data.p_inc_timidez,
          ansiedades: !!data.p_inc_ansiedade,
          socializacao: !!data.p_inc_social,
          fala: !!data.p_inc_fala,
          peso: !!data.p_inc_peso,
          altura: !!data.p_inc_altura,
          outros: data.p_inc_outros || "",
        },
        animado_por: data.p_anima || "",
        atividades_familia_amigos: data.p_atividades || "",
        sozinho_gosta: data.p_sozinho || "",
        mania: { valor: data.p_mania || "", contexto: data.p_mania_ctx || "" },
        irrita: data.p_irrita || "",
        medos: { valor: data.p_medo || "", contexto: data.p_medo_ctx || "" },
        acalma: data.p_acalma || "",
        desconforto_fisico: data.p_desconforto_fisico || "",
        desconforto_emocional: data.p_desconforto_emocional || "",
        situacoes_atuais: { valor: data.p_situacao || "", contexto: data.p_situacao_ctx || "" },
        como_lida: data.p_como_lida || "",
      },
      // Necessidades específicas
      necessidades_especificas: {
        tipos: {
          auditiva: !!data.ne_auditiva,
          visual: !!data.ne_visual,
          fisica: !!data.ne_fisica,
          psicossocial: !!data.ne_psicossocial,
          intelectual: !!data.ne_intelectual,
          altas_habilidades: !!data.ne_altas,
          outros: data.ne_outros || "",
        },
        possui: { valor: data.ne_possui || "", contexto: data.ne_possui_ctx || "" },
        outras_questoes: { valor: data.ne_outras || "", contexto: data.ne_outras_ctx || "" },
      },
      // aceite/declaração
      declaracao: {
        reconhece_veracidade: !!data.decl_true,
        data_assinatura: data.decl_data || "",
      },
      // rastros
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, "registrations", regRef.id, "questionnaire", "info"), questionnaire);

    // 3) mensagem de sucesso simples
    setRegCode(regRef.id);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="container py-5" style={{ maxWidth: 860 }}>
        <div className="card p-4">
          <h3 className="mb-2">Inscrição enviada!</h3>
          <p className="text-muted mb-3">
            Recebemos o formulário. Seu status inicial é <strong>Pendente</strong>. Nossa equipe fará a avaliação e entrará em contato.
          </p>
          {regCode && (
            <p className="small text-muted">
              Código da inscrição: <code>{regCode}</code>
            </p>
          )}
          <Link to="/" className="btn btn-primary mt-2">Voltar ao início</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4" style={{ maxWidth: 980 }}>
      <div className="card p-4">
        <h2 className="mb-1">Ficha de Informações Complementares</h2>
        <div className="text-muted mb-3">
          {eventTitle ? <>Para o evento: <strong>{eventTitle}</strong></> : "Sem evento vinculado"}
        </div>
        <p className="small text-muted">
          As informações a seguir são confidenciais e usadas para o cuidado e bem-estar do(a) participante. {/* ver doc */} :contentReference[oaicite:0]{index=0}
        </p>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Participante / Responsáveis */}
          <div className="row g-3">
            <div className="col-md-8">
              <label className="form-label">Nome do Participante</label>
              <input className="form-control" {...register("participante_nome", { required: true })} />
              {errors.participante_nome && <div className="text-danger small">Informe o nome do participante.</div>}
            </div>
            <div className="col-md-4">
              <label className="form-label">Sexo</label>
              <input className="form-control" {...register("participante_sexo")} placeholder="F/M/Outro" />
            </div>
            <div className="col-md-4">
              <label className="form-label">Data de nascimento</label>
              <input type="date" className="form-control" {...register("participante_nascimento")} />
            </div>

            <div className="col-md-4">
              <label className="form-label">Responsável 1 - Nome</label>
              <input className="form-control" {...register("resp1_nome")} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Responsável 1 - Telefone</label>
              <input className="form-control" {...register("resp1_tel")} />
            </div>

            <div className="col-md-4">
              <label className="form-label">Responsável 2 - Nome</label>
              <input className="form-control" {...register("resp2_nome")} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Responsável 2 - Telefone</label>
              <input className="form-control" {...register("resp2_tel")} />
            </div>
          </div>

          <hr className="my-4" />

          {/* Ambiente familiar */}
          <h5 className="mb-3">Ambiente familiar</h5>
          <div className="mb-3">
            <label className="form-label">Quem mora com o(a) participante? Como é a relação?</label>
            <textarea className="form-control" rows={3} {...register("af_quem_mora")} />
          </div>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Possui irmãos?</label>
              <select className="form-select" {...register("af_irmaos")}>
                <option value="">Selecione…</option>
                {yesNo.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="col-md-8">
              <label className="form-label">Se sim, como é a relação?</label>
              <input className="form-control" {...register("af_irmaos_ctx")} />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Familiares mais próximos e relação</label>
            <textarea className="form-control" rows={2} {...register("af_familia_proxima")} />
          </div>
          <div className="mb-3">
            <label className="form-label">Responsabilidades dentro de casa</label>
            <textarea className="form-control" rows={2} {...register("af_responsabilidades")} />
          </div>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Obedece ordens de familiares/adultos?</label>
              <select className="form-select" {...register("af_obedece")}>
                <option value="">Selecione…</option>
                {yesNo.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="col-md-8">
              <label className="form-label">Se não, explique o contexto</label>
              <input className="form-control" {...register("af_obedece_ctx")} />
            </div>
          </div>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Outras questões familiares?</label>
              <select className="form-select" {...register("af_outras")}>
                <option value="">Selecione…</option>
                {yesNo.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="col-md-8">
              <label className="form-label">Explique</label>
              <input className="form-control" {...register("af_outras_ctx")} />
            </div>
          </div>

          <hr className="my-4" />

          {/* Ambiente externo */}
          <h5 className="mb-3">Ambiente externo</h5>
          <div className="mb-3">
            <label className="form-label">Atividades extracurriculares</label>
            <textarea className="form-control" rows={2} {...register("ae_atividades")} />
          </div>
          <div className="mb-3">
            <label className="form-label">Relação com turma da escola</label>
            <textarea className="form-control" rows={2} {...register("ae_turma")} />
          </div>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Possui apoio escolar?</label>
              <select className="form-select" {...register("ae_apoio")}>
                <option value="">Selecione…</option>
                {yesNo.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="col-md-8">
              <label className="form-label">Se sim, explique</label>
              <input className="form-control" {...register("ae_apoio_ctx")} />
            </div>
          </div>

          <hr className="my-4" />

          {/* Histórico fisiológico */}
          <h5 className="mb-3">Histórico fisiológico</h5>
          <div className="mb-3">
            <label className="form-label">Hábitos de sono</label>
            <textarea className="form-control" rows={2} {...register("hf_sono")} />
          </div>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Sonambulismo?</label>
              <select className="form-select" {...register("hf_sonambulismo")}>
                <option value="">Selecione…</option>
                {yesNo.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="col-md-8">
              <label className="form-label">Se sim, explique</label>
              <input className="form-control" {...register("hf_sonambulismo_ctx")} />
            </div>
          </div>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Resistência/dificuldade na alimentação?</label>
              <select className="form-select" {...register("hf_alimentacao")}>
                <option value="">Selecione…</option>
                {yesNo.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="col-md-8">
              <label className="form-label">Explique</label>
              <input className="form-control" {...register("hf_alimentacao_ctx")} />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Como a família lida quando recusa alimento?</label>
            <textarea className="form-control" rows={2} {...register("hf_recusa")} />
          </div>
          <div className="mb-3">
            <label className="form-label">Funcionamento do intestino fora do cotidiano</label>
            <select className="form-select" {...register("hf_intestino")}>
              <option value="">Selecione…</option>
              <option value="regular">Regular</option>
              <option value="prisao_de_ventre">Prisão de ventre</option>
              <option value="solto">Solto</option>
              <option value="inconstante">Inconstante</option>
            </select>
          </div>

          <hr className="my-4" />

          {/* Pessoal */}
          <h5 className="mb-3">Pessoal</h5>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Já viajou sem a família?</label>
              <select className="form-select" {...register("p_javiajou")}>
                <option value="">Selecione…</option>
                {yesNo.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Por quantos dias? (se sim)</label>
              <input className="form-control" {...register("p_javiajou_dias")} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Enjoo/medo ao viajar?</label>
              <select className="form-select" {...register("p_enjoo")}>
                <option value="">Selecione…</option>
                {yesNo.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="col-12">
              <label className="form-label">Se sim, explique</label>
              <input className="form-control" {...register("p_enjoo_ctx")} />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">O que fazer se a saudade de casa causar desconforto?</label>
            <textarea className="form-control" rows={2} {...register("p_saudade")} />
          </div>
          <div className="mb-3">
            <label className="form-label">Características gerais de personalidade</label>
            <textarea className="form-control" rows={2} {...register("p_personalidade")} />
          </div>

          {/* Incômodos (checkbox) */}
          <div className="row g-3">
            <div className="col-md-12">
              <label className="form-label">Existe algo que incomoda?</label>
              <div className="d-flex flex-wrap gap-3">
                <label><input type="checkbox" {...register("p_inc_timidez")} /> Timidez excessiva</label>
                <label><input type="checkbox" {...register("p_inc_ansiedade")} /> Ansiedades</label>
                <label><input type="checkbox" {...register("p_inc_social")} /> Dificuldades de socialização</label>
                <label><input type="checkbox" {...register("p_inc_fala")} /> Dificuldade na fala</label>
                <label><input type="checkbox" {...register("p_inc_peso")} /> Peso</label>
                <label><input type="checkbox" {...register("p_inc_altura")} /> Altura</label>
              </div>
              <input className="form-control mt-2" placeholder="Outros (opcional)" {...register("p_inc_outros")} />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">O que o(a) deixa animado(a)</label>
            <textarea className="form-control" rows={2} {...register("p_anima")} />
          </div>
          <div className="mb-3">
            <label className="form-label">Atividades com família e amigos</label>
            <textarea className="form-control" rows={2} {...register("p_atividades")} />
          </div>
          <div className="mb-3">
            <label className="form-label">O que gosta de fazer sozinho(a)?</label>
            <textarea className="form-control" rows={2} {...register("p_sozinho")} />
          </div>

          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Possui alguma "mania"?</label>
              <select className="form-select" {...register("p_mania")}>
                <option value="">Selecione…</option>
                {yesNo.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="col-md-8">
              <label className="form-label">Se sim, explique</label>
              <input className="form-control" {...register("p_mania_ctx")} />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">O que deixa desconfortável/irrita?</label>
            <textarea className="form-control" rows={2} {...register("p_irrita")} />
          </div>

          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Possui algum medo?</label>
              <select className="form-select" {...register("p_medo")}>
                <option value="">Selecione…</option>
                {yesNo.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="col-md-8">
              <label className="form-label">Se sim, explique</label>
              <input className="form-control" {...register("p_medo_ctx")} />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">O que acalma quando está incomodado(a)?</label>
            <textarea className="form-control" rows={2} {...register("p_acalma")} />
          </div>

          <div className="mb-3">
            <label className="form-label">Como se comporta com desconforto físico?</label>
            <textarea className="form-control" rows={2} {...register("p_desconforto_fisico")} />
          </div>

          <div className="mb-3">
            <label className="form-label">Como se comporta com desconforto emocional?</label>
            <textarea className="form-control" rows={2} {...register("p_desconforto_emocional")} />
          </div>

          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Situação atual/passada causando desconforto?</label>
              <select className="form-select" {...register("p_situacao")}>
                <option value="">Selecione…</option>
                {yesNo.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="col-md-8">
              <label className="form-label">Explique</label>
              <input className="form-control" {...register("p_situacao_ctx")} />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Como estão lidando (participante e família)?</label>
            <textarea className="form-control" rows={2} {...register("p_como_lida")} />
          </div>

          <hr className="my-4" />

          {/* Necessidades específicas */}
          <h5 className="mb-3">Necessidades específicas</h5>
          <div className="row g-2 mb-2">
            <div className="col-6 col-md-3"><label><input type="checkbox" {...register("ne_auditiva")} /> Auditiva</label></div>
            <div className="col-6 col-md-3"><label><input type="checkbox" {...register("ne_visual")} /> Visual</label></div>
            <div className="col-6 col-md-3"><label><input type="checkbox" {...register("ne_fisica")} /> Física</label></div>
            <div className="col-6 col-md-3"><label><input type="checkbox" {...register("ne_psicossocial")} /> Psicossocial</label></div>
            <div className="col-6 col-md-3"><label><input type="checkbox" {...register("ne_intelectual")} /> Intelectual</label></div>
            <div className="col-6 col-md-3"><label><input type="checkbox" {...register("ne_altas")} /> Altas habilidades</label></div>
          </div>
          <input className="form-control mb-3" placeholder="Outros (opcional)" {...register("ne_outros")} />

          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Possui alguma necessidade específica?</label>
              <select className="form-select" {...register("ne_possui")}>
                <option value="">Selecione…</option>
                {yesNo.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="col-md-8">
              <label className="form-label">Explique</label>
              <input className="form-control" {...register("ne_possui_ctx")} />
            </div>
          </div>

          <div className="row g-3 mt-2">
            <div className="col-md-4">
              <label className="form-label">Alguma outra questão que impacte o bem-estar?</label>
              <select className="form-select" {...register("ne_outras")}>
                <option value="">Selecione…</option>
                {yesNo.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="col-md-8">
              <label className="form-label">Explique</label>
              <input className="form-control" {...register("ne_outras_ctx")} />
            </div>
          </div>

          <hr className="my-4" />

          {/* Declaração */}
          <h5 className="mb-2">Declaração</h5>
          <div className="form-check mb-2">
            <input className="form-check-input" type="checkbox" id="decl_true" {...register("decl_true", { required: true })} />
            <label className="form-check-label" htmlFor="decl_true">
              Reconheço a veracidade das informações prestadas.
            </label>
          </div>
          <div className="col-md-4 mb-3">
            <label className="form-label">Data</label>
            <input type="date" className="form-control" {...register("decl_data")} />
          </div>

          <div className="d-flex justify-content-end mt-3">
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Enviar inscrição"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
