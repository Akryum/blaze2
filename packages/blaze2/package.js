Package.describe({
  name: 'akryum:blaze2',
  version: '0.0.1',
  summary: 'Vue-powered blaze',
  git: 'https://github.com/Akryum/blaze2',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.4.2-rc.0');
  api.use('ecmascript');
  api.imply('akryum:blaze2-compiler@0.0.1');
  api.use('akryum:vue@1.2.0');
  api.mainModule('blaze2.js', 'client');
  api.export(['Blaze', 'Template']);
});
