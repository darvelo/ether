// modified from these templates/instructions:
//   https://gist.github.com/frederickfogerty/f07f389c58ad1fdd28bc
//   https://github.com/deepsweet/isparta-loader
//   https://github.com/TheLarkInn/angular-starter-es6-webpack/blob/master/webpack.config.js

var path = require('path');

module.exports = function (config) {
    config.set({
        // web server port
        port: 9876,
        // base path that will be used to resolve all patterns (e.g. files, excludes)
        basePath: '',
        browsers: [],
        browserNoActivityTimeout: 60000,
        singleRun: false,
        frameworks: ['mocha', 'sinon-chai'],
        files: [
            // Regenerator Runtime
            // https://github.com/facebook/regenerator/blob/master/runtime.js
            'regenerator-runtime.js',
            // source components and tests combined
            'tests.webpack.js',
        ],
        preprocessors: {
            'tests.webpack.js': ['webpack'], // preprocess with webpack
        },
        webpack: {
            // *optional* babel options: isparta will use it as well as babel-loader
            babel: {
                presets: ['es2015'],
            },
            // *optional* isparta options: istanbul behind isparta will use it
            isparta: {
                embedSource: true,
                noAutoWrap: true,
                // these babel options will be passed only to isparta and not to babel-loader
                babel: {
                    presets: ['es2015'],
                },
            },
            module: {
                preLoaders: [
                    // transpile all files, source components and tests
                    {
                        test: /\.js$/,
                        exclude: [
                            path.resolve('node_modules/'),
                        ],
                        loader: 'babel'
                    },
                    // instrument only source components
                    {
                        test: /\.js$/,
                        include: path.resolve('src/'),
                        loader: 'isparta',
                    }
                ]
            },
            resolve: {
                root: __dirname,
            },
        },
        webpackServer: {
            // don't spam the console when running in karma
            noInfo: true,
        },
        // report results in these formats
        reporters: ['mocha', 'progress', 'coverage'],
        mochaReporter: {
            output: 'autowatch',
        },
        coverageReporter: {
            reporters: [
                {type: 'text'},
                {type: 'html'},
            ]
        },
    });
};
