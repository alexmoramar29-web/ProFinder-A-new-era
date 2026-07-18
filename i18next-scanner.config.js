module.exports = {
  input: [
    'src/**/*.{js,jsx,ts,tsx}', // Escanea todos tus archivos
    '!**/node_modules/**',
  ],
  output: './',
  options: {
    debug: true,
    func: { list: ['t'], extensions: ['.js', '.jsx', '.ts', '.tsx'] },
    lngs: ['en', 'es'],
    defaultNs: 'translation',
    keySeparator: false,
    nsSeparator: false,
    resource: {
      loadPath: 'src/locales/{{lng}}/{{ns}}.json',
      savePath: 'src/locales/{{lng}}/{{ns}}.json',
    },
  },
};