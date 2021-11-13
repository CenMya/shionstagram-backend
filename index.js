require('dotenv').config()

const fastify = require('fastify')({
    logger: true
});


const cookie = require('fastify-cookie');
const session = require('@fastify/session');
const grant = require('grant').fastify();

const tokenStore = require('./services/tokenStore');

// External plugins
fastify.register(require('fastify-file-upload'));
fastify.register(cookie)
    .register(session, {secret: process.env.SESSION_SECRET, cookie: {secure: false}})
    .register(grant({
        "defaults": {
            "origin": `${process.env.ORIGIN}/api`,
            "transport": "session",
            state: true,
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

// Admin authentication
fastify.register(require('fastify-auth'));
fastify
    .decorate('verifyAdmin', (request, reply, done) => {
        const token = request.body.token;

        if(!token) {
            return done(new Error('missing token'));
        }

        const isInvalid = !tokenStore.verifyToken(token);

        if(isInvalid) return done(new Error('invalid token'));

        return done();
    });

// Disable CORS when doing local development
fastify.addHook('preHandler', function (req, reply, done) {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.header("Access-Control-Allow-Methods", "*");
    reply.header("Access-Control-Allow-Headers", "*");
    done()
});

// Another CORS fix
fastify.route({
    method: 'OPTIONS',
    url: '/*',
    handler: async (request, reply) => {
      reply.code(204)
        .header('Content-Length', '0')
        .header('Access-Control-Allow-Origin', '*')
        .header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE')
        .send()
    }
});
  

// Register routes here
fastify.register(require('./services/message'));
fastify.register(require('./services/image'));
fastify.register(require('./services/oauth'));
fastify.register(require('./services/admin'));

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