const spaces = require('../../spaces');

async function routes (fastify, options) {
    fastify.get('/messages', (request, reply) => {

        const onConnect = (err, client, release) => {
            if(err) return reply.send(err);

            client.query(
                'SELECT * FROM messages INNER JOIN images ON messages.image=images.id',
                function onResult (err, result) {
                    release();
                    reply.send(err || result);
                }
            )
        };

        fastify.pg.connect(onConnect);
    });

    fastify.post('/message', (request, reply) => {

        const onConnect = (err, client, release) => {
            if(err) return reply.send(err);

            client.query(
                'INSERT INTO messages (text, image) VALUES ($1, $2) RETURNING id, image', [request.body.text, request.body.image],
                function onResult (err, result) {
                    release();
                    reply.send(err || result);
                }
            );
        };

        fastify.pg.connect(onConnect);
    });
}

module.exports = routes;