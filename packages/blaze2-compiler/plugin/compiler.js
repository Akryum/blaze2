import _ from 'lodash';
import VueCompiler from 'vue-template-compiler';

Blaze2Compile = function() {
  return new CachingHtmlCompiler("blaze2", TemplatingTools.scanHtmlForTags, compileTagsToVue);
}

function compileTagsToVue(tags) {
  var handler = new VueHtmlTagHandler();

  tags.forEach((tag) => {
    handler.addTagToResults(tag);
  });

  return handler.getResults();
};

function toFunction (code) {
  return 'function (){' + code + '}';
}

class VueHtmlTagHandler {
  constructor() {
    this.results = {
      head: '',
      body: '',
      js: '',
      bodyAttrs: {}
    };
  }

  getResults() {
    return this.results;
  }

  addTagToResults(tag) {
    this.tag = tag;

    // do we have 1 or more attributes?
    const hasAttribs = ! _.isEmpty(this.tag.attribs);

    if (this.tag.tagName === "head") {
      if (hasAttribs) {
        this.throwCompileError("Attributes on <head> not supported");
      }

      this.results.head += this.tag.contents;
      return;
    }


    // <body> or <template>

    try {
      if (this.tag.tagName === "template") {
        const name = this.tag.attribs.name;

        if (! name) {
          this.throwCompileError("Template has no 'name' attribute");
        }

        if (isReservedName(name)) {
          this.throwCompileError(`Template can't be named "${name}"`);
        }

        var renderFuncCode = this.compileBlazeToVueRender(this.tag.contents);

        this.results.js += this.generateTemplateJS(name, renderFuncCode);
      } else if (this.tag.tagName === "body") {
        this.addBodyAttrs(this.tag.attribs);

        var renderFuncCode = this.compileBlazeToVueRender(this.tag.contents);

        // We may be one of many `<body>` tags.
        this.results.js += this.generateBodyJS(renderFuncCode);
      } else {
        this.throwCompileError("Expected <template>, <head>, or <body> tag in template file", tagStartIndex);
      }
    } catch (e) {
      if (e.scanner) {
        // The error came from Spacebars
        this.throwCompileError(e.message, this.tag.contentsStartIndex + e.offset);
      } else {
        throw e;
      }
    }
  }

  addBodyAttrs(attrs) {
    Object.keys(attrs).forEach((attr) => {
      const val = attrs[attr];

      // This check is for conflicting body attributes in the same file;
      // we check across multiple files in caching-html-compiler using the
      // attributes on results.bodyAttrs
      if (this.results.bodyAttrs.hasOwnProperty(attr) && this.results.bodyAttrs[attr] !== val) {
        this.throwCompileError(
          `<body> declarations have conflicting values for the '${attr}' attribute.`);
      }

      this.results.bodyAttrs[attr] = val;
    });
  }

  transformBlazeToVueTemplate(blazeTemplate) {
    let vueTemplate = blazeTemplate;
    vueTemplate = vueTemplate
    .replace(/{{{(.*?)}}}/gi, '<span v-html="$1"></span>')
    .replace(/{{>\s*([\w\d-]+)}}/gi, '<$1></$1>')
    .replace(/\$([\w-]+)/gi, 'v-$1')
    .replace(/{{#\s*(if|show)\s+(.+)}}/gi, '<template v-$1="$2">')
    .replace(/{{else}}/gi, '</template><template v-else>')
    .replace(/{{#\s*each\s+(.*)}}/gi, (match, p1) => {
      let expression = p1;
      if(p1.indexOf(' ') === -1) {
        expression = p1.substr(0, p1.length-1) + ' in ' + p1;
      }
      return '<template v-for="' + expression + '">';
    })
    .replace(/{{\/(if|show|each)}}/gi, '</template>')
    .replace(/(\@|v-|:)?([\w.-]+)="(.*?)"/gi, (match, p1, p2, p3) => {
      if(p1 !== undefined || (p3.indexOf('{{') === -1 && p3.indexOf('}}') === -1)) {
        return match;
      } else {
        const simple = /^{{(.*?)}}$/gi.exec(p3);
        if(simple !== null) {
          return `:${p2}="${simple[1]}"`;
        } else {
          return `:${p2}="'${p3.replace(/{{(.*?)}}/gi, `' + String($1) + '`)}'"`;
        }
      }
    });
    vueTemplate = '<span>' + vueTemplate + '</span>';
    return vueTemplate;
  }

  compileBlazeToVueRender(template) {
    template = this.transformBlazeToVueTemplate(template);
    const result = VueCompiler.compile(template);
    if(result.errors && result.errors.length !== 0) {
      this.throwCompileError(result.errors);
    }
    return result;
  }

  generateTemplateJS(name, renderFuncCode) {
    var js = `Blaze.registerTemplate('${name}', {
      options: {
        name: '${name}',
        render: ${toFunction(renderFuncCode.render)},
        staticRenderFns: [${renderFuncCode.staticRenderFns.map(toFunction).join(',')}],
      },
    });`;
    return js;
  }

  generateBodyJS(renderFuncCode) {
    var js = `
    Blaze.registerRootComponent({
      render: ${toFunction(renderFuncCode.render)},
      staticRenderFns: [${renderFuncCode.staticRenderFns.map(toFunction).join(',')}],
    });
    `;
    return js;
  }

  throwCompileError(message, overrideIndex) {
    TemplatingTools.throwCompileError(this.tag, message, overrideIndex);
  }
}
