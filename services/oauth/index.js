const tokenStore = require('../tokenStore');
const axios = require('axios');

async function routes (fastify, options) {
    fastify.get('/oauth', async (request, reply) => {

        const sessionGrant = request.session.grant.response;

        try {

            const discordResponse = await axios(
                {
                    method: 'get',
                    url: 'https://discord.com/api/v9/users/@me',
                    headers: {
                        Authorization: `Bearer ${sessionGrant.access_token}`
                    }
                    
            });

            if(discordResponse.status !== 200) {
                throw Error(`Discord authentication failed with code ${discordResponse.status}`);
            }

            const discordUser = discordResponse.data;

            fastify.log.info(discordUser);

            const onConnect = (err, client, release) => {
                if (err) throw Error(`Database connection failed with ${err}`);

                client.query(
                    `SELECT admin FROM users WHERE "discordUserId"=$1`, [discordUser.id],
                    function onResult (err, result) {
                        release();

                        if (err) {
                            throw Error(`Database query failed with ${err}`);
                        }

                        console.log(result);

                        const isAdmin = result.rows[0].admin;

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