Package.describe({
  name: 'akryum:blaze2-compiler',
  version: '0.0.1',
  summary: 'Vue-powered blaze',
  git: 'https://github.com/Akryum/blaze2',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.4.2-rc.0');
  api.use('isobuild:compiler-plugin@1.0.0');
  api.imply('meteor', 'client');
});

Package.registerBuildPlugin({
  name: "blaze2",
  use: [
    'ecmascript@0.4.4',
    'caching-html-compiler@1.0.7',
    'templating-tools@1.0.5',
  ],
  sources: [
    'plugin/config.js',
    'plugin/compiler.js',
    'plugin/plugin.js',
  ],
  npmDependencies: {
    'lodash': '4.13.1',
    'vue-template-compiler': '2.0.3',
  },
});
