const tokenStore = require('../tokenStore');
const got = require('got');

async function routes (fastify, options) {
    fastify.get('/oauth', async (request, reply) => {

        const sessionGrant = request.session.grant.response;

        try {
            const discordPromise = got('https://discord.com/api/v9/users/@me', {
                headers: {
                    'Authorization': `${sessionGrant.token_type}: ${sessionGrant.access_token}`,
                },
            });
            const discordBodyPromise = discordPromise.json();

            const [discordResponse, discordUser] = await  Promise.all([discordPromise, discordBodyPromise]);

            if(!discordResponse.statusCode !== 200) {
                throw Error(`Discord authentication failed with code ${discordResponse.status}`);
            }


            fastify.log.info(discordUser);

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
                            const tokenObj = tokenStore.registerUser(discordUser.id, isAdmin);
                            return reply.redirect(`${process.env.ORIGIN}/admin?token=${tokenObj.token}`);
                        }

                        throw Error('User is not an admin');
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