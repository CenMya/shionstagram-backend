/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    // Insert initial admin user
    pgm.sql(`INSERT INTO users ("discordUserId", "discordUserName", "admin") VALUES ('${process.env.ADMIN_DISCORD_ID}', '${process.env.ADMIN_DISCORD_USERNAME}', true)`);
};

exports.down = pgm => {};
