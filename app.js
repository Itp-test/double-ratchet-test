const http = require('http');
const { uuid } = require('uuidv4');
const { setInterval } = require('timers');
const Ratchet = require('doubleratchet').Ratchet;

const hostname = '127.0.0.1';
const port = 3000;

// Added secret between two parties
const pskRoot       = '010061d5eb6946be4a77';
const pskHeader     = '020061d5eb6946be4a77';
const pskNextHeader = '030061d5eb6946be4a77';

// Created new instance for parties
const test1 = new Ratchet(pskRoot, pskHeader, pskNextHeader);
const test2 = new Ratchet(pskRoot, pskNextHeader, pskHeader);

// Added end-to-end encrypt for parties
const test2Handshake = test2.makeHandshake();
test1.acceptHandshake(test2Handshake);

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

// Decrypt message
function deliver(message) {
    console.log(message.to.decrypt(message.payload))
}

// Generate and encrypt message
function generateMessage(currentMessage) {
    if (currentMessage.to === 'test2') {
        deliver({
            payload: test1.encrypt(`Test message ${currentMessage.to}, id: ${currentMessage.id}`),
            to: test2,
        })
    } else {
        deliver({
            payload: test2.encrypt(`Test message ${currentMessage.to}, id: ${currentMessage.id}`),
            to: test1,
        })
    }
}

// Added setInterval for sent message every 10 seconds
setInterval(() => {
    const message = {
        id: uuid(),
        to: Math.random() > 0.5 ? 'test1' : 'test2'
    };
    generateMessage(message)
}, 10000);
