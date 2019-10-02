'use strict'

const PORT = process.env.PORT || 3000;

const server = require('http').createServer((req, res) => {
  res.end('Socket-server is running');
});
const io = require('socket.io')(server);
server.listen(PORT);
//////////
//////////

let full_node = [];
let no_node = [];

// check an available no_node peer
const checkLow = function() {
  return no_node.length != 0 ? true : false;
}

// check an available full_node peer
const checkFull = function() {
  return full_node.length != 0 ? true : false;
}

//connect peers
const connectPeers = function(io) {
  if(!checkFull()) {
    no_node.forEach(item => {
      io.to(item.socket.id).emit('no-available');
    });
  }
  else if(checkLow()) {
    const sender = full_node[0];
    const recipient = no_node[0];
    io.to(sender.id).emit('offer', recipient.offer);
  }
}

//Connect
io.on('connection', (socket) => {

  //full node connected
  socket.on('full-node', () => {
    full_node.push(socket);
    connectPeers(io);
  });

  //no-node connected
  socket.on('no-node', (offer) => {
    no_node.push({
      socket: socket,
      offer: offer
    });;
    connectPeers(io);
  });

  //answer was recieved from full node
  socket.on('answer-full', (answer) => {
    // console.log(no_node);
    const recipient = no_node.shift();
    socket.to(recipient.socket.id).emit('answer', answer);
    recipient.socket.disconnect();
  });

  //client was disconnected
  socket.on('disconnect', () => {
    full_node.forEach((item, i) => {
      if(item == socket) {
        full_node.splice(i, 1);
        return;
      }
    });

    no_node.forEach((item, i) => {
      if(item.socket == socket) {
        no_node.splice(i, 1);
        return;
      }
    });
    connectPeers(io);
  });
});
