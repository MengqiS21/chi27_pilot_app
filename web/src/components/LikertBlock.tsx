"use client";

type Props = {
  items: readonly string[];
  keys: readonly string[];
  values: Record<string, number | null>;
  onChange: (key: string, value: number) => void;
  namePrefix: string;
};

const SCALE = [1, 2, 3, 4, 5, 6, 7] as const;

const MIDDLE_LABELS: Record<2 | 3 | 4 | 5 | 6, string> = {
  2: "Disagree",
  3: "Somewhat Disagree",
  4: "Neutral",
  5: "Somewhat Agree",
  6: "Agree",
};

const SIZE_CLASS: Record<(typeof SCALE)[number], string> = {
  1: "likert-size-xl",
  2: "likert-size-lg",
  3: "likert-size-md",
  4: "likert-size-sm",
  5: "likert-size-md",
  6: "likert-size-lg",
  7: "likert-size-xl",
};

const ARIA_LABELS: Record<(typeof SCALE)[number], string> = {
  1: "1 — Strongly disagree",
  2: "2 — Disagree",
  3: "3 — Somewhat Disagree",
  4: "4 — Neutral",
  5: "5 — Somewhat Agree",
  6: "6 — Agree",
  7: "7 — Strongly agree",
};

function hintAboveCircle(
  n: (typeof SCALE)[number],
  isSelected: boolean
): string | null {
  if (n === 1) return "Strongly Disagree";
  if (n === 7) return "Strongly Agree";
  if (isSelected) return MIDDLE_LABELS[n as 2 | 3 | 4 | 5 | 6];
  return null;
}

export function LikertBlock({ items, keys, values, onChange, namePrefix }: Props) {
  return (
    <div className="space-y-0">
      {items.map((statement, i) => {
        const fieldKey = keys[i];
        const inputName = `${namePrefix}_${fieldKey}`;
        const selected = values[fieldKey];

        return (
          <div key={fieldKey} className="likert-item">
            <p className="likert-statement">{statement}</p>
            <div
              className="likert-scale"
              role="radiogroup"
              aria-label={statement}
            >
              {SCALE.map((n) => {
                const isSelected = selected === n;
                const hint = hintAboveCircle(n, isSelected);
                const isEndHint = n === 1 || n === 7;

                return (
                  <div key={n} className="likert-scale-cell">
                    <div
                      className="likert-hint"
                      aria-hidden={hint ? undefined : true}
                    >
                      {hint ? (
                        <span
                          className={
                            isEndHint ? "likert-hint-end" : "likert-hint-selected"
                          }
                        >
                          {hint}
                        </span>
                      ) : (
                        <span className="likert-hint-placeholder" aria-hidden>
                          &nbsp;
                        </span>
                      )}
                    </div>
                    <label
                      className={`likert-option-hit ${SIZE_CLASS[n]} ${
                        isSelected ? "likert-option-hit-selected" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name={inputName}
                        value={n}
                        checked={isSelected}
                        onChange={() => onChange(fieldKey, n)}
                        aria-label={ARIA_LABELS[n]}
                      />
                      <span
                        className={`likert-option ${SIZE_CLASS[n]} ${
                          isSelected ? "likert-option-selected" : ""
                        }`}
                      >
                        <span className="likert-option-num">{n}</span>
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
