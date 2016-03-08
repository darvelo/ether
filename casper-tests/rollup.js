var rollup = require('rollup');
var babel = require('rollup-plugin-babel');

var dest = 'public/';
var banner = '/* My Ether App */';

function addBanner(code) {
    return banner + '\n' + code;
}

rollup.rollup({
    entry: 'app/app.js',
    banner: banner,
    plugins: [
        babel(),
    ],
}).then(function (bundle) {
    return Promise.all([
        bundle.write({
            format: 'iife',
            globals: {
                ether: 'Ether',
            },
            exports: 'auto',
            moduleName: 'MyRootApp',
            dest: dest + 'app.js',
            sourcemap: 'inline',
        }),
    ]);
}).catch(function (err) {
    console.error(err);
});
