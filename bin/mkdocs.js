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

function formatter(doc) {
    doc.javadoc.forEach(function(comment) {
        if (comment.raw.ctx) {
            comment.constructor = comment.raw.ctx.constructor;
            comment.receiver = comment.raw.ctx.receiver;
        }

        comment.isPrivate = comment.raw.isPrivate;
    });

    doc.title = doc.filename.substr(lib.length + 1);
    return doc;
}
