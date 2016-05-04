var concat = require('gulp-concat');
var es = require('event-stream');
var gutil = require('gulp-util');
var path = require('path');

function cacheTranslations(options) {
  var normalStript = '$translateProvider.translations("<%= language %>", <%= contents %>);\n';
  var partialStript = '$translatePartialLoaderProvider.setPart("<%= language %>","<%= partialName %>", <%= contents %>);\n';
  var addPartScript = '$translatePartialLoaderProvider.addPart("<%= partialName %>");\n';

  return es.map(function(file, callback) {
    var script = options.partialName !== undefined ? partialStript : normalStript;
    script += (options.partialName && options.addPartial ? addPartScript : '');
    file.contents = new Buffer(gutil.template(script, {
      contents: file.contents,
      file: file,
      partialName: options.partialName,
      language: options.language || file.path.split(path.sep).pop().match(/^(?:[\w]{3,}-)?([a-z]{2}[_|-]?(?:[A-Z]{2})?)\.json$/i).pop()
    }));
    callback(null, file);
  });
}

function wrapTranslations(options) {
  var partialWrapper = 'angular.module("<%= module %>"<%= standalone %>).config(["$translatePartialLoaderProvider", function($translatePartialLoaderProvider) {\n<%= contents %>}]);\n';
  var normalWrapper = 'angular.module("<%= module %>"<%= standalone %>).config(["$translateProvider", function($translateProvider) {\n<%= contents %>}]);\n';

  return es.map(function(file, callback) {
    file.contents = new Buffer(gutil.template(options.partialName  !== undefined ? partialWrapper : normalWrapper, {
      contents: file.contents,
      file: file,
      module: options.module || 'translations',
      standalone: options.standalone === false ? '' : ', []'
    }));
    callback(null, file);
  });
}

function gulpAngularTranslate(filename, options) {
  if (typeof filename === 'string') {
    options = options || {};
  } else {
    options = filename || {};
    filename = options.filename || 'translations.js';
  }

  return es.pipeline(
    cacheTranslations(options),
    concat(filename),
    wrapTranslations(options)
  );
};

module.exports = gulpAngularTranslate;
