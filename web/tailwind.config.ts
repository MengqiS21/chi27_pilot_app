import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        page: "#FAF9F7",
        surface: "#FFFFFF",
        ink: "#2D2840",
        muted: "#7A7490",
        accent: "#9B8AD4",
        "accent-hover": "#8474B8",
        border: "#E8E2F4",
        "input-border": "#C9C0DC",
        scenario: "#F3EEFC",
        "chat-user": "#F0EBFA",
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
