const { Client } = require("pg");
require("dotenv").config();

const client = new Client({ //Вход в посгрес:
    user: "postgres",
    host: "localhost",
    database: "plgl",
    password: "123321aguram",
    port: 5432,
});

//Логи входа в PSQL:
client.connect()
    .then(() => console.log("Connected to PostgreSQL"))
    .catch(err => console.error("Connection error", err));

module.exports = client;


// для сервера
// const client = new Client({
//     user: process.env.DB_USER,
//     host: process.env.DB_HOST,
//     database: process.env.DB_NAME,
//     password: process.env.DB_PASSWORD,
//     port: process.env.DB_PORT,
// });

// client.connect()
//     .then(() => console.log("Connected to PostgreSQL"))
//     .catch(err => console.error("Connection error", err));

// module.exports = client;