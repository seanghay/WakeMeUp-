document.addEventListener('DOMContentLoaded', () => {
    connectWebSocket()
    load();

    const imageView = document.querySelector('.image-view');

    imageView.addEventListener('click', (e) => {

        if (e.target == imageView) {
            showModal(false);
            const image = document.getElementById('image');
            image.src = null;
        }
    })

});

const buttonRefresh = document.getElementById('button-refresh');

const qr = new QRCode('qrcode', {
    text: "http://jindo.dev.naver.com/collie",
    width: 160,
    height: 160,
});

buttonRefresh.addEventListener('click', () => load());

function connectWebSocket() {
    console.log("connecting socket...")
    const socket = new WebSocket('ws://localhost:9080');
    socket.onopen = function () {
        console.log('Socket connected');
    }

    socket.onmessage = function (message) {

        const data = message.data;
        if (typeof data === 'string') {
            if (data.includes('#')) {
                const type = data.split('#')[0]
                const args = data.split('#')[1]

                if (type === 'ip') {
                    qr.makeCode(args);
                    console.log(args);
                }

                if (type === 'state') {
                    if (args === 'refresh') {
                        load()
                    }
                }
            }

        }

    }

    socket.onclose = function (close) {
        console.log(close);
        setTimeout(connectWebSocket, 1000);
    }

    socket.onerror = function (er) {
        console.log(er);
    }
}

function formatStatus(v) {
    const formats = {
        'device': 'Connected',
        'offline': 'Offline',
        'disconnect': 'Disconnected'
    }

    const colors = {
        'device': 'primary',
        'offline': 'secondary',
        'disconnect': 'warn'
    }

    const name = formats[v.toLowerCase()] || v
    const color = colors[v.toLowerCase()] || colors[0]


    return {
        name,
        color
    }
}


function load() {
    qr.clear();

    axios.get('devices')
        .then(res => {
            insert(merge(res.data));
        })
        .catch(err => console.error(error))
}


function merge(data) {
    const locals = loadLocal();
    const localArr = locals.filter(it => !data.some(x => x.id == it.id));
    return [...data, ...localArr];
}


function loadLocal() {
    const arr = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = JSON.parse(localStorage.getItem(key));
        arr.push({
            ...value,
            type: 'disconnect'
        });
    }

    if (arr.length === 0) return [];

    return arr;
}

function insert(data) {

    const deviceList = document.querySelector('#devices');
    deviceList.innerHTML = '';

    console.log(deviceList);

    data.map(item => {
        const li = document.createElement('li');
        const status = formatStatus(item.type);

        li.innerHTML = `
            <div class="id">${item.transport_id || 'N/A'}</div>
            <div class="group">
                <h5>${item.device || 'Unknown'} <span>${item.model || 'Unknown'}</span> </h5>
                <p>${item.id}</p>
            </div>
            <div class="status ${status.color}">${status.name}</div>
            <button class="wake">Wake</button>
            <button class="lock">Lock</button>
            <button class="camera"><i class="fa fa-camera"></i></button>
            <button class="disconnect">Disconnect</button>
        
            `.replace(/\s+/, '');

        const buttonWake = li.querySelector('button.wake')
        const buttonCamera = li.querySelector('button.camera')

        const buttonDisconnect = li.querySelector('button.disconnect');
        const buttonLock = li.querySelector('button.lock');

        buttonWake.addEventListener('click', () => {
            wakeup(buttonWake, item.id);
        });

        buttonLock.addEventListener('click', () => {
            lock(buttonLock, item.id);
        });


        buttonCamera.addEventListener('click', () => {
            screencap(buttonCamera, item.id);
        });

        buttonWake.disabled = item.type == 'disconnect';
        buttonLock.disabled = item.type == 'disconnect';
        buttonCamera.disabled = item.type == 'disconnect';

        buttonDisconnect.addEventListener('click', () => {

            if (item.type === 'disconnect') {
                connect(buttonDisconnect, item.id);
            } else {
                disconnect(buttonDisconnect, item.id);
            }


        });


        buttonDisconnect.disabled = !isValidIP(item.id)

        if (item.type === 'disconnect') {
            buttonDisconnect.textContent = 'Connect'
        } else {
            buttonDisconnect.textContent = 'Disconnect'
        }

        
        if (item.type === 'device') {
            if (isValidIP(item.id)) {
                save(item)
            }
        }

        return li;

    }).forEach(item => {
        deviceList.appendChild(item);
    })
}

function save(item) {
    localStorage.setItem(item.id, JSON.stringify(item));
}

function isValidIP(str) {
    const octet = '(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]?|0)';
    const regex = new RegExp(`^${octet}\\.${octet}\\.${octet}\\.${octet}:\\d+$`);
    return regex.test(str);
}

function disconnect(ref, id) {
    ref.disabled = true
    axios.post('disconnect', { id })
        .then(res => {
            ref.disabled = false
            console.log(res);
            load()
        })
        .catch(error => {
            console.log(error)
            ref.disabled = false
            load()
        });
}


function connect(ref, id) {
    ref.disabled = true
    axios.post('connect', { id })
        .then(res => {
            ref.disabled = false
            console.log(res);
            load()
        })
        .catch(error => {
            console.log(error)
            ref.disabled = false
            load()
        });
}


function wakeup(ref, id) {
    ref.disabled = true
    axios.post('wake', { id })
        .then(res => {
            ref.disabled = false
            console.log(res);
        })
        .catch(error => {
            console.log(error)
            ref.disabled = false
        });
}


function lock(ref, id) {
    ref.disabled = true
    axios.post('lock', { id })
        .then(res => {
            ref.disabled = false
            console.log(res);
        })
        .catch(error => {
            console.log(error)
            ref.disabled = false
        });
}



function screencap(ref, id) {
    ref.disabled = true
    axios.post('screencap', { id })
        .then(res => {
            ref.disabled = false
            console.log(res);
            handleView(res.data);
        })
        .catch(error => {
            console.log(error)
            ref.disabled = false
        });
}


function showModal(show) {
    const imageView = document.querySelector('.image-view');
    if (show) {
        imageView.classList.add('show')
    } else {
        imageView.classList.remove('show');
    }
}

function handleView(data) {
    const image = document.getElementById('image');
    image.src = data.url;
    showModal(true);
}

function int2ip(ipInt) {
    return ((ipInt >>> 24) + '.' + (ipInt >> 16 & 255) + '.' + (ipInt >> 8 & 255) + '.' + (ipInt & 255));
}

function ip2int(ip) {
    return ip.split('.').reduce(function (ipInt, octet) { return (ipInt << 8) + parseInt(octet, 10) }, 0) >>> 0;
}
