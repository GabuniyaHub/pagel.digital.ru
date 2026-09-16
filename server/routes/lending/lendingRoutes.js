const express = require('express');
const lendingRoutes = express.Router();
const path = require('path');

const LENDING_DIR = path.join(__dirname, '../../../client/pages/lending');

lendingRoutes.get('/', (req, res) => {
    res.sendFile(path.join(LENDING_DIR, 'present.html'));
});

lendingRoutes.get('/escrow', (req, res) => {
    res.sendFile(path.join(LENDING_DIR, 'escrow.html'));
});

lendingRoutes.get('/about', (req, res) => {
    res.sendFile(path.join(LENDING_DIR, 'aboutUS.html'));
});

lendingRoutes.get('/contacts', (req, res) => {
    res.sendFile(path.join(LENDING_DIR, 'contacts.html'));
});

lendingRoutes.get('/policy', (req, res) => {
    res.sendFile(path.join(LENDING_DIR, 'policy.html'));
});

lendingRoutes.get('/terms', (req, res) => {
    res.sendFile(path.join(LENDING_DIR, 'termsOfService.html'));
});

module.exports = lendingRoutes;