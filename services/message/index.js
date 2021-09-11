const spaces = require('../spaces');

async function routes (fastify, options) {
    fastify.get('/messages', (request, reply) => {

        const onConnect = (err, client, release) => {
            if(err) return reply.send(err);

            client.query(
                'SELECT messages.id as id, text, approved, images.location FROM messages LEFT JOIN images ON messages.image=images.id WHERE messages.approved=true',
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
            if (err) return reply.send(err);

            client.query(
                'INSERT INTO messages (text, image, approved) VALUES ($1, $2, true) RETURNING id, image', [request.body.text, request.body.image],
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