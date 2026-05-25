const path = require("path");

module.exports = {
  eslint: { enable: false },
  webpack: {
    alias: { '@': path.resolve(__dirname, 'src') },
    configure: (cfg) => {
      cfg.watchOptions = { ...cfg.watchOptions, ignored: ['**/node_modules/**', '**/.git/**', '**/build/**'] };
      return cfg;
    },
  },
};
