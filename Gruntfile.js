module.exports = grunt => {
	require('time-grunt')(grunt);

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		libs: grunt.file.readJSON('.bowerrc'),

		less: {
			options: {
				paths: ['<%= libs.directory %>/bootstrap/less']
			},
			bootstrap: {
				files: {
					'<%= pkg.webapp %>/css/bootstrap.css': '<%= pkg.webapp %>/less/_bootstrap.less',
				}
			},
			main: {
				files: {
					'<%= pkg.webapp %>/css/main.css': '<%= pkg.webapp %>/less/main.less'
				}
			}
		},
		copy: {
			dev: {
				files: [
					{expand: true, cwd: '<%= libs.directory %>/bootstrap/fonts', src: '**', dest: '<%= pkg.webapp %>/fonts'},
				]
			},
			production: {
				files: [
					{expand: true, cwd: '<%= pkg.webapp %>/modules/', src: '**/*.html', dest: 'build/modules'},
					{expand: true, cwd: '<%= pkg.webapp %>/fonts/', src: '**', dest: 'build/fonts'}
				]
			}
		},
		clean: {
			build: ['build']
		},
		cssmin: {
			production: {
				files: {
					'build/css/style.min.css': 
						['<%= pkg.webapp %>/css/bootstrap.css',
						 '<%= pkg.webapp %>/css/main.css']
				}
			}
		},
		uglify: {
			production: {
				files: {
					'build/libs.min.js': [
						'<%= libs.directory %>/angular/angular.min.js',
						'<%= libs.directory %>/angular-route/angular-route.min.js',
						'<%= libs.directory %>/highcharts/highcharts.js',
						'<%= libs.directory %>/highcharts-ng/dist/highcharts-ng.min.js'
					],
					'build/app.min.js': [
						'<%= pkg.webapp %>/app.js'
					],
					'build/modules/main/module.min.js': [
						'<%= pkg.webapp %>/modules/main/*.js'
					],
					'build/modules/something/module.min.js': [
						'<%= pkg.webapp %>/modules/something/*.js'
					],
					'build/modules/slider/module.min.js': [
						'<%= pkg.webapp %>/modules/slider/*.js'
					]
				}
			}
		},
		processhtml: {
			options: {
				strip: true
			},
			production: {
				files: {
					'build/index.html': ['<%= pkg.webapp %>/index.html']
				}
			}
		},
		connect: {
			dev: {
				options: {
					port: '80',
					base: '<%= pkg.webapp %>'
				}
			},
			production: {
				options: {
					port: '8080',
					base: 'build'
				}
			}
		},
		watch: {
			configFiles: {
				files: ['Gruntfile.js'],
				options: {
					reload: true
				}
			},
			bootstrap: {
				files: ['<%= pkg.webapp %>/less/_bootstrap.less'],
				tasks: ['less:bootstrap']
			},
			less: {
				files: ['<%= pkg.webapp %>/less/main.less'],
				tasks: ['less:main']
			},
			livereload: {
				files: ['<%= pkg.webapp %>/**/*.html','<%= pkg.webapp %>/**/*.js','<%= pkg.webapp %>/css/**/*.css'],
				options: {
					livereload: true
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-processhtml');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', [
		'less',
		'copy:dev',
		'connect:dev',
		'watch'
	]);
	grunt.registerTask('build', [
		'clean:build',
		'copy:production',
		'less',
		'cssmin:production',
		'copy:production',
		'uglify:production',
		'processhtml:production',
		'connect:production:keepalive'
	]);
};