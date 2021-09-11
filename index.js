require('dotenv').config()

const fastify = require('fastify')({
    logger: true
});


const cookie = require('fastify-cookie');
const session = require('@fastify/session');
const grant = require('grant').fastify();

// External plugins
fastify.register(require('fastify-file-upload'));
fastify.register(cookie)
    .register(session, {secret: process.env.SESSION_SECRET, cookie: {secure: false}})
    .register(grant({
        "defaults": {
            "origin": "https://shionstagram.com/api",
            "transport": "session"
        },
        "discord": {
            "key": process.env.DISCORD_KEY,
            "secret": process.env.DISCORD_SECRET,
            "scope": ["identify"],
            "callback": "/api/oauth",
        }
    }));
fastify.register(require('fastify-postgres'), {
    "user": process.env.DB_USER,
    "password": process.env.DB_PASSWORD,
    "host": process.env.DB_HOST,
    "port": process.env.DB_PORT,
    "database": process.env.DB_DATABASE, 
    ssl: {
        rejectUnauthorized: false,
    }
});

// Register routes here
fastify.register(require('./services/message'));
fastify.register(require('./services/image'));
fastify.register(require('./services/oauth'));

fastify.get('/', (request, reply) => {
    reply.send();
});

fastify.listen(process.env.PORT || 3000,'0.0.0.0', (err, address) => {

    if (err) {
        fastify.log.error(err);
        process.exit(1);
    }

    fastify.log.info(`Server listening on ${address}`);
});