var fs = require('fs'),
    startupNursery = {};

require('./dist/date.format');

fs.readdirSync(__dirname + '/lib').forEach(function(file) {
    assign(startupNursery, require('./lib/' + file));
});

module.exports = startupNursery;

function assign () {
    var args = [].slice.call(arguments).filter(function (i) { return i });
    var dest = args.shift();
    args.forEach(function (src) {
        Object.keys(src).forEach(function (key) {
            dest[key] = src[key];
        })
    });

    return dest;
}