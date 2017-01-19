// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    mochaTest: {
      test: {
        src: ['test/**/*.js'],
        options: {
          clearRequireCache: true
        }
      }
    },
    eslint: {
      options: {
        configFile: '.eslintrc.json'
      },
      target: ['config/**/*.js', 'dashboard/**/*.js', 'middleware/**/*.js', 'lib/**/*.js', 'test/**/*.js']
    }
  });
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.registerTask('none', () => { });

  grunt.registerTask('default', ['eslint', 'mochaTest']);
};
