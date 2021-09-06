/* eslint-disable camelcase */
exports.shorthands = undefined;

exports.up = pgm => {
    pgm.dropTable('messages', {ifExists: true});
    pgm.dropTable('images', {ifExists: true});

    pgm.createTable('images', {
        id: 'id',
        key: { type: 'varchar(1000)' },
        location: { type: 'varchar(1000)', notNull: true },
        createdAt: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        }
    });

    pgm.createTable('messages', {
        id: 'id',
        text: { type: 'varchar(10000)' },
        image: {
            type: 'integer',
            references: '"images"',
            onDelete: 'cascade',
        },
        createdAt: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        }
    });

};

exports.down = pgm => {};
