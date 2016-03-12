'use strict';

var htmlmin = require('gulp-htmlmin');
var cheerio = require('gulp-cheerio');

module.exports = require('lazypipe')()
  .pipe(htmlmin, {
    removeComments: true,
    collapseWhitespace: true,
    collapseInlineTagWhitespace: true,
    caseSensitive: true,
    removeTagWhitespace: true,
    customAttrAssign: [/\$=/],
  })

  // Manually minify inline css, since polymer syntax breaks css parsers
  .pipe(cheerio, function ($$) {
    $$('style').each(function () {
      var style = $$(this);
      style.text(style.text()
        .replace(/^[ \t]+/mg, '')
        .replace(/[ \t]*\/\*(.|[\n\r])*?\*\//g, '')
        .replace(/[\n\r]+/g, '\n')
        .replace(/;[\n\r\t ]+/g, ';')
        .replace(/,[\n\r\t ]+/g, ',')
        .replace(/[ \t\n\r]+{/g, '{')
        .replace(/{[ \t\n\r]+/g, '{')
        .replace(/[ \t\n\r;]+}/g, '}')
        .replace(/}[ \t\n\r]+/g, '}')
        .replace(/:[ \t\n\r]+/g, ':'));
    });
  });
