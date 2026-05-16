import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        page: "#F7F5F2",
        surface: "#FFFFFF",
        ink: "#2C2C3A",
        muted: "#6B6B80",
        accent: "#5B6FA6",
        "accent-hover": "#4A5C8F",
        border: "#E4E1DC",
        "input-border": "#C8C5BF",
        scenario: "#F0EDE8",
        "chat-user": "#EEF1F8",
        success: "#4A7C6F",
        error: "#B85450",
        "error-bg": "#FAF0EF",
      },
      fontFamily: {
        sans: ["var(--font-nunito)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        content: "760px",
        chat: "680px",
      },
      borderRadius: {
        btn: "8px",
        card: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
