/** Pilot Study questionnaire — verbatim from implementation spec. */

export const SCALE_INSTRUCTIONS = {
  agree7:
    "Response options (1–7): 1 = Strongly disagree · 2 = Disagree · 3 = Somewhat disagree · 4 = Neither agree nor disagree · 5 = Somewhat agree · 6 = Agree · 7 = Strongly agree.",
  agree5:
    "Response options (1–5): 1 = Strongly disagree · 2 = Disagree · 3 = Neither agree nor disagree · 4 = Agree · 5 = Strongly agree.",
  severity7:
    "Response options (1–7): 1 = Not at all serious · 2 = Slightly serious · 3 = Somewhat serious · 4 = Moderately serious · 5 = Quite serious · 6 = Very serious · 7 = Extremely serious.",
  timing5:
    "Response options (1–5): 1 = Much too early · 2 = A little too early · 3 = About right · 4 = A little too late · 5 = Much too late.",
} as const;

export const SCREENING = {
  items: [
    {
      key: "scr2",
      text: "Have you ever used an AI tool, such as a chatbot or AI assistant, to seek emotional support or to talk through something personal or emotional?",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
      screenOut: "no",
    },
  ],
} as const;

export const SECTION_A = {
  title: "Scenario material validation",
  realism: {
    title: "Scenario realism",
    scale: "agree7" as const,
    instruction: SCALE_INSTRUCTIONS.agree7,
    items: [
      { key: "rea1", text: "This scenario felt realistic to me." },
      {
        key: "rea2",
        text: "I can imagine a situation like this actually happening to someone.",
      },
      { key: "rea3", text: "The situation described felt believable." },
    ],
  },
  engagement: {
    title: "Emotional engagement",
    scale: "agree7" as const,
    instruction: SCALE_INSTRUCTIONS.agree7,
    items: [
      { key: "eng1", text: "I could easily imagine myself in this situation." },
      {
        key: "eng2",
        text: "While reading, I felt emotionally involved in what the person was going through.",
      },
    ],
  },
  severity: {
    title: "Perceived severity",
    scale: "severity7" as const,
    instruction: SCALE_INSTRUCTIONS.severity7,
    items: [
      {
        key: "sev1",
        text: "Overall, how serious is the situation this person is facing?",
      },
    ],
  },
} as const;

export const SECTION_B = {
  title: "Post-conversation appraisal",
  understanding: {
    title: "Perceived understanding",
    scale: "agree5" as const,
    instruction: SCALE_INSTRUCTIONS.agree5,
    items: [
      { key: "und1", text: "I understood why the AI responded the way it did." },
      {
        key: "und2",
        text: "The reason behind the AI's response was clear to me.",
      },
      { key: "und3", text: "It made sense to me that the AI responded this way." },
    ],
  },
  agency: {
    title: "Perceived agency",
    scale: "agree5" as const,
    instruction: SCALE_INSTRUCTIONS.agree5,
    items: [
      {
        key: "agn1",
        text: "After this conversation, I felt I had options for what to do next.",
      },
      {
        key: "agn2",
        text: "Whether I get the support I need is mostly up to me.",
      },
      {
        key: "agn3",
        text: "I felt confident I could take the next step toward getting support.",
      },
    ],
  },
  continuity: {
    title: "Perceived relational continuity",
    scale: "agree5" as const,
    instruction: SCALE_INSTRUCTIONS.agree5,
    items: [
      {
        key: "con1",
        text: "The AI's response felt connected to what I had shared in the conversation.",
      },
      {
        key: "con2",
        text: "As the AI moved toward suggesting other support, the conversation still felt personal and continuous.",
      },
      {
        key: "con3",
        text: "The way the conversation shifted felt abrupt and disconnected. (R)",
        reverseScored: true,
      },
    ],
  },
  manipulationCheck: {
    title: "Manipulation check",
    scale: "agree5" as const,
    instruction: SCALE_INSTRUCTIONS.agree5,
    attitude: {
      title: "Attitude toward help-seeking",
      items: [
        {
          key: "mca1",
          text: "The AI's responses made seeking further support feel like a positive thing to do.",
        },
        {
          key: "mca2",
          text: "The AI encouraged me to see reaching out for help as worthwhile.",
        },
        {
          key: "mca3",
          text: "The AI suggested that getting support would be good for me.",
        },
      ],
    },
    norms: {
      title: "Subjective norms",
      items: [
        {
          key: "mcn1",
          text: "The AI suggested that many people in situations like mine seek this kind of support.",
        },
        {
          key: "mcn2",
          text: "The AI made it seem like reaching out for help is a common and accepted thing to do.",
        },
        {
          key: "mcn3",
          text: "The AI conveyed that seeking support is a normal choice for someone in my situation.",
        },
      ],
    },
    pbc: {
      title: "Perceived behavioural control",
      items: [
        {
          key: "mcp1",
          text: "The AI made it clear what concrete steps I could take to get support.",
        },
        {
          key: "mcp2",
          text: "The AI made getting further support feel manageable and achievable.",
        },
        {
          key: "mcp3",
          text: "The AI helped me feel that I could actually take the next step if I wanted to.",
        },
      ],
    },
  },
  perception: {
    title: "Open perception",
    items: [
      {
        key: "per1",
        text: "In your own words, how did the way the AI moved the conversation toward other support feel to you, and what stood out about how it did this?",
      },
    ],
  },
  timing: {
    title: "Perceived timing",
    scale: "timing5" as const,
    instruction: SCALE_INSTRUCTIONS.timing5,
    items: [
      {
        key: "tim1",
        text: "Thinking about the point in the conversation when the AI began suggesting other sources of support, how was the timing of that shift?",
      },
    ],
  },
} as const;

