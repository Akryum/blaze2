import _ from 'lodash';

builtInBlockHelpers = {
  'if': 'Blaze.If',
  'unless': 'Blaze.Unless',
  'with': 'Spacebars.With',
  'each': 'Blaze.Each',
  'let': 'Blaze.Let'
};


// Mapping of "macros" which, when preceded by `Template.`, expand
// to special code rather than following the lookup rules for dotted
// symbols.
builtInTemplateMacros = {
  // `view` is a local variable defined in the generated render
  // function for the template in which `Template.contentBlock` or
  // `Template.elseBlock` is invoked.
  'contentBlock': 'view.templateContentBlock',
  'elseBlock': 'view.templateElseBlock',

  // Confusingly, this makes `{{> Template.dynamic}}` an alias
  // for `{{> __dynamic}}`, where "__dynamic" is the template that
  // implements the dynamic template feature.
  'dynamic': 'Template.__dynamic',

  'subscriptionsReady': 'view.templateInstance().subscriptionsReady()'
};

additionalReservedNames = ["body", "toString", "instance",  "constructor",
  "toString", "toLocaleString", "valueOf", "hasOwnProperty", "isPrototypeOf",
  "propertyIsEnumerable", "__defineGetter__", "__lookupGetter__",
  "__defineSetter__", "__lookupSetter__", "__proto__", "dynamic",
  "registerHelper", "currentData", "parentData"];

// A "reserved name" can't be used as a <template> name.  This
// function is used by the template file scanner.
//
// Note that the runtime imposes additional restrictions, for example
// banning the name "body" and names of built-in object properties
// like "toString".
isReservedName = function (name) {
  return builtInBlockHelpers.hasOwnProperty(name) ||
    builtInTemplateMacros.hasOwnProperty(name) ||
    _.indexOf(additionalReservedNames, name) > -1;
};
