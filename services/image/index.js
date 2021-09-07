const spaces = require('../spaces');
const uuidv4 = require('uuid').v4;

const { Readable } = require('stream');

// Copyright 2021 StackOverFlow: https://stackoverflow.com/questions/47089230/how-to-convert-buffer-to-stream-in-nodejs
function bufferToStream(binary) {
    const readableInstanceStream = new Readable({
        read() {
            this.push(binary);
            this.push(null);
        }
    });

    return readableInstanceStream;
}

async function routes (fastify, options) {

    fastify.post('/image', (request, reply) => {

        const image = request.raw.files.image;

        if(image.mimetype.includes('image') && image.size > 5000000) {
            const onConnect = (err, client, release) => {
                if(err) return reply.send(err);

                const uuid = uuidv4();

                var params = {
                    Bucket: "shionstagram-spaces",
                    Key: "",
                    Body: "",
                    ACL: "private",
                };
                
                let suffix;
                if(image.mimetype === 'image/jpeg' || image.mimetype === 'image/png' || image.mimetype === 'image/gif') {
                    suffix = image.mimetype.split('/')[1];
                } else {
                    return reply.code(415).send('Unsupported file. Supported: image/jpeg, image/png, image/gif');
                }

                params.Body = bufferToStream(image.data);
                const key = `${uuid}.${suffix}`;
                params.Key = key;

                spaces.upload(params, (err, data) => {
                    if (err) {
                        console.log('Error', err);
                    } if (data) {
                        console.log('Upload success', data.Location);
                        client.query(
                            'INSERT INTO images (key, location) VALUES ($1, $2) RETURNING id, key, location', [key, data.Location],
                            function onResult (err, result) {
                                release();
                                reply.send(err || result);
                            }
                        );
                    }
                });


        };

        fastify.pg.connect(onConnect);

        }

    });
}

module.exports = routes;