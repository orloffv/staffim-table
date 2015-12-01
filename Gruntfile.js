module.exports = function(grunt) {
    "use strict";

    grunt.initConfig({
        concat: {
            js: {
                src: [
                    'src/scripts/staffimTable.module.js',
                    'src/scripts/staffimTable.withSelect.js',
                    'src/scripts/staffimTable.filter.js',
                    'src/scripts/staffimTable.sort.js',
                    'src/scripts/staffimTable.search.js',
                    'src/scripts/staffimTable.compile.js',
                    'src/scripts/staffimTable.config.js',
                    '.tmp/templates.js'
                ],
                dest: './dist/staffim-table.js'
            }
        },
        ngtemplates: {
            dist: {
                cwd: 'src/',
                src: ['staffim-table/**/*.html'],
                dest: '.tmp/templates.js',
                options: {
                    prefix: '/',
                    module: 'staffimTable'
                }
            }
        },
        clean: {
            working: {
                src: ['./.tmp/']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-angular-templates');

    grunt.registerTask('dist', ['clean', 'ngtemplates', 'concat']);
};
