var program = require('commander');

program
    .option('-a, --adapter <adapter>', 'Adapter to use: Memory, Mongo.', String, 'Memory')
    .option('-t, --test <test>', 'Test name: adapter, complete.', String, 'adapter')
    .option('-A, --amount <amount>', 'Amount of messages to send.', Number, 15000)
    .option('-d, --data <data>', 'Data to use for tests.', String, 'mytestdadta')
    .parse(process.argv)

console.time(program.test);

require('./' + program.test).run(program, function() {
    console.timeEnd(program.test);
    process.exit();
});

