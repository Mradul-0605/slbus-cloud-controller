export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                primary: '#3b82f6',
                dark: '#0a0a0f',
                card: 'rgba(255,255,255,0.05)'
            },
            backdropBlur: {
                xs: '2px'
            }
        }
    },
    plugins: []
};