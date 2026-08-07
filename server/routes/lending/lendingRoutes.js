const express = require('express');
const lendingRoutes = express.Router();
const path = require('path');

lendingRoutes.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/pages/lending/present.html'));
});

lendingRoutes.get('/escrow', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../client/pages/lending/escrow.html'));
});

lendingRoutes.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../client/pages/lending/aboutUS.html'));
});

lendingRoutes.get('/contacts', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../client/pages/lending/contacts.html'));
});

lendingRoutes.get('/policy', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../client/pages/lending/policy.html'));
});

lendingRoutes.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../client/pages/lending/termsOfService.html'));
});

module.exports = lendingRoutes;