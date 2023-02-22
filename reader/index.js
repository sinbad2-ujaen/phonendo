require('dotenv').config();
const { Express } = require("./core/Express");
const { promisePostRequest } = require('./core/httpClient')

const DEVICE_TYPE = {
    Smartwatch: "SMARTWATCH"
};

const EVENT_TYPE = {
    Heartrate: "HEART_RATE"
}

const express = new Express(process.env.PORT_READER, "Reader")
express.get('/', (_, res) => {
    res.send('Service is alive')
});

express.get('/fakeDevice', (_, res) => {
    //todo remove fake
    newDevice()

    res.send('Service is alive')
});

express.get('/fakeEvent', (_, res) => {
    //todo remove fake
    newEvent()

    res.send('Service is alive')
});

function initBluetooth() {
    //todo
}

function newDevice() {
    //todo

    // todo fake data
    let body = {
        token: process.env.API_TOKEN_MANAGER,
        device: "F5:C5:D8:50:BB:D5",
        type: DEVICE_TYPE.Smartwatch,
        serialNumber: Math.floor(Math.random() * 10000000),
        creationDatetime: new Date().getTime()
    };

    promisePostRequest(process.env.INTERNAL_URL_MANAGER_REGISTER_DEVICE, body);
}

function newEvent() {
    // todo

    // todo fake data
    let body = {
        token: process.env.API_TOKEN_MANAGER,
        type: EVENT_TYPE.Heartrate,
        value: Math.floor(Math.random() * 200),
        device: "F5:C5:D8:50:BB:D5",
        creationDatetime: new Date().getTime()
    };

    promisePostRequest(process.env.INTERNAL_URL_MANAGER_NEW_EVENT, body);
}

express.run();