const express = require('express');
const lendingRoutes = express.Router();
const path = require('path');
const db = require('../../config/db'); // база данных

lendingRoutes.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/lending/present.html'));
});

lendingRoutes.get('/escrow', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/lending/escrow.html'));
});

lendingRoutes.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/lending/aboutUS.html'));
});

lengdingRoutes.get('/contacts', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/lending/contacts.html'));
});

lendingRoutes.get('/policy', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/lending/policy.html'));
});

lendingRoutes.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/lending/termsOfService.html'));
});

module.exports = lendingRoutes;