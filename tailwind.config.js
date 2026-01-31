/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        fontFamily: {
            sans: ['Inter', 'sans-serif'],
            display: ['Inter', 'sans-serif'],
        },
        colors: {
            "primary": "#2b7cee",
            "background-light": "#f6f7f8",
            "background-dark": "#0a0f16",
            "sidebar-dark": "#111822",
            "panel-dark": "#161e2b",
            "border-dark": "#233348",
        },
        extend: {},
    },
    plugins: [],
}
