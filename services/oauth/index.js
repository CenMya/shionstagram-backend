async function routes (fastify, options) {
    fastify.get('/oauth', (request, reply) => {

        fastify.log.info(request.session);
        fastify.log.info(request.session.grant);
    });
}