const tokenStore = require('../tokenStore');

async function routes (fastify, options) {
    fastify.route({
        method: 'POST',
        url: '/admin/message',
        preHandler: fastify.auth([
            fastify.verifyAdmin,
        ]),
        handler: async (request, reply) => {

        const messageId = request.body.id;
        const approved = request.body.approved;

        const onConnect = (err, client, release) => {
            if (err) return reply.send(err);

            client.query(
                'UPDATE messages SET approved=$1 WHERE id=$2', [approved, messageId],
                function onResult (err, result) {
                    release();
                    reply.send(err || result);
                }
            );
        };
        
        fastify.pg.connect(onConnect);
    }});
}

module.exports = routes;