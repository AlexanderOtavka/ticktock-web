'use strict';

let lazypipe = require('lazypipe');
let htmlmin = require('gulp-htmlmin');
let cheerio = require('gulp-cheerio');

module.exports = lazypipe()
  .pipe(htmlmin, {
    removeComments: true,
    collapseWhitespace: true,
    collapseInlineTagWhitespace: true,
    caseSensitive: true,
    removeTagWhitespace: true,
    customAttrAssign: [/\$=/],
  })

  // Manually minify inline css, since polymer syntax breaks css parsers
  .pipe(cheerio, $ => $('style').each(function () {
    let $style = $(this);
    $style.text($style.text()
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
  }));
