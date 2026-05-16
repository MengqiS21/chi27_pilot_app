"use client";

import { useCallback, useState } from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { LikertBlock } from "@/components/LikertBlock";
import { PageHeader } from "@/components/PageHeader";
import { ProgressBar } from "@/components/ProgressBar";
import { CONSENT_TEXT } from "@/content/consent";
import { SCENARIOS } from "@/content/scenarios";
import {
  POST_SURVEY,
  POST_SURVEY_KEYS,
  PRE_SURVEY,
  PRE_SURVEY_KEYS,
} from "@/content/survey-items";
import {
  currentCondition,
  currentScenarioType,
  resetScenarioChat,
} from "@/lib/experiment-helpers";
import { INITIAL_STATE, type ExperimentState } from "@/lib/types";

function emptyLikert(keys: readonly string[]): Record<string, number | null> {
  return Object.fromEntries(keys.map((k) => [k, null]));
}

export function ExperimentApp() {
  const [state, setState] = useState<ExperimentState>(INITIAL_STATE);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [accessCode, setAccessCode] = useState("");
  const [consentAgreed, setConsentAgreed] = useState(false);

  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [priorAiUse, setPriorAiUse] = useState("");
  const [preLikert, setPreLikert] = useState(() => ({
    ...emptyLikert(PRE_SURVEY_KEYS.social_support),
    ...emptyLikert(PRE_SURVEY_KEYS.ai_reliance),
    ...emptyLikert(PRE_SURVEY_KEYS.disclosure_comfort),
  }));

  const [postLikert, setPostLikert] = useState(() => ({
    ...emptyLikert(POST_SURVEY_KEYS.goal_disengagement),
    ...emptyLikert(POST_SURVEY_KEYS.behavioral_intention),
    ...emptyLikert(POST_SURVEY_KEYS.mediators),
  }));

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
            "Database permission error (RLS). Run the full schema.sql in your Supabase SQL editor, then try again."
          );
        }
        throw new Error(msg);
      }
      setState((s) => ({
        ...s,
        participantId: data.participantId,
        scenarioOrder: data.scenarioOrder,
        conditionOrder: data.conditionOrder,
        scenarioIndex: 0,
        stage: "consent",
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start session");
    } finally {
      setLoading(false);
    }
  };

  const handleConsentContinue = async () => {
    setError(null);
    setLoading(true);
    try {
      await patchStage("pre_survey");
      setState((s) => ({ ...s, stage: "pre_survey" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const handlePreSurveyContinue = async () => {
    setError(null);
    if (!age.trim()) {
      setError("Please enter your age.");
      return;
    }
    if (!gender) {
      setError("Please select your gender.");
      return;
    }
    if (!priorAiUse) {
      setError("Please answer how often you use AI chatbots.");
      return;
    }
    if (Object.values(preLikert).some((v) => v === null)) {
      setError("Please answer all survey items.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/pre-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: state.participantId,
          age: age.trim(),
          gender,
          prior_ai_use: priorAiUse,
          ...preLikert,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");

      setState((s) => ({
        ...s,
        stage: "scenario_chat",
        scenarioIndex: 0,
        ...resetScenarioChat(s),
      }));
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

  const handleContinueToSurvey = async () => {
    setError(null);
    setLoading(true);
    try {
      await patchStage("post_survey", state.scenarioIndex);
      setState((s) => ({ ...s, stage: "post_survey" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const handlePostSurveySubmit = async () => {
    setError(null);
    if (Object.values(postLikert).some((v) => v === null)) {
      setError("Please answer all items before continuing.");
      return;
    }

    setLoading(true);
    const idx = state.scenarioIndex;
    const nextIndex = idx + 1;
    const complete = nextIndex >= 4;

    try {
      const res = await fetch("/api/post-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: state.participantId,
          scenarioIndex: idx,
          scenarioType: currentScenarioType(state),
          condition: currentCondition(state),
          responses: postLikert,
          complete,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");

      setPostLikert({
        ...emptyLikert(POST_SURVEY_KEYS.goal_disengagement),
        ...emptyLikert(POST_SURVEY_KEYS.behavioral_intention),
        ...emptyLikert(POST_SURVEY_KEYS.mediators),
      });

      if (complete) {
        setState((s) => ({ ...s, stage: "debrief" }));
      } else {
        setState((s) => ({
          ...s,
          stage: "scenario_chat",
          scenarioIndex: nextIndex,
          ...resetScenarioChat(s),
        }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const showProgress =
    state.stage === "scenario_chat" || state.stage === "post_survey";

  return (
    <main className="page-shell">
      {showProgress ? (
        <ProgressBar current={state.scenarioIndex + 1} />
      ) : null}

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
          />
          <div className="card">
            <label className="field-label" htmlFor="access-code">
              Access code
            </label>
            <input
              id="access-code"
              className="field-input mb-6 max-w-sm"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              autoComplete="off"
            />
            <button
              type="button"
              className="btn-primary"
              disabled={loading}
              onClick={handleBegin}
            >
              {loading ? "Starting…" : "Begin"}
            </button>
          </div>
        </>
      )}

      {state.stage === "consent" && (
        <>
          <PageHeader title="Before We Begin" />
          <div className="card">
            <div className="consent-box">{CONSENT_TEXT}</div>
            <hr className="my-8 border-border" />
            <label className="checkbox-row mb-6">
              <input
                type="checkbox"
                checked={consentAgreed}
                onChange={(e) => setConsentAgreed(e.target.checked)}
              />
              <span>I agree and wish to continue</span>
            </label>
            <button
              type="button"
              className="btn-primary"
              disabled={!consentAgreed || loading}
              onClick={handleConsentContinue}
            >
              Continue
            </button>
          </div>
        </>
      )}

      {state.stage === "pre_survey" && (
        <>
          <PageHeader
            title="A Few Questions About You"
            lead="There are no right or wrong answers."
          />
          <div className="card">
            <label className="field-label" htmlFor="age">
              What is your age?
            </label>
            <input
              id="age"
              className="field-input mb-6 max-w-xs"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />

            <label className="field-label" htmlFor="gender">
              What is your gender?
            </label>
            <select
              id="gender"
              className="field-select mb-6"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">Select an option…</option>
              <option>Woman</option>
              <option>Man</option>
              <option>Non-binary</option>
              <option>Prefer not to say</option>
              <option>Other</option>
            </select>

            <label className="field-label" htmlFor="prior-ai">
              How often have you used AI chatbots (e.g., ChatGPT, Claude) for personal or emotional topics?
            </label>
            <select
              id="prior-ai"
              className="field-select mb-8"
              value={priorAiUse}
              onChange={(e) => setPriorAiUse(e.target.value)}
            >
              <option value="">Select an option…</option>
              <option>Never</option>
              <option>Rarely</option>
              <option>Sometimes</option>
              <option>Often</option>
              <option>Very often</option>
            </select>

            <hr className="mb-8 border-border" />
            <h2 className="section-title mb-4">Social support</h2>
            <LikertBlock
              items={PRE_SURVEY.social_support}
              keys={PRE_SURVEY_KEYS.social_support}
              values={preLikert}
              namePrefix="pre"
              onChange={(key, value) =>
                setPreLikert((prev) => ({ ...prev, [key]: value }))
              }
            />

            <hr className="my-8 border-border" />
            <h2 className="section-title mb-4">AI use</h2>
            <LikertBlock
              items={PRE_SURVEY.ai_reliance}
              keys={PRE_SURVEY_KEYS.ai_reliance}
              values={preLikert}
              namePrefix="pre"
              onChange={(key, value) =>
                setPreLikert((prev) => ({ ...prev, [key]: value }))
              }
            />

            <hr className="my-8 border-border" />
            <h2 className="section-title mb-4">Comfort disclosing</h2>
            <LikertBlock
              items={PRE_SURVEY.disclosure_comfort}
              keys={PRE_SURVEY_KEYS.disclosure_comfort}
              values={preLikert}
              namePrefix="pre"
              onChange={(key, value) =>
                setPreLikert((prev) => ({ ...prev, [key]: value }))
              }
            />

            <button
              type="button"
              className="btn-primary mt-8"
              disabled={loading}
              onClick={handlePreSurveyContinue}
            >
              Continue to scenarios
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
            <p className="mb-1 text-base font-semibold text-ink">
              Conversation with the AI
            </p>
            <p className="mb-6 text-[0.9375rem] text-muted">
              Share what you might say in this situation. The AI will respond after
              each message.
            </p>

            <ChatPanel messages={state.messages} />

            {state.refusalDelivered ? (
              <button
                type="button"
                className="btn-primary"
                disabled={loading}
                onClick={handleContinueToSurvey}
              >
                Continue to Survey →
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
                    className="btn-primary shrink-0"
                    disabled={loading || !chatInput.trim()}
                  >
                    {loading ? "AI is typing…" : "Send"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}

      {state.stage === "post_survey" && (
        <>
          <PageHeader
            title="Your Thoughts"
            lead="Please rate how much you agree with each statement based on the conversation you just had."
          />
          <div className="card">
            <LikertBlock
              items={POST_SURVEY.goal_disengagement}
              keys={POST_SURVEY_KEYS.goal_disengagement}
              values={postLikert}
              namePrefix={`post_${state.scenarioIndex}`}
              onChange={(key, value) =>
                setPostLikert((prev) => ({ ...prev, [key]: value }))
              }
            />

            <hr className="my-8 border-border" />
            <h2 className="section-title mb-4">What you would do next</h2>
            <LikertBlock
              items={POST_SURVEY.behavioral_intention}
              keys={POST_SURVEY_KEYS.behavioral_intention}
              values={postLikert}
              namePrefix={`post_${state.scenarioIndex}`}
              onChange={(key, value) =>
                setPostLikert((prev) => ({ ...prev, [key]: value }))
              }
            />

            <hr className="my-8 border-border" />
            <h2 className="section-title mb-4">How the interaction felt</h2>
            <LikertBlock
              items={POST_SURVEY.mediators}
              keys={POST_SURVEY_KEYS.mediators}
              values={postLikert}
              namePrefix={`post_${state.scenarioIndex}`}
              onChange={(key, value) =>
                setPostLikert((prev) => ({ ...prev, [key]: value }))
              }
            />

            <button
              type="button"
              className="btn-primary mt-8"
              disabled={loading}
              onClick={handlePostSurveySubmit}
            >
              Submit
            </button>
          </div>
        </>
      )}

      {state.stage === "debrief" && (
        <>
          <PageHeader
            title="You're All Done"
            lead="Thank you for your time. You may close this browser window when you're ready."
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
