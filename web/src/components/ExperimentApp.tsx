"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  ClipboardPen,
  Compass,
  Eye,
  HeartHandshake,
  KeyRound,
  MessageSquare,
  Scale,
  ShieldCheck,
  Sparkles,
  Users,
  UserCircle,
} from "lucide-react";
import { ChatShell } from "@/components/ChatShell";
import {
  DemographicsForm,
  emptyDemographics,
  validateDemographics,
  type DemographicsValues,
} from "@/components/DemographicsForm";
import { LikertBlock } from "@/components/LikertBlock";
import { OpenTextBlock } from "@/components/OpenTextBlock";
import { PageHeader } from "@/components/PageHeader";
import { ProgressBar } from "@/components/ProgressBar";
import { SectionHeading } from "@/components/SectionHeading";
import { CONSENT_TEXT } from "@/content/consent";
import { SCENARIOS, USER_TASK_INSTRUCTIONS } from "@/content/scenarios";
import {
  DEMOGRAPHICS,
  SECTION_A,
  SECTION_A_KEYS,
  SECTION_B,
  SECTION_B_LIKERT_KEYS_GROUP_2,
  SECTION_C,
  SCREENING,
  sectionBLikertKeysForGroup,
} from "@/content/survey-items";
import {
  currentCondition,
  currentScenarioType,
  isGroup2,
  resetScenarioChat,
} from "@/lib/experiment-helpers";
import { STUDY, maxUserTurnsForGroup } from "@/lib/study-config";
import { INITIAL_STATE, type ExperimentState } from "@/lib/types";
import { scrollPageToTop, useFadeTransition } from "@/lib/use-fade-transition";

function emptyLikert(keys: readonly string[]): Record<string, number | null> {
  return Object.fromEntries(keys.map((k) => [k, null]));
}

function emptyText(keys: readonly string[]): Record<string, string> {
  return Object.fromEntries(keys.map((k) => [k, ""]));
}

function allLikertAnswered(
  values: Record<string, number | null>,
  keys: readonly string[]
): boolean {
  return keys.every((k) => values[k] !== null);
}

