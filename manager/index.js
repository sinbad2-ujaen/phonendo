require('dotenv').config()
const { Express } = require("./core/Express");
const { promisePostRequest, promiseDeleteRequest } = require('./core/httpClient')
const { v4: uuidv4 } = require('uuid');
const { generateKeyPairSync, createHash } = require("node:crypto");
const toBytes = (string) => Array.from(Buffer.from(string, 'utf8'));


const express = new Express(process.env.PORT_MANAGER, "Manager")
express.get('/', async (_, res) => {
    res.send('Service is alive')
});

express.post('/registerDevice', (req, res) => {
    if (!req.body.token || req.body.token !== process.env.API_TOKEN_MANAGER) {
        res.status(401).send('Not authorized');
    } else {
        let device = req.body.device;
        let type = req.body.type;
        let serialNumber = req.body.serialNumber;
        let creationDatetime = req.body.creationDatetime;

        if (device) {
            console.log("New device received: " + device);
            // send to storage
            let message = {
                key: device,
                value: {
                    device: device,
                    type: type,
                    serialNumber: serialNumber,
                    creationDatetime: creationDatetime
                }
            };

            let body = {
                token: process.env.API_TOKEN_STORAGE,
                message: message
            };

            promisePostRequest(process.env.INTERNAL_URL_STORAGE_DEVICES, body);

            res.status(200).send("Successfully registered");

        } else {
            res.status(403).send("Bad request");
        }
    }
});

express.post('/newEvent',async (req, res) => {
    if (!req.body.token || req.body.token !== process.env.API_TOKEN_MANAGER) {
        res.status(401).send('Not authorized');
    } else {
        let type = req.body.type;
        let value = req.body.value;
        let device = req.body.device;

        console.log("New event received: " + type + " // " + value + " // " + device);

        let message = {
            key: uuidv4(),
            value: {
                type: type,
                value: value,
                device: device,
                creationDatetime: new Date().getTime()
            }
        };

        message = signDataSource(message);

        // Store event on Storage as Captured
        let body = {
            token: process.env.API_TOKEN_STORAGE,
            message: message
        };

        let storedMessage = await promisePostRequest(process.env.INTERNAL_URL_STORAGE_EVENTS, body);

        // Verify event
        body.message = storedMessage;
        body.token = process.env.API_TOKEN_VERIFIER;

        let verifiedMessage = await promisePostRequest(process.env.INTERNAL_URL_VERIFIER_VERIFY, body);

        // Store event on Storage as Verified
        body.message = verifiedMessage;
        body.token = process.env.API_TOKEN_STORAGE;

        let storedVerifiedMessage = await promisePostRequest(process.env.INTERNAL_URL_STORAGE_EVENTS, body);

        // Publish event
        body.message = storedVerifiedMessage;
        body.token = process.env.API_TOKEN_PUBLISHER;
        let publishedMessage = await promisePostRequest(process.env.INTERNAL_URL_PUBLISHER_PUBLISH, body);

        body.token = process.env.API_TOKEN_STORAGE;

        // Delete event from Storage
        promiseDeleteRequest(process.env.INTERNAL_URL_STORAGE_EVENTS + "/" + publishedMessage.key, body);

        res.status(200).send('Event processed');
    }
});

function signDataSource(message) {

    const hash = createHash('sha256').update(message.value.device + 'Phonendo').digest('hex');

    const bytes = toBytes(hash);

    return message;
}

express.run();