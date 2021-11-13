const spaces = require('../spaces');

async function routes (fastify, options) {
    fastify.get('/messages', (request, reply) => {

        const onConnect = (err, client, release) => {
            if(err) return reply.send(err);

            client.query(
                'SELECT messages.id as id, message, approved, images.location FROM messages LEFT JOIN images ON messages.image=images.id WHERE messages.approved=true',
                function onResult (err, result) {
                    release();
                    reply.send(err || result.rows);
                }
            )
        };

        fastify.pg.connect(onConnect);
    });

    fastify.post('/message', (request, reply) => {

        const onConnect = (err, client, release) => {
            if (err) return reply.send(err);

            client.query(
                'INSERT INTO messages (message, image, type, twitter, approved) VALUES ($1, $2, $3, $4, true) RETURNING id, image, message, type, twitter, approved', [request.body.message, request.body.image, request.body.mediaType, request.body.twitter],
                function onResult (err, result) {
                    release();
                    reply.send(err || result.rows[0]);
                }
            );
        };

        fastify.pg.connect(onConnect);
    });
}

module.exports = routes;