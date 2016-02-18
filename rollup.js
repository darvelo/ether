var rollup = require('rollup');
var babel = require('rollup-plugin-babel');
var uglify = require('rollup-plugin-uglify');

var dest = 'dist/';
var version = require('./package.json').version;
var banner = '/* Ether version ' + version + ' */';

function addBanner(code) {
    return banner + '\n' + code;
}

rollup.rollup({
    entry: 'src/index.js',
    banner: banner,
    plugins: [
        babel(),
        uglify(),
        // banner property in bundle.write
        // doesn't seem to be working after
        // the uglify plugin has run
        {transformBundle: addBanner}
    ],
}).then(function (bundle) {
    return Promise.all([
        bundle.write({
            format: 'amd',
            moduleId: 'ether',
            exports: 'named',
            dest: dest + 'ether.amd.js',
        }),
        bundle.write({
            format: 'cjs',
            exports: 'named',
            dest: dest + 'ether.cjs.js',
        }),
        bundle.write({
            format: 'iife',
            moduleName: 'Ether',
            exports: 'named',
            dest: dest + 'ether.global.js',
            sourcemap: 'inline',
        }),
    ]);
}).catch(function (err) {
    console.error(err);
});
