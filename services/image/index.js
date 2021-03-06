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

const onDBAddResultSendReply = (fastify, release, reply) => (err, result) => {
    if(result && !err) {
        fastify.log.info(`Upload success ${result.rows[0].location}`);
    }
    release();
    reply.send(err || result.rows[0]);
}

const onConnectUploadToSpaces = (fastify, reply, image) => (err, client, release) => {
    if(err) return reply.code(500).send(err);

    const uuid = uuidv4();

    var params = {
        Bucket: "shionstagram",
        Key: "",
        Body: "",
        ACL: "public-read",
    };
                
    let suffix;
    if(image.mimetype === 'image/jpeg' || image.mimetype === 'image/png' || image.mimetype === 'image/gif' || image.mimetype === "image/apng") {
        suffix = image.mimetype.split('/')[1];
    } else {
        return reply.code(415).send('Unsupported file. Supported: image/jpeg, image/png, image/gif', 'image/apng');
    }

    params.Body = bufferToStream(image.data);
    const key = `${uuid}.${suffix}`;
    params.Key = key;

    spaces.upload(params, (err, data) => {
        if (err) {
            console.log('Error', err);
            reply.code(500).send(err);
        } if (data) {
            client.query(
                'INSERT INTO images (key, location) VALUES ($1, $2) RETURNING id, key, location', [key, `${process.env.SPACES_DOMAIN}/${data.key}`],
                onDBAddResultSendReply(fastify, release, reply)
            );
        }
    });
}

async function routes (fastify, options) {
    fastify.post('/image', (request, reply) => {
        const image = request.body.file;

        if (!image.mimetype.includes('image')) {
            return reply.code(415).send("Image type not recognized.");
        }

        if (!image.size > 5000000) {
            return reply.code(415).send("The image is too large.");
        }

        fastify.pg.connect(onConnectUploadToSpaces(fastify, reply, image));
    });
}

module.exports = routes;