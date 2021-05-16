const Express = require('express');
const BodyParser = require('body-parser');
const Mongoose = require('mongoose');
const yargs = require('yargs/yargs');
const {hideBin} = require('yargs/helpers');
const winston = require('winston');
const expressWinston = require('express-winston');
const yaml = require('js-yaml');

const fs = require('fs');

const routes = require('./routes');

let application = Express();
application.use(BodyParser.json());
application.use(BodyParser.urlencoded({extended: true}));

argv = yargs(hideBin(process.argv)).options({
    'p': {
        alias: 'port',
        demandOption: false,
        describe: 'override config port',
        type: 'int',
        default: 0
    }, 'v': {
        alias: 'verbose',
        demandOption: false,
        describe: 'verbose logging',
        type: 'boolean',
        default: false
    }, 'c': {
        alias: 'config-path',
        demandOption: false,
        describe: 'path to config file which to use',
        type: 'string',
        default: './configs/local.yaml'
    }
}).version('1.0').usage('Usage: $0 -p [int] -v [bool] -c [string]').argv;

const configPath = argv['config-path'];
const port = argv.port;
const verbose = argv.verbose;

transports = [];
if (verbose) {
    transports.push(new winston.transports.Console());
}
transports.push(new winston.transports.File({'filename': 'logs/requests_log.json'}));

application.use(expressWinston.logger({
    transports,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    meta: false,
    msg: "HTTP  ",
    expressFormat: true,
    colorize: false,
    ignoreRoute: function (req, res) {
        return false;
    },
    requestWhitelist: [
        'url',
        'method',
        'httpVersion',
        'originalUrl',
        'query',
        'body'
    ]
}));

application.use('/api', routes);

serve = (configPath, port, verbose) => {
    let config = null;
    try {
        config = yaml.load(fs.readFileSync(configPath, 'utf8'));
    } catch (err) {
        console.log(err.stack || String(err));
        throw(err);
    }
    if (port <= 0) {
        port = config['server']['port'];
    }
    application.listen(port, config['server']['host'], () => {
        let mongoConf = config['mongo'];
        let connectionURL = '';
        let usPw = '';
        if (mongoConf['user'] || mongoConf['pass']) {
            usPw = `${mongoConf['user']}:${mongoConf['pass']}@`;
        }
        connectionURL = `mongodb://${usPw}${mongoConf['host']}:${mongoConf['port']}/${mongoConf['db']}`;

        Mongoose.connect(connectionURL, {useNewUrlParser: true, useUnifiedTopology: true}, (error, client) => {
            if (error) {
                throw error;
            }
            console.log(`Connection to ${mongoConf['db']} successful!`);
        });
    });
};

serve(configPath, port, verbose);

