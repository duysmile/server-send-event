const express = require('express');
const redis = require('redis');

const publisherClient = redis.createClient();

const app = express();

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/sse-server', (req, res, next) => {
    // req.socket.setTimeout(Number.MAX_VALUE);

    let messageCount = 0;
    const subscriber = redis.createClient();

    subscriber.subscribe('updates');
    
    subscriber.on('error', err => {
        console.error('Redis error: ' + err);
    });

    subscriber.on('message', (channel, message) => {
        ++messageCount;
        res.write(`id: ${messageCount}\n`);
        res.write(`data: ${message}\n\n`);
    });

    res.status(200).set({
        connection: 'keep-alive',
        'cache-control': 'no-cache',
        'content-type': 'text/event-stream'
    });

    res.write('\n');
    res.on('close', () => {
        subscriber.unsubscribe();
        subscriber.quit();
    });
});

app.get('/fire-event/:event_name', (req, res) => {
    publisherClient.publish('updates', ('"' + req.params.event_name + '" page visited'));
    res.status(200).set({
        'content-type': 'text/html'
    });
    res.write('All client have received "' + req.params.event_name + '"');
    res.end();
});

app.listen(3000, () => {
    console.log('Server started at port ' + 3000);
})
