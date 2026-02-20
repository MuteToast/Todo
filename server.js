const express = require('express');
const bodyParser = require('body-parser');
const webpush = require('web-push');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public')); // din HTML/CSS/JS ligger här

// VAPID-nycklar
const publicVapidKey = 'BGp8UXausFLBjlcTXHKUTbZ7lhOUX60fKxL1Mtybb3NQq3gyi5mvaLiYfC09aqSoRh80vfNTWyhaKcZYMNB_9EE';
const privateVapidKey = '98b2_aLprpevN9NPVqLVQipbjgQhPIgKruo8ek_N9DY';

webpush.setVapidDetails(
    'mailto:dinmail@exempel.com',
    publicVapidKey,
    privateVapidKey
);

// spara prenumerationer i minnet (eller databas)
let subscriptions = [];

// endpoint för att prenumerera
app.post('/subscribe', (req, res) => {
    const subscription = req.body;
    subscriptions.push(subscription);
    res.status(201).json({});
});

// endpoint för att skicka push
app.post('/send-notification', (req, res) => {
    const { title, body } = req.body;
    const payload = JSON.stringify({ title, body });

    Promise.all(subscriptions.map(sub => webpush.sendNotification(sub, payload)))
    .then(() => res.status(200).json({ message: 'Notiser skickade!' }))
    .catch(err => {
        console.error(err);
        res.sendStatus(500);
    });
});

app.listen(3000, () => console.log('Server körs på port 3000'));
