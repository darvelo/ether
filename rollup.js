var rollup = require('rollup');
var babel = require('rollup-plugin-babel');

var dest = 'dist/';

rollup.rollup({
  entry: 'src/index.js',
  plugins: [
    babel()
  ]
}).then(function (bundle) {
    var version = 0.1;
    var banner = '/* Ether version ' + version + ' */';
    return Promise.all([
        bundle.write({
            format: 'amd',
            moduleId: 'ether',
            dest: dest + 'ether.amd.js',
            banner: banner,
        }),
        bundle.write({
            format: 'cjs',
            dest: dest + 'ether.cjs.js',
            banner: banner,
        }),
        bundle.write({
            format: 'iife',
            moduleName: 'Ether',
            dest: dest + 'ether.global.js',
            banner: banner,
            sourcemap: 'inline',
        })
    ]);
});
