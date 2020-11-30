const readline = require('readline');
const Ratchet = require('doubleratchet').Ratchet;
const fs = require("fs");

// Added secret between two parties
const pskRoot       = '010061d5eb6946be4a77'
const pskHeader     = '020061d5eb6946be4a77'
const pskNextHeader = '030061d5eb6946be4a77'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Created new instance for parties
const person1 = new Ratchet(pskRoot, pskHeader, pskNextHeader);
const person2 = new Ratchet(pskRoot, pskNextHeader, pskHeader);

// Added end-to-end encrypt for parties
const person2Handshake = person2.makeHandshake();
person1.acceptHandshake(person2Handshake);

let currentStateForPerson1 = null;
let currentStateForPerson2 = null;
let currentMessage = '';

// Check, if message delivered
function deliver(message) {
  console.log(message);
  currentMessage = message;
  currentStateForPerson1 = person1.getState();
  currentStateForPerson2 = person2.getState();
}

// Generate and encrypt message
function generateMessage(message) {
  if (message.to === 'person1' || message.to === 'person2') {
    if (message.to === 'person2') {
      deliver(person1.encrypt(`${message.text}`))
    } else {
      deliver(person2.encrypt(`${message.text}`))
    }
  } else {
    console.log('Error, incorrect user');
    return
  }
}

rl.on('line', (input) => {
  const splitedInput = input.split(':');
  const info = splitedInput ? splitedInput[0].split(' ') : input.split(' ');
  const action = info[0];
  const personName = info[2];
  const messageText = splitedInput[1] && splitedInput[1].trim() || '';

  switch (action) {
    case 'send':
      const message = {
        to: personName,
        text: messageText
      };
      generateMessage(message);
      break;
    case 'receive':
      if (!currentMessage) {
        console.log('No message for receive');
        return;
      }

      if (personName === 'person1') {
        console.log(person1.decrypt(currentMessage));
      } else
      if (personName === 'person2') {
        console.log(person2.decrypt(currentMessage));
      } else {
        console.log('Error, incorrect user');
      }
      break;

    case 'getState':
      if (personName === 'person1') {
        console.log(currentStateForPerson1);
      } else
      if (personName === 'person2') {
        console.log(currentStateForPerson2);
      } else {
        console.log('Error, incorrect user');
      }
      break;

    case 'saveState':
      let fileContent = null;

      fs.readFile(`${personName}-state.txt`, 'utf8', function(err, data) {
        if(err) {
          fileContent = null;
        } else {
          fileContent = data;
        };
      });

      const state = personName === 'person1' ? JSON.stringify(currentStateForPerson1) : JSON.stringify(currentStateForPerson2);

      if (fileContent) {
        fs.appendFileSync(`${personName}-state.txt`, state);
      } else {
        fs.writeFileSync(`${personName}-state.txt`, state)
      }
      break;

    case 'readState':
      fs.readFile(`${personName}-state.txt`, 'utf8', function(err, data) {
        if(err) {
          console.log('This file is not exist');
          return
        } else {
          console.log(JSON.parse(data));
        };
      });
      break;
    default:
      break;
  }
});

