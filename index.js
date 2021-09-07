require('dotenv').config()

const fastify = require('fastify')({
    logger: true
});

// Extenral plugins
fastify.register(require('fastify-file-upload'));
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

fastify.get('/', (request, reply) => {
    reply.send();
});

fastify.listen(3000, (err, address) => {

    if (err) {
        fastify.log.error(err);
        process.exit(1);
    }

    fastify.log.info(`Server listening on ${address}`);
});