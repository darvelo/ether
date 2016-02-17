var rollup = require('rollup');
var babel = require('rollup-plugin-babel');
var uglify = require('rollup-plugin-uglify');

var dest = 'dist/';

rollup.rollup({
    entry: 'src/index.js',
    plugins: [
        babel(),
        uglify(),
    ],
}).then(function (bundle) {
    var version = 0.1;
    var banner = '/* Ether version ' + version + ' */';
    return Promise.all([
        bundle.write({
            format: 'amd',
            moduleId: 'ether',
            exports: 'named',
            dest: dest + 'ether.amd.js',
            banner: banner,
        }),
        bundle.write({
            format: 'cjs',
            exports: 'named',
            dest: dest + 'ether.cjs.js',
            banner: banner,
        }),
        bundle.write({
            format: 'iife',
            moduleName: 'Ether',
            exports: 'named',
            dest: dest + 'ether.global.js',
            banner: banner,
            sourcemap: 'inline',
        }),
    ]);
}).catch(function (err) {
    console.error(err);
});