export function ExperimentApp() {
  const [state, setState] = useState<ExperimentState>({
    ...INITIAL_STATE,
    study: STUDY,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [accessCode, setAccessCode] = useState("");
  const [consentAgreed, setConsentAgreed] = useState(false);

  const [screening, setScreening] = useState<Record<string, string>>({});
  const [sectionA, setSectionA] = useState(() => emptyLikert(SECTION_A_KEYS));
  const [sectionBLikert, setSectionBLikert] = useState(() =>
    emptyLikert(SECTION_B_LIKERT_KEYS_GROUP_2)
  );
  const [sectionBText, setSectionBText] = useState(() =>
    emptyText(SECTION_B.perception.items.map((i) => i.key))
  );
  const [sectionC, setSectionC] = useState(() =>
    emptyText(SECTION_C.items.map((i) => i.key))
  );
  const [demographics, setDemographics] = useState<DemographicsValues>(
    emptyDemographics
  );

  const [chatInput, setChatInput] = useState("");
  const { visible: stageVisible, run: withStageFade } = useFadeTransition();

  useEffect(() => {
    scrollPageToTop();
  }, [state.stage, state.scenarioIndex]);

  const patchStage = useCallback(
    async (stage: string, scenarioIndex?: number) => {
      if (!state.participantId) return;
      const res = await fetch("/api/stage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: state.participantId,
          stage,
          scenarioIndex,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to update stage");
      }
    },
    [state.participantId]
  );

  const saveSurvey = useCallback(
    async (payload: {
      section: string;
      responses: Record<string, unknown>;
      nextStage?: string;
      scenarioIndex?: number;
      scenarioType?: string;
      complete?: boolean;
    }) => {
      const res = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: state.participantId,
          ...payload,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
    },
    [state.participantId]
  );

  const handleBegin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? "Could not start session";
        if (msg.toLowerCase().includes("row-level security")) {
          throw new Error(
            "Database permission error (RLS). Run schema.sql in Supabase, then try again."
          );
        }
        throw new Error(msg);
      }
      setState((s) => ({
        ...s,
        participantId: data.participantId,
        scenarioIndex: 0,
        stage: "screening",
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start session");
    } finally {
      setLoading(false);
    }
  };

  const handleScreeningContinue = async () => {
    setError(null);
    for (const item of SCREENING.items) {
      if (!screening[item.key]) {
        setError("Please answer all screening questions.");
        return;
      }
    }

    const screenedOut = SCREENING.items.some(
      (item) => screening[item.key] === item.screenOut
    );

    setLoading(true);
    try {
      await saveSurvey({
        section: "screening",
        responses: screening,
        nextStage: screenedOut ? "screened_out" : "consent",
      });

      if (screenedOut) {
        setState((s) => ({ ...s, stage: "screened_out" }));
      } else {
        setState((s) => ({ ...s, stage: "consent" }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const enterScenarioSectionA = async (index: number) => {
    await withStageFade(async () => {
      await patchStage("section_a", index);
      setSectionA(emptyLikert(SECTION_A_KEYS));
      setState((s) => ({
        ...s,
        stage: "section_a",
        scenarioIndex: index,
      }));
    });
  };

  const goToInteractionPrep = async () => {
    const chatIndex = state.experiencedScenarioIndex;
    await withStageFade(async () => {
      await patchStage("scenario_view", chatIndex);
      setState((s) => ({
        ...s,
        stage: "scenario_view",
        scenarioIndex: chatIndex,
        ...resetScenarioChat(),
      }));
    });
  };

  const handleConsentContinue = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: state.participantId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not assign condition");

      const nextState = {
        scenarioOrder: data.scenarioOrder as ExperimentState["scenarioOrder"],
        experiencedScenarioIndex: data.experiencedScenarioIndex as number,
        interactionScenario:
          data.interactionScenario as ExperimentState["interactionScenario"],
        pilotGroup: data.pilotGroup as ExperimentState["pilotGroup"],
        assignedCondition:
          data.assignedCondition as ExperimentState["assignedCondition"],
      };

      const bKeys = sectionBLikertKeysForGroup(nextState.pilotGroup);
      setSectionBLikert(emptyLikert(bKeys));

      await withStageFade(async () => {
        await patchStage("section_a", 0);
        setSectionA(emptyLikert(SECTION_A_KEYS));
        setState((s) => ({
          ...s,
          ...nextState,
          stage: "section_a",
          scenarioIndex: 0,
          ...resetScenarioChat(),
        }));
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleScenarioViewContinue = async () => {
    setError(null);
    setLoading(true);
    try {
      await withStageFade(async () => {
        await patchStage("scenario_chat", state.scenarioIndex);
        setState((s) => ({ ...s, stage: "scenario_chat" }));
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    const text = chatInput.trim();
    if (!text || loading || state.refusalDelivered || !state.pilotGroup) return;

    setError(null);
    const priorMessages = state.messages;
    const nextTurn = state.turnCount + 1;
    const maxTurns = maxUserTurnsForGroup(state.pilotGroup);

    setChatInput("");
    setState((s) => ({
      ...s,
      messages: [...s.messages, { role: "user", content: text }],
    }));
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: state.participantId,
          messages: priorMessages,
          condition: currentCondition(state),
          pilotGroup: state.pilotGroup,
          scenarioType: currentScenarioType(state),
          scenarioIndex: state.scenarioIndex,
          turnCount: nextTurn,
          userContent: text,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Chat failed");

      setState((s) => ({
        ...s,
        messages: [
          ...s.messages,
          { role: "assistant", content: data.assistantText },
        ],
        turnCount: nextTurn,
        refusalDelivered: data.refusalDelivered ?? nextTurn >= maxTurns,
      }));
    } catch (e) {
      setState((s) => ({ ...s, messages: priorMessages }));
      setChatInput(text);
      setError(e instanceof Error ? e.message : "Could not get a response from the AI.");
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToSectionB = async () => {
    setError(null);
    setLoading(true);
    try {
      await withStageFade(async () => {
        await patchStage("section_b", state.scenarioIndex);
        setState((s) => ({ ...s, stage: "section_b" }));
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleSectionASubmit = async () => {
    setError(null);
    if (!allLikertAnswered(sectionA, SECTION_A_KEYS)) {
      setError("Please answer all items before continuing.");
      return;
    }

    setLoading(true);
    try {
      await saveSurvey({
        section: "section_a",
        responses: sectionA,
        scenarioIndex: state.scenarioIndex,
        scenarioType: currentScenarioType(state),
      });

      const nextIndex = state.scenarioIndex + 1;
      if (nextIndex < state.scenarioOrder.length) {
        await enterScenarioSectionA(nextIndex);
      } else {
        await goToInteractionPrep();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleSectionBSubmit = async () => {
    setError(null);
    const bKeys = sectionBLikertKeysForGroup(state.pilotGroup);
    if (!allLikertAnswered(sectionBLikert, bKeys)) {
      setError("Please answer all items before continuing.");
      return;
    }
    if (!sectionBText.per1?.trim()) {
      setError("Please answer the open-ended question.");
      return;
    }

    setLoading(true);
    try {
      await saveSurvey({
        section: "section_b",
        responses: { ...sectionBLikert, ...sectionBText },
        scenarioIndex: state.scenarioIndex,
        scenarioType: currentScenarioType(state),
      });
      await patchStage("section_c");
      setState((s) => ({ ...s, stage: "section_c" }));
      setSectionBLikert(emptyLikert(bKeys));
      setSectionBText(emptyText(SECTION_B.perception.items.map((i) => i.key)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleSectionCSubmit = async () => {
    setError(null);
    const keys = SECTION_C.items.map((i) => i.key);
    if (keys.some((k) => !sectionC[k]?.trim())) {
      setError("Please answer all feedback questions.");
      return;
    }

    setLoading(true);
    try {
      await saveSurvey({
        section: "section_c",
        responses: sectionC,
        nextStage: "demographics",
      });
      setState((s) => ({ ...s, stage: "demographics" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleDemographicsSubmit = async () => {
    setError(null);
    const validationError = validateDemographics(demographics);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await saveSurvey({
        section: "demographics",
        responses: demographics,
        complete: true,
      });
      setState((s) => ({ ...s, stage: "debrief" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const showProgress =
    state.stage === "scenario_view" ||
    state.stage === "scenario_chat" ||
    state.stage === "section_a" ||
    state.stage === "section_b";

  const progressStep =
    state.stage === "section_b"
      ? state.scenarioIndex + 1
      : state.scenarioIndex + 1;

  const renderSectionA = () => (
    <>
      <PageHeader title={SECTION_A.title} icon={Eye} />
      <div className="scenario-box">
        {SCENARIOS[currentScenarioType(state)].text}
      </div>
      <div className="card">
        <SectionHeading icon={Eye}>{SECTION_A.realism.title}</SectionHeading>
        <p className="mb-4 text-[0.9375rem] leading-relaxed text-muted">
          {SECTION_A.realism.instruction}
        </p>
        <LikertBlock
          items={SECTION_A.realism.items.map((i) => i.text)}
          keys={SECTION_A.realism.items.map((i) => i.key)}
          values={sectionA}
          namePrefix={`a_${state.scenarioIndex}`}
          scale={SECTION_A.realism.scale}
          onChange={(key, value) =>
            setSectionA((prev) => ({ ...prev, [key]: value }))
          }
        />
        <hr className="my-8 border-border" />
        <SectionHeading icon={HeartHandshake}>
          {SECTION_A.engagement.title}
        </SectionHeading>
        <p className="mb-4 text-[0.9375rem] leading-relaxed text-muted">
          {SECTION_A.engagement.instruction}
        </p>
        <LikertBlock
          items={SECTION_A.engagement.items.map((i) => i.text)}
          keys={SECTION_A.engagement.items.map((i) => i.key)}
          values={sectionA}
          namePrefix={`a_${state.scenarioIndex}`}
          scale={SECTION_A.engagement.scale}
          onChange={(key, value) =>
            setSectionA((prev) => ({ ...prev, [key]: value }))
          }
        />
        <hr className="my-8 border-border" />
        <SectionHeading icon={Scale}>{SECTION_A.severity.title}</SectionHeading>
        <p className="mb-4 text-[0.9375rem] leading-relaxed text-muted">
          {SECTION_A.severity.instruction}
        </p>
        <LikertBlock
          items={SECTION_A.severity.items.map((i) => i.text)}
          keys={SECTION_A.severity.items.map((i) => i.key)}
          values={sectionA}
          namePrefix={`a_${state.scenarioIndex}`}
          scale={SECTION_A.severity.scale}
          onChange={(key, value) =>
            setSectionA((prev) => ({ ...prev, [key]: value }))
          }
        />
        <button
          type="button"
          className="btn-primary mt-8 inline-flex items-center gap-2"
          disabled={loading}
          onClick={() => void handleSectionASubmit()}
        >
          Continue
          <ArrowRight size={18} strokeWidth={2} aria-hidden />
        </button>
      </div>
    </>
  );

  const renderSectionB = () => (
    <>
      <PageHeader title={SECTION_B.title} icon={MessageSquare} />
      <div className="card">
        <SectionHeading icon={Compass}>
          {SECTION_B.understanding.title}
        </SectionHeading>
        <p className="mb-4 text-[0.9375rem] leading-relaxed text-muted">
          {SECTION_B.understanding.instruction}
        </p>
        <LikertBlock
          items={SECTION_B.understanding.items.map((i) => i.text)}
          keys={SECTION_B.understanding.items.map((i) => i.key)}
          values={sectionBLikert}
          namePrefix="b"
          scale={SECTION_B.understanding.scale}
          onChange={(key, value) =>
            setSectionBLikert((prev) => ({ ...prev, [key]: value }))
          }
        />
        <hr className="my-8 border-border" />
        <SectionHeading icon={Users}>{SECTION_B.agency.title}</SectionHeading>
        <p className="mb-4 text-[0.9375rem] leading-relaxed text-muted">
          {SECTION_B.agency.instruction}
        </p>
        <LikertBlock
          items={SECTION_B.agency.items.map((i) => i.text)}
          keys={SECTION_B.agency.items.map((i) => i.key)}
          values={sectionBLikert}
          namePrefix="b"
          scale={SECTION_B.agency.scale}
          onChange={(key, value) =>
            setSectionBLikert((prev) => ({ ...prev, [key]: value }))
          }
        />
        <hr className="my-8 border-border" />
        <SectionHeading icon={HeartHandshake}>
          {SECTION_B.continuity.title}
        </SectionHeading>
        <p className="mb-4 text-[0.9375rem] leading-relaxed text-muted">
          {SECTION_B.continuity.instruction}
        </p>
        <LikertBlock
          items={SECTION_B.continuity.items.map((i) => i.text)}
          keys={SECTION_B.continuity.items.map((i) => i.key)}
          values={sectionBLikert}
          namePrefix="b"
          scale={SECTION_B.continuity.scale}
          onChange={(key, value) =>
            setSectionBLikert((prev) => ({ ...prev, [key]: value }))
          }
        />
        {isGroup2(state) ? (
          <>
            <hr className="my-8 border-border" />
            <SectionHeading icon={Compass}>
              {SECTION_B.manipulationCheck.title}
            </SectionHeading>
            <p className="mb-4 text-[0.9375rem] leading-relaxed text-muted">
              {SECTION_B.manipulationCheck.instruction}
            </p>
            <SectionHeading icon={Compass}>
              {SECTION_B.manipulationCheck.attitude.title}
            </SectionHeading>
            <LikertBlock
              items={SECTION_B.manipulationCheck.attitude.items.map((i) => i.text)}
              keys={SECTION_B.manipulationCheck.attitude.items.map((i) => i.key)}
              values={sectionBLikert}
              namePrefix="b"
              scale={SECTION_B.manipulationCheck.scale}
              onChange={(key, value) =>
                setSectionBLikert((prev) => ({ ...prev, [key]: value }))
              }
            />
            <hr className="my-8 border-border" />
            <SectionHeading icon={Users}>
              {SECTION_B.manipulationCheck.norms.title}
            </SectionHeading>
            <LikertBlock
              items={SECTION_B.manipulationCheck.norms.items.map((i) => i.text)}
              keys={SECTION_B.manipulationCheck.norms.items.map((i) => i.key)}
              values={sectionBLikert}
              namePrefix="b"
              scale={SECTION_B.manipulationCheck.scale}
              onChange={(key, value) =>
                setSectionBLikert((prev) => ({ ...prev, [key]: value }))
              }
            />
            <hr className="my-8 border-border" />
            <SectionHeading icon={Scale}>
              {SECTION_B.manipulationCheck.pbc.title}
            </SectionHeading>
            <LikertBlock
              items={SECTION_B.manipulationCheck.pbc.items.map((i) => i.text)}
              keys={SECTION_B.manipulationCheck.pbc.items.map((i) => i.key)}
              values={sectionBLikert}
              namePrefix="b"
              scale={SECTION_B.manipulationCheck.scale}
              onChange={(key, value) =>
                setSectionBLikert((prev) => ({ ...prev, [key]: value }))
              }
            />
          </>
        ) : null}
        <hr className="my-8 border-border" />
        <SectionHeading icon={MessageSquare}>
          {SECTION_B.perception.title}
        </SectionHeading>
        <OpenTextBlock
          items={SECTION_B.perception.items}
          values={sectionBText}
          namePrefix="b"
          onChange={(key, value) =>
            setSectionBText((prev) => ({ ...prev, [key]: value }))
          }
        />
        <hr className="my-8 border-border" />
        <SectionHeading icon={Scale}>{SECTION_B.timing.title}</SectionHeading>
        <p className="mb-4 text-[0.9375rem] leading-relaxed text-muted">
          {SECTION_B.timing.instruction}
        </p>
        <LikertBlock
          items={SECTION_B.timing.items.map((i) => i.text)}
          keys={SECTION_B.timing.items.map((i) => i.key)}
          values={sectionBLikert}
          namePrefix="b"
          scale={SECTION_B.timing.scale}
          onChange={(key, value) =>
            setSectionBLikert((prev) => ({ ...prev, [key]: value }))
          }
        />
        <button
          type="button"
          className="btn-primary mt-8 inline-flex items-center gap-2"
          disabled={loading}
          onClick={() => void handleSectionBSubmit()}
        >
          Continue
          <ArrowRight size={18} strokeWidth={2} aria-hidden />
        </button>
      </div>
    </>
  );

  const scenarioType = currentScenarioType(state);
  const scenario = SCENARIOS[scenarioType];

  return (
    <main
      className={`page-shell ${state.stage === "scenario_chat" ? "page-shell-chat" : ""}`}
    >
      {showProgress ? <ProgressBar current={progressStep} total={3} /> : null}

      {error ? (
        <p className="alert-error mb-6" role="alert">
          {error}
        </p>
      ) : null}

      {state.stage === "landing" && (
        <>
          <PageHeader
            title="Welcome"
            lead="Thank you for participating in this research study."
            icon={Sparkles}
          />
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 sm:max-w-sm">
              <div className="field-label-row">
                <KeyRound
                  size={18}
                  strokeWidth={2}
                  className="shrink-0 text-accent"
                  aria-hidden
                />
                <label className="field-label" htmlFor="access-code">
                  Access code
                </label>
              </div>
              <input
                id="access-code"
                className="field-input w-full"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                autoComplete="off"
              />
            </div>
            <button
              type="button"
              className="btn-primary shrink-0 sm:mb-0.5"
              disabled={loading}
              onClick={() => void handleBegin()}
            >
              {loading ? "Starting…" : "Begin"}
            </button>
          </div>
        </>
      )}

      {state.stage === "screening" && (
        <>
          <PageHeader
            title="Screening Questions"
            lead="Please answer the following questions to confirm your eligibility."
            icon={ClipboardList}
          />
          <div className="card space-y-8">
            {SCREENING.items.map((item) => (
              <fieldset key={item.key}>
                <legend className="field-label mb-3">{item.text}</legend>
                <div className="space-y-2">
                  {item.options.map((opt) => (
                    <label key={opt.value} className="checkbox-row">
                      <input
                        type="radio"
                        name={item.key}
                        value={opt.value}
                        checked={screening[item.key] === opt.value}
                        onChange={() =>
                          setScreening((prev) => ({
                            ...prev,
                            [item.key]: opt.value,
                          }))
                        }
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
            <button
              type="button"
              className="btn-primary inline-flex items-center gap-2"
              disabled={loading}
              onClick={() => void handleScreeningContinue()}
            >
              Continue
              <ArrowRight size={18} strokeWidth={2} aria-hidden />
            </button>
          </div>
        </>
      )}

      {state.stage === "screened_out" && (
        <>
          <PageHeader
            title="Thank You"
            lead="Based on your responses, you are not eligible for this study. You may close this window."
            icon={CheckCircle2}
          />
        </>
      )}

      {state.stage === "consent" && (
        <>
          <PageHeader title="Before We Begin" icon={ClipboardList} />
          <div className="card">
            <div className="consent-box">{CONSENT_TEXT}</div>
            <hr className="my-8 border-border" />
            <label className="checkbox-row mb-6">
              <input
                type="checkbox"
                checked={consentAgreed}
                onChange={(e) => setConsentAgreed(e.target.checked)}
              />
              <span className="flex items-center gap-2">
                <ShieldCheck
                  size={18}
                  strokeWidth={2}
                  className="shrink-0 text-accent"
                  aria-hidden
                />
                I agree and wish to continue
              </span>
            </label>
            <button
              type="button"
              className="btn-primary inline-flex items-center gap-2"
              disabled={!consentAgreed || loading}
              onClick={() => void handleConsentContinue()}
            >
              Continue
              <ArrowRight size={18} strokeWidth={2} aria-hidden />
            </button>
          </div>
        </>
      )}

      {state.stage === "scenario_view" && state.scenarioOrder.length > 0 && (
        <div
          className={`stage-transition ${stageVisible ? "stage-transition-visible" : ""}`}
        >
          <PageHeader title={scenario.title} />
          <div className="card scenario-intro">
            <div className="scenario-box scenario-box-intro">{scenario.text}</div>
            <div className="scenario-intro-lead whitespace-pre-line">
              {USER_TASK_INSTRUCTIONS}
            </div>
            <button
              type="button"
              className="btn-primary inline-flex items-center gap-2"
              disabled={loading}
              onClick={() => void handleScenarioViewContinue()}
            >
              Start conversation
              <ArrowRight size={18} strokeWidth={2} aria-hidden />
            </button>
          </div>
        </div>
      )}

      {state.stage === "scenario_chat" && state.scenarioOrder.length > 0 && (
        <div
          className={`stage-transition ${stageVisible ? "stage-transition-visible" : ""}`}
        >
          <ChatShell
            scenarioTitle={scenario.title}
            scenarioText={scenario.text}
            messages={state.messages}
            input={chatInput}
            onInputChange={setChatInput}
            onSend={() => void handleSendMessage()}
            isLoading={loading}
            refusalDelivered={state.refusalDelivered}
            onContinue={() => void handleContinueToSectionB()}
            continueLabel="Continue to questions"
          />
        </div>
      )}

      {state.stage === "section_a" && (
        <div
          className={`stage-transition ${stageVisible ? "stage-transition-visible" : ""}`}
        >
          {renderSectionA()}
        </div>
      )}
      {state.stage === "section_b" && renderSectionB()}

      {state.stage === "section_c" && (
        <>
          <PageHeader title={SECTION_C.title} icon={ClipboardPen} />
          <div className="card">
            <OpenTextBlock
              items={SECTION_C.items}
              values={sectionC}
              namePrefix="c"
              onChange={(key, value) =>
                setSectionC((prev) => ({ ...prev, [key]: value }))
              }
            />
            <button
              type="button"
              className="btn-primary mt-8 inline-flex items-center gap-2"
              disabled={loading}
              onClick={() => void handleSectionCSubmit()}
            >
              Continue
              <ArrowRight size={18} strokeWidth={2} aria-hidden />
            </button>
          </div>
        </>
      )}

      {state.stage === "demographics" && (
        <>
          <PageHeader title={DEMOGRAPHICS.title} icon={UserCircle} />
          <div className="card">
            <DemographicsForm values={demographics} onChange={setDemographics} />
            <button
              type="button"
              className="btn-primary mt-8 inline-flex items-center gap-2"
              disabled={loading}
              onClick={() => void handleDemographicsSubmit()}
            >
              Submit
              <ArrowRight size={18} strokeWidth={2} aria-hidden />
            </button>
          </div>
        </>
      )}

      {state.stage === "debrief" && (
        <>
          <PageHeader
            title="You're All Done"
            lead="Thank you for your time. You may close this browser window when you're ready."
            icon={CheckCircle2}
          />
          <div className="card">
            <p className="text-base leading-relaxed text-ink">
              If you have questions about this research, please contact the study
              team at <strong>[researcher email]</strong>.
            </p>
          </div>
        </>
      )}
    </main>
  );
}
