"use client";

type Props = {
  items: readonly string[];
  keys: readonly string[];
  values: Record<string, number | null>;
  onChange: (key: string, value: number) => void;
  namePrefix: string;
};

const SCALE = [1, 2, 3, 4, 5, 6, 7] as const;

export function LikertBlock({ items, keys, values, onChange, namePrefix }: Props) {
  return (
    <div className="space-y-0">
      {items.map((statement, i) => {
        const fieldKey = keys[i];
        const inputName = `${namePrefix}_${fieldKey}`;
        return (
          <div key={fieldKey} className="likert-item">
            <p className="likert-statement">{statement}</p>
            <div className="likert-ends">
              <span>Strongly Disagree</span>
              <span>Strongly Agree</span>
            </div>
            <div className="likert-options" role="radiogroup" aria-label={statement}>
              {SCALE.map((n) => (
                <label key={n} className="likert-option">
                  <input
                    type="radio"
                    name={inputName}
                    value={n}
                    checked={values[fieldKey] === n}
                    onChange={() => onChange(fieldKey, n)}
                  />
                  {n}
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
