"use strict";

const winston = require('winston');

const _logger = winston.createLogger({
    level: 'debug',
    format: winston.format.json(),
    transports: [
        new winston.transports.File( {filename: 'error.log', level:'error'}),
        new winston.transports.File( {
            filename: 'controller_events.log',
             level:'info',
             format:winston.format.combine(
                 winston.format.timestamp(),
                 winston.format.json()
             )
            }),
        new winston.transports.Console({
            format:winston.format.combine(
                winston.format.colorize(), 
                winston.format.simple())
        })
    ]
});


module.exports.logger = _logger;