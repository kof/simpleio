var findit = require('findit'),
    markdox = require('markdox'),
    path = require('path'),
    fs = require('fs');

var base = path.join(__dirname, '..'),
    lib = path.join(base, 'lib'),
    components = path.join(base, 'components'),
    target = path.join(base, 'api.md'),
    template = path.join(__dirname, 'api.ejs'),
    docs = '',
    todo = 0;

findit.sync(lib).concat(findit.sync(components)).forEach(function(file, i, files) {
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

            // Will lead to object constructor function if undefined.
            if (typeof comment.raw.ctx.constructor == 'string') {
                comment.constr = comment.raw.ctx.constructor;
            }
            comment.receiver = comment.raw.ctx.receiver;
        }

        comment.isPrivate = comment.raw.isPrivate;
    });

    doc.title = doc.filename.substr(base.length + 1);

    return doc;
}
