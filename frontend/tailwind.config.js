/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#6366f1",     
        secondary: "#8b5cf6",   
        "color-bg1": "rgb(18 113 255)",
        "color-bg2": "rgb(221 74 255)",
        color1: "rgb(18 113 255)",
        color2: "rgb(221 74 255)",
        color3: "rgb(100 220 255)",
        color4: "rgb(200 50 50)",
        color5: "rgb(180 180 50)",
        "color-interactive": "rgb(140 100 255)",
      },
      backgroundSize: {
        "circle-size": "80%",   
      },

      mixBlendMode: {
        blending: "hard-light", 
      },
    },
  },
  plugins: [],
}