export const SECTION_C = {
  title: "Item feedback",
  items: [
    {
      key: "fb1",
      text: "Were any of the statements above unclear, confusing, or worded oddly? If so, which ones, and what was unclear?",
    },
    {
      key: "fb2",
      text: "Did any statement not match how you actually felt during the conversation? Please explain.",
    },
    {
      key: "fb3",
      text: "Was anything about the scenario itself or the AI's responses confusing or hard to believe?",
    },
  ],
} as const;

export const DEMOGRAPHICS = {
  title: "Demographic information",
  age: {
    key: "dem1",
    label: "What is your age?",
    type: "number" as const,
    placeholder: "Age in years",
    allowPreferNot: true,
  },
  gender: {
    key: "dem2",
    label: "What is your gender?",
    options: [
      "Woman",
      "Man",
      "Non-binary",
      "Prefer to self-describe",
      "Prefer not to say",
    ],
  },
  education: {
    key: "dem3",
    label: "Highest level of education completed",
    options: [
      "Less than high school",
      "High school or equivalent",
      "Some college, no degree",
      "Associate or vocational degree",
      "Bachelor's degree",
      "Master's degree",
      "Doctoral or professional degree",
      "Prefer not to say",
    ],
  },
  employment: {
    key: "dem4",
    label: "Current employment status",
    options: [
      "Employed full-time",
      "Employed part-time",
      "Self-employed",
      "Student",
      "Unemployed",
      "Retired",
      "Unable to work",
      "Prefer not to say",
    ],
  },
  living: {
    key: "dem5",
    label: "Current living situation",
    options: [
      "Live alone",
      "Live with a partner or spouse",
      "Live with family",
      "Live with roommates or housemates",
      "Other",
    ],
  },
  region: {
    key: "dem6",
    label: "Country or region you currently live in",
    type: "text" as const,
  },
  aiEmotionalUseFrequency: {
    key: "dem7",
    label:
      "How often do you currently use AI tools to discuss personal, emotional, or stressful experiences?",
    options: [
      "Never",
      "Less than monthly",
      "Monthly",
      "Weekly",
      "Several times per week",
      "Daily",
    ],
  },
} as const;

function allLikertKeys(
  sections: Array<{ items: ReadonlyArray<{ key: string }> }>
): string[] {
  return sections.flatMap((s) => s.items.map((i) => i.key));
}

export const SECTION_A_KEYS = allLikertKeys([
  SECTION_A.realism,
  SECTION_A.engagement,
  SECTION_A.severity,
]);

export const SECTION_B_CORE_LIKERT_KEYS = allLikertKeys([
  SECTION_B.understanding,
  SECTION_B.agency,
  SECTION_B.continuity,
  SECTION_B.timing,
]);

export const SECTION_B_MANIPULATION_KEYS = allLikertKeys([
  SECTION_B.manipulationCheck.attitude,
  SECTION_B.manipulationCheck.norms,
  SECTION_B.manipulationCheck.pbc,
]);

export const SECTION_B_LIKERT_KEYS_GROUP_1 = SECTION_B_CORE_LIKERT_KEYS;

export const SECTION_B_LIKERT_KEYS_GROUP_2 = [
  ...SECTION_B_CORE_LIKERT_KEYS.filter((k) => k !== "tim1"),
  ...SECTION_B_MANIPULATION_KEYS,
  "tim1",
];

/** @deprecated use group-specific keys */
export const SECTION_B_LIKERT_KEYS = SECTION_B_LIKERT_KEYS_GROUP_2;

export function sectionBLikertKeysForGroup(
  pilotGroup: "group_1" | "group_2" | null
): string[] {
  return pilotGroup === "group_1"
    ? SECTION_B_LIKERT_KEYS_GROUP_1
    : SECTION_B_LIKERT_KEYS_GROUP_2;
}
