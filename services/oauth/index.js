const tokenStore = require('../tokenStore');

async function routes (fastify, options) {
    fastify.get('/oauth', async (request, reply) => {

        const sessionGrant = request.session.grant.response;

        fastify.log.info(request.session);
        fastify.log.info(request.session.grant);

        const discordMeRequest = new Request('https://discord.com/api/v9/users/@me');

        const requestHeaders = new Headers();
        requestHeaders.append('Authorization', `${sessionGrant.token_type}: ${sessionGrant.access_token}`)

        const requestInit = {
            method: 'GET',
            headers: requestHeaders,
            mode: 'cors',
            cache: 'no-cache',
        };

        try {
            const discordResponse = await fetch(discordMeRequest, requestInit);

            if(!discordResponse.ok) {
                throw Error(`Discord authentication failed with code ${discordResponse.status}`);
            }

            const discordUser = discordResponse.json();

            const onConnect = (err, client, release) => {
                if (err) throw Error(`Database connection failed: ${err}`);

                client.query(
                    'SELECT admin FROM users WHERE discordUserId=$1', [discordUser.id],
                    function onResult (err, result) {
                        release();

                        if (err) {
                            throw Error(`Database query failed with error: ${err}`);
                        }

                        const isAdmin = result.rows[0][0];

                        if(isAdmin) {
                            tokenStore.registerUser(discordUser.id, isAdmin);
                        }
                    }
                );
            }

            fastify.pg.connect(onConnect);
        } catch(err) {
            fastify.log.error(err);
            return reply.redirect(`${process.env.ORIGIN}/error?reason=authentication_failed`);
        }
    });
}

module.exports = routes;