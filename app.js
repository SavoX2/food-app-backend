const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const yargs = require('yargs/yargs');
const {hideBin} = require('yargs/helpers');
const winston = require('winston');
const expressWinston = require('express-winston');
const yaml = require('js-yaml');

const fs = require('fs');

const routes = require('./routes');

let application = express();
application.use(bodyParser.json());
application.use(bodyParser.urlencoded({extended: true}));

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
let port = argv.port;
const verbose = argv.verbose;

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

transports = [];
if (verbose) {
    transports.push(new winston.transports.Console());
}
transports.push(new winston.transports.File({
    filename: `${config['log']['location']}/requests_log.json`,
    maxsize: config['log']['max_size'] * 1000
}));

application.use(expressWinston.logger({
    transports,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    meta: true,
    msg: "HTTP  ",
    expressFormat: true,
    colorize: false,
    ignoreRoute: function (req, res) {
        return req.originalUrl.includes('favicon.ico');
    },
    requestWhitelist: [
        'url',
        'method',
        'httpVersion',
        'originalUrl',
        'query',
        'body'
    ],
    dynamicMeta: (req, res) => {
        const httpRequest = {};
        const meta = {};
        if (req) {
            meta.httpRequest = httpRequest;
            httpRequest.requestMethod = req.method;
            httpRequest.requestUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
            httpRequest.protocol = `HTTP/${req.httpVersion}`;
            httpRequest.remoteIp = req.ip.indexOf(':') >= 0 ? req.ip.substring(req.ip.lastIndexOf(':') + 1) : req.ip; // just ipv4
            httpRequest.requestSize = req.socket.bytesRead;
            httpRequest.userAgent = req.get('User-Agent');
            httpRequest.referrer = req.get('Referrer');
        }
        if (res) {
            meta.httpRequest = httpRequest;
            httpRequest.status = res.statusCode;
            httpRequest.latency = {
                seconds: Math.floor(res.responseTime / 1000),
                nanos: (res.responseTime % 1000) * 1000000
            };
            if (res.body) {
                if (typeof res.body === 'object') {
                    httpRequest.responseSize = JSON.stringify(res.body).length;
                } else if (typeof res.body === 'string') {
                    httpRequest.responseSize = res.body.length;
                }
            }
        }
        return meta;
    }
}));
application.use('/api', routes);

application.listen(port, config['server']['host'], () => {
    let mongoConf = config['mongo'];
    let connectionURL = '';
    let usPw = '';
    if (mongoConf['user'] || mongoConf['pass']) {
        usPw = `${mongoConf['user']}:${mongoConf['pass']}@`;
    }
    connectionURL = `mongodb://${usPw}${mongoConf['host']}:${mongoConf['port']}/${mongoConf['db']}`;

    mongoose.connect(connectionURL, {useNewUrlParser: true, useUnifiedTopology: true}, (error, client) => {
        if (error) {
            throw error;
        }
        console.log(`Connection to ${mongoConf['db']} successful!`);
    });
});

