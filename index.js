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

io.on('connection', socket => {

  function connectPeers(item) {
    io.to(full_node[0].id).emit('offer', item.offer, item.candidate, item.socket.id);
  }

  //full node connected
  socket.on('full-node', () => {
    full_node.push(socket);
    if(checkLow()) {
      const item = no_node.shift();
      connectPeers(item);
    }
    console.log('Connect full ' + socket.id);
  });

  //no-node connected
  socket.on('offer', (offer, candidate) => {
    no_node.push({
      socket: socket,
      offer: offer,
      candidate: candidate
    });

    if(checkFull()) {
      const item = no_node.shift();
      connectPeers(item);
    }
    console.log('Connect low ' + socket.id);
  });

  //answer from full-node
  socket.on('answer', (answer, candidate, id) => {
    socket.to(id).emit('answer', answer, candidate);
    io.sockets.connected[id].disconnect();

    //connect next peer
    if(checkLow()) {
      const item = no_node.shift();
      connectPeers(item);
    }
  });

  //clean disconnected peers
  socket.on('disconnect', () => {

    //check full disconnect
    full_node.forEach((item, i) => {
      if(item == socket) {
        full_node.splice(i, 1);
        console.log('disconnect full ' + item.id);
        return;
      }
    });

    //check low disconnect
    no_node.forEach((item, i) => {
      if(item.socket == socket) {
        no_node.splice(i, 1);
        console.log('disconnect low ' + item.socket.id);
        return;
      }
    });

  });

});
