const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const http = require('http');
const WebSocket = require('ws');
const { getDevices, wakeup, lock, disconnect, connect, listenChanges, screencap } = require('./adb');

const app = express();

const server = http.createServer(app);

const wss = new WebSocket.Server({ server })
const port = process.env.PORT || 9080

function int2ip (ipInt) {
    return ( (ipInt>>>24) +'.' + (ipInt>>16 & 255) +'.' + (ipInt>>8 & 255) +'.' + (ipInt & 255) );
}

function ip2int(ip) {
    return ip.split('.').reduce(function(ipInt, octet) { return (ipInt<<8) + parseInt(octet, 10)}, 0) >>> 0;
}


// websockets
wss.on('connection', client => {
    client.send('ip#' + '192.168.1.32' + ':' + port);
});


app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(morgan('dev'))

app.use('/', express.static('public'))

app.get('/devices', (req, res) => {
    const devices = getDevices()
    res.json(devices);
});


app.post('/wake', (req, res) => {   
    const { id } = req.body;
    if (!id) return res.status(404).json({message: 'invalid'});
    
    const response = wakeup(id);

    return res.json({
        message: 'executed',
        output: response
    });
});


app.post('/disconnect', (req, res) => {   
    const { id } = req.body;
    if (!id) return res.status(404).json({message: 'invalid'});

    const response = disconnect(id);

    return res.json({
        message: 'executed',
        output: response
    });
});


app.post('/connect', (req, res) => {   
    const { id } = req.body;
    if (!id) return res.status(404).json({message: 'invalid'});
    
    const response = connect(id);



    return res.json({
        message: 'executed',
        output: response
    });
});





app.post('/lock', (req, res) => {   
    const { id } = req.body;
    if (!id) return res.status(404).json({message: 'invalid'});
    
    const response = lock(id);
    

    return res.json({
        message: 'executed',
        output: response
    });
});


app.post('/create-connection', (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(404)
        .json({ message: 'invalid', success: false});
    
    const response = connect(id);

    wss.clients.forEach(client => {
        client.send('state#refresh');
    })

    return res.json({
        message: 'Connected ' + response,
        success: true
    });
})


app.post('/screencap', (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(404).json({ message: 'invalid', success: false});
    const response = screencap(id)
    return res.json({
        url: response
    });
});

server.listen(port, () => console.info(`Server is listening on port ${port}`))