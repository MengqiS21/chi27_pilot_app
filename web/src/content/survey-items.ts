export const PRE_SURVEY = {
  social_support: [
    "I have people in my life I can turn to when I need emotional support.",
    "When I am upset, there is someone I can talk to.",
    "I feel like I have a strong support network around me.",
  ],
  ai_reliance: [
    "I often turn to AI for emotional support or to talk through problems.",
    "I feel comfortable sharing personal things with AI.",
    "I find AI helpful when I need to process my feelings.",
  ],
  disclosure_comfort: [
    "I find it easy to open up about my problems to others.",
    "I am comfortable sharing personal struggles when I need help.",
    "Asking for help feels natural to me.",
  ],
} as const;

export const PRE_SURVEY_KEYS = {
  social_support: ["ss_1", "ss_2", "ss_3"],
  ai_reliance: ["ai_1", "ai_2", "ai_3"],
  disclosure_comfort: ["dc_1", "dc_2", "dc_3"],
} as const;

export const POST_SURVEY = {
  goal_disengagement: [
    "After this interaction, I would give up on trying to get support for this issue.",
    "I would stop pursuing help for what I was going through.",
    "I would let go of the goal of finding support.",
    "I would disengage from trying to get help.",
  ],
  behavioral_intention: [
    "I would follow the referral or suggestion the AI gave me.",
    "I would try again with the same or a different AI.",
    "I would switch to a different platform or app.",
    "I would handle this on my own without seeking further help.",
  ],
  mediators: [
    "I felt the AI understood my situation before it stopped helping.",
    "I felt like I had some agency over what happened in this interaction.",
    "I felt like I was being refused or rejected.",
  ],
} as const;

export const POST_SURVEY_KEYS = {
  goal_disengagement: ["dg_1", "dg_2", "dg_3", "dg_4"],
  behavioral_intention: ["bi_follow", "bi_retry", "bi_switch", "bi_alone"],
  mediators: ["med_understanding", "med_agency", "med_refusal"],
} as const;
