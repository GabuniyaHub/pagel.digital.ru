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
