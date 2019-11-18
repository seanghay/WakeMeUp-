const shell = require('shelljs')
const _ = require('lodash');

function wakeup(id) {
    if (!shell.which('adb')) {
        shell.echo('Sorry this required ADB');
        shell.exit(1);
        return null;
    }

    const res = shell.exec(`adb -s ${id} shell input keyevent KEYCODE_WAKEUP && adb -s ${id} shell input keyevent 82`);

    return res.stdout;
}


function disconnect(id) {
    if (!shell.which('adb')) {
        shell.echo('Sorry this required ADB');
        shell.exit(1);
        return null;
    }

    const res = shell.exec(`adb disconnect ${id}`);

    return res.stdout;
}

function connect(id) {
    if (!shell.which('adb')) {
        shell.echo('Sorry this required ADB');
        shell.exit(1);
        return null;
    }

    const res = shell.exec(`adb connect ${id}`);

    return res.stdout;
}



function lock(id) {
    if (!shell.which('adb')) {
        shell.echo('Sorry this required ADB');
        shell.exit(1);
        return null;
    }

    const res = shell.exec(`adb -s ${id} shell input keyevent KEYCODE_POWER`);

    return res.stdout;
}

function getDevices() {
    if (!shell.which('adb')) {
        shell.echo('Sorry this required ADB');
        shell.exit(1);
        return [];
    }

    const res = shell.exec('adb devices -l')

    if (res.code !== 0) {
        shell.echo('Error while retrieving devices');
        shell.exit(1);
        return [];
    }

    return deviceParser(res.stdout);
}



function deviceParser(str) {

    const whitespaces = /\S+/g
    const lines = str.split('\n');
    if (lines.length <= 1) return []

    const rows = lines.slice(1, lines.length);

    const formatted = rows.map(r => r.match(whitespaces))
        .filter(x => x)
        .map(row => {

            const props = row.slice(2, row.length)
                .filter(x => x.includes(':'))
                .map(it => it.split(':'))
                .map(it => ({ [it[0]]: it[1] }));

            return {
                id: row[0],
                type: row[1],
                ...Object.assign({}, ...props),
            }
        });

    return formatted;
}

let last = null;

function isArrayEqual(x, y) {
    return _(x).differenceWith(y, _.isEqual).isEmpty();
};

function listenChanges(callback) {
    setTimeout(() => {
        const s = getDevices();
        if (!isArrayEqual(s, last)) {
            callback()
        } else {

        }

        last = s;
        listenChanges(callback);

    }, 10000);
}


function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}


function screencap(id) {

    if (!shell.which('adb')) {
        shell.echo('Sorry this required ADB');
        shell.exit(1);
        return null;
    }

    const randomName = makeid(14);
    const dir = `public/screen/${randomName}.png`
    const res = shell.exec(`adb -s ${id} exec-out screencap -p > ${dir}`);
    
    return `screen/${randomName}.png`
}

module.exports = {
    getDevices,
    wakeup,
    lock,
    disconnect,
    connect,
    listenChanges,
    screencap
}