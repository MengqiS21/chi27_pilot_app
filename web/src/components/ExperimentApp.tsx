"use client";

import { useCallback, useState } from "react";
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
  MessagesSquare,
  Scale,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  Bot,
  UserCircle,
} from "lucide-react";
import { ChatPanel } from "@/components/ChatPanel";
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
import { SCENARIOS } from "@/content/scenarios";
import {
  SECTION_A,
  SECTION_A_KEYS,
  SECTION_B,
  SECTION_B_LIKERT_KEYS,
  SECTION_C,
  SCREENING,
} from "@/content/survey-items";
import {
  currentCondition,
  currentScenarioType,
  isExperiencedScenario,
  resetScenarioChat,
} from "@/lib/experiment-helpers";
import { STUDY } from "@/lib/study-config";
import { INITIAL_STATE, type ExperimentState } from "@/lib/types";

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
    emptyLikert(SECTION_B_LIKERT_KEYS)
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
        scenarioOrder: data.scenarioOrder,
        experiencedScenarioIndex: data.experiencedScenarioIndex,
        assignedCondition: data.assignedCondition,
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

  const handleConsentContinue = async () => {
    setError(null);
    setLoading(true);
    try {
      await patchStage("scenario_view", 0);
      setState((s) => ({ ...s, stage: "scenario_view", scenarioIndex: 0 }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const goToNextScenarioOrSectionC = async () => {
    const nextIndex = state.scenarioIndex + 1;
    if (nextIndex >= state.scenarioOrder.length) {
      await patchStage("section_c");
      setState((s) => ({ ...s, stage: "section_c" }));
      return;
    }
    await patchStage("scenario_view", nextIndex);
    setState((s) => ({
      ...s,
      stage: "scenario_view",
      scenarioIndex: nextIndex,
      ...resetScenarioChat(),
    }));
    setSectionA(emptyLikert(SECTION_A_KEYS));
  };

  const handleScenarioViewContinue = async () => {
    setError(null);
    setLoading(true);
    try {
      if (isExperiencedScenario(state)) {
        await patchStage("scenario_chat", state.scenarioIndex);
        setState((s) => ({ ...s, stage: "scenario_chat" }));
      } else {
        await patchStage("section_a", state.scenarioIndex);
        setState((s) => ({ ...s, stage: "section_a" }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    const text = chatInput.trim();
    if (!text || loading || state.refusalDelivered) return;

    setError(null);
    setLoading(true);
    const nextTurn = state.turnCount + 1;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: state.participantId,
          messages: state.messages,
          condition: currentCondition(state),
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
          { role: "user", content: text },
          { role: "assistant", content: data.assistantText },
        ],
        turnCount: nextTurn,
        refusalDelivered: data.refusalDelivered ?? nextTurn >= 3,
      }));
      setChatInput("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not get a response from the AI.");
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToSectionA = async () => {
    setError(null);
    setLoading(true);
    try {
      await patchStage("section_a", state.scenarioIndex);
      setState((s) => ({ ...s, stage: "section_a" }));
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

      if (isExperiencedScenario(state)) {
        await patchStage("section_b", state.scenarioIndex);
        setState((s) => ({ ...s, stage: "section_b" }));
      } else {
        await goToNextScenarioOrSectionC();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleSectionBSubmit = async () => {
    setError(null);
    if (!allLikertAnswered(sectionBLikert, SECTION_B_LIKERT_KEYS)) {
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
      await goToNextScenarioOrSectionC();
      setSectionBLikert(emptyLikert(SECTION_B_LIKERT_KEYS));
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
      <PageHeader
        title="Scenario ratings"
        lead={
          isExperiencedScenario(state)
            ? "Based on the scenario and conversation you just completed."
            : "Based on the scenario you just read."
        }
        icon={Eye}
      />
      <div className="card">
        <p className="mb-6 text-[0.9375rem] text-muted">
          {SECTION_A.realism.instruction}
        </p>
        <SectionHeading icon={Eye}>{SECTION_A.realism.title}</SectionHeading>
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
      <PageHeader
        title="Your experience with the AI"
        lead="Please answer based on the conversation you just had."
        icon={MessageSquare}
      />
      <div className="card">
        <p className="mb-6 text-[0.9375rem] text-muted">
          {SECTION_B.understanding.instruction}
        </p>
        <SectionHeading icon={Compass}>
          {SECTION_B.understanding.title}
        </SectionHeading>
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
        <SectionHeading icon={Scale}>{SECTION_B.rupture.title}</SectionHeading>
        <LikertBlock
          items={SECTION_B.rupture.items.map((i) => i.text)}
          keys={SECTION_B.rupture.items.map((i) => i.key)}
          values={sectionBLikert}
          namePrefix="b"
          scale={SECTION_B.rupture.scale}
          onChange={(key, value) =>
            setSectionBLikert((prev) => ({ ...prev, [key]: value }))
          }
        />
        <hr className="my-8 border-border" />
        <SectionHeading icon={Compass}>{SECTION_B.guidance.title}</SectionHeading>
        <LikertBlock
          items={SECTION_B.guidance.items.map((i) => i.text)}
          keys={SECTION_B.guidance.items.map((i) => i.key)}
          values={sectionBLikert}
          namePrefix="b"
          scale={SECTION_B.guidance.scale}
          onChange={(key, value) =>
            setSectionBLikert((prev) => ({ ...prev, [key]: value }))
          }
        />
        <hr className="my-8 border-border" />
        <SectionHeading icon={HeartHandshake}>
          {SECTION_B.continuity.title}
        </SectionHeading>
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

  return (
    <main className="page-shell">
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
        <>
          <PageHeader title={SCENARIOS[currentScenarioType(state)].title} />
          <div className="scenario-box">
            {SCENARIOS[currentScenarioType(state)].text}
          </div>
          <div className="card">
            <p className="mb-6 text-[0.9375rem] text-muted">
              {isExperiencedScenario(state)
                ? "Please read the scenario above. On the next page you will have a short conversation with an AI, as if you were in this situation."
                : "Please read the scenario above carefully. You will answer a few questions about it on the next page."}
            </p>
            <button
              type="button"
              className="btn-primary inline-flex items-center gap-2"
              disabled={loading}
              onClick={() => void handleScenarioViewContinue()}
            >
              Continue
              <ArrowRight size={18} strokeWidth={2} aria-hidden />
            </button>
          </div>
        </>
      )}

      {state.stage === "scenario_chat" && state.scenarioOrder.length > 0 && (
        <>
          <PageHeader title={SCENARIOS[currentScenarioType(state)].title} />
          <div className="scenario-box">
            {SCENARIOS[currentScenarioType(state)].text}
          </div>
          <div className="card">
            <p className="mb-1 flex items-center gap-2 text-base font-semibold text-ink">
              <MessagesSquare
                size={20}
                strokeWidth={2}
                className="shrink-0 text-accent"
                aria-hidden
              />
              Conversation with the AI
            </p>
            <p className="mb-6 text-[0.9375rem] text-muted">
              Share what you might say in this situation. The AI will respond
              after each message.
            </p>
            <ChatPanel messages={state.messages} />
            {state.refusalDelivered ? (
              <button
                type="button"
                className="btn-primary inline-flex items-center gap-2"
                disabled={loading}
                onClick={() => void handleContinueToSectionA()}
              >
                Continue to questions
                <ArrowRight size={18} strokeWidth={2} aria-hidden />
              </button>
            ) : (
              <form
                className="mt-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSendMessage();
                }}
              >
                <label className="field-label" htmlFor="chat-input">
                  Your message
                </label>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <textarea
                    id="chat-input"
                    className="field-input min-h-[88px] flex-1 resize-y"
                    rows={3}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type here…"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    className="btn-primary inline-flex shrink-0 items-center gap-2"
                    disabled={loading || !chatInput.trim()}
                  >
                    {loading ? "AI is typing…" : "Send"}
                    {!loading ? (
                      <Send size={18} strokeWidth={2} aria-hidden />
                    ) : null}
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}

      {state.stage === "section_a" && renderSectionA()}
      {state.stage === "section_b" && renderSectionB()}

      {state.stage === "section_c" && (
        <>
          <PageHeader
            title="Your feedback"
            lead="Help us improve the study materials."
            icon={ClipboardPen}
          />
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
          <PageHeader
            title="About you"
            lead="Almost done — a few final questions."
            icon={UserCircle}
          />
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
