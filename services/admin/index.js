const tokenStore = require('../tokenStore');

async function routes (fastify, options) {
    fastify.route({
        method: 'DELETE',
        url: '/admin/message',
        preHandler: fastify.auth([
            fastify.verifyAdmin,
        ]),
        handler: async (request, reply) => {

        const messageId = request.body.id;

        const onConnect = (err, client, release) => {
            if (err) return reply.send(err);

            client.query(
                'DELETE FROM messages WHERE id=$1 RETURNING image', [messageId],
                function onResult (err, result) {

                    client.query(
                        'DELETE FROM images WHERE image=$1', [result.rows[0].image],
                        (err, result) => reply.send(err || result)
                    );
                }
            );
        };
        
        fastify.pg.connect(onConnect);
    }});
}

module.exports = routes;