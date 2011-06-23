var config = {}

config.db = {};
config.web = {};

config.db.host      = 'localhost';
config.db.user      = 'root';
config.db.password  = '';
config.db.db        = 'db';
config.db.table     = 'table';

config.web.port = process.env.WEB_PORT || 8080;

module.exports = config;