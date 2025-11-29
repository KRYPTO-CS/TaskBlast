/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  //presets: [require("nativewind/preset")], [might uncomment this to try to change back to nativewind v4]
  theme: {
    extend: {
      colors: {
        primary: "#4a90e2",
        secondary: "#666",
        background: "#f5f5f5",
        surface: "#ffffff",
        text: {
          primary: "#333",
          secondary: "#666",
          placeholder: "#999",
        },
      },
      fontFamily: {
        madimi: ["MadimiOne_400Regular"],
        orbitron: ["Orbitron_400Regular"],
        "orbitron-medium": ["Orbitron_500Medium"],
        "orbitron-semibold": ["Orbitron_600SemiBold"],
        "orbitron-bold": ["Orbitron_700Bold"],
        "orbitron-extrabold": ["Orbitron_800ExtraBold"],
        "orbitron-black": ["Orbitron_900Black"],
      },
    },
  },
  plugins: [],
};
