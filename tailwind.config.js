import tailwindcssForms from "@tailwindcss/forms"; // A plugin that provides a basic reset for form styles that makes form elements easy to override with utilities.

export default {
  theme: {
    extend: {},
  },
  plugins: [tailwindcssForms],
  experimental: {
    optimizeUniversalDefaults: true,
  },
};
