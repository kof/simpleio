var findit = require('findit'),
    markdox = require('markdox'),
    path = require('path'),
    fs = require('fs');

var lib = path.join(__dirname, '..', 'lib'),
    target = path.join(__dirname, '..', 'api.md'),
    template = path.join(__dirname, 'api.ejs'),
    docs = '',
    todo = 0;

findit.sync(lib).forEach(function(file, i, files) {
    if (!/\.js$/.test(file)) {
        return;
    }

    todo++;
    markdox.process(file, {template: template, formatter: formatter}, function(err, doc) {
        if (err) return console.error(err);
        docs += doc;
        todo--;

        if (!todo) {
            fs.writeFileSync(target, docs);
        }
    });
});

function formatter(docfile) {
    docfile.title = docfile.filename.substr(lib.length + 1);
    return docfile;
}
