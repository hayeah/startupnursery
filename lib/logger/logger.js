'use strict';
var winston;

try {
    winston = require('winston');
} catch(err) {
    throw new Error('Please install winston package manually');
}

var outputs = {
    console:{
        enable:true,
        levels:{
            debug:true,
            info:false,
            error:false
        }
    },
    file:{
        enable:false,
        levels:{
            info:true,
            error:true
        }
    }
};

var logger = new (winston.Logger)({
    transports:[
        new (winston.transports.Console)({
            level:'debug',
            name:'debug-console',
            silent:!(outputs.console.enable && outputs.console.levels.debug),
            prettyPrint:true,
            colorize:true
        }),
        new (winston.transports.Console)({
            level:'info',
            name:'info-console',
            silent:!(outputs.console.enable && outputs.console.levels.info),
            colorize:true
        }),
        new (winston.transports.Console)({
            level:'error',
            name:'error-console',
            silent:!(outputs.console.enable && outputs.console.levels.error),
            colorize:true
        }),
        new (winston.transports.File)({
            level:'info',
            name:'info-file',
            filename:'logs/nappjs-info.log',
            silent:!(outputs.file.enable && outputs.file.levels.info),
            json:false
        }),
        new (winston.transports.File)({
            level:'error',
            name:'error-file',
            filename:'logs/nappjs-error.log',
            silent:!(outputs.file.enable && outputs.file.levels.error),
            json:false
        })
    ]
});

module.exports = logger;

/*
levels = {
    silly:0,
    input:1,
    verbose:2,
    prompt:3,
    debug:4,
    info:5,
    data:6,
    help:7,
    warn:8,
    error:9
};

colors = {
    silly:'magenta',
    input:'grey',
    verbose:'cyan',
    prompt:'grey',
    debug:'blue',
    info:'green',
    data:'grey',
    help:'cyan',
    warn:'yellow',
    error:'red'
};
*/
