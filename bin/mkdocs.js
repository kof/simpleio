var findit = require('findit'),
    markdox = require('markdox'),
    path = require('path'),
    fs = require('fs');

var lib = path.join(__dirname, '..', 'lib'),
    target = path.join(__dirname, '..', 'api.md'),
    docs = '',
    todo = 0;

findit.sync(lib).forEach(function(file, i, files) {
    if (!/\.js$/.test(file)) {
        return;
    }

    todo++;
    markdox.process(file, function(err, doc) {
        if (err) return console.error(err);
        docs += '# ' + file.substr(lib.length + 1) + '\n';
        docs += doc;
        todo--;

        if (!todo) {
            fs.writeFileSync(target, docs);
        }
    });
});
