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

  function connectPeers() {
    const item = no_node.shift();

    io.to(full_node[0].id).emit('offer', item.offer, item.socket.id);
    setTimeout(() => {
      if (io.sockets.connected[item.socket.id])
        io.sockets.connected[item.socket.id].disconnect();
    }, 10000);
  }

  //full node connected
  socket.on('full-node', () => {
    full_node.push(socket);

    if(checkLow()) connectPeers();

    console.log('Connect full ' + new Date() + ' ' + socket.id);
    console.log('Full_node: ' + full_node.length);
  });

  //no-node connected
  socket.on('offer', (offer) => {
    no_node.push({
      socket: socket,
      offer: offer
    });

    if(checkFull()) connectPeers();

    console.log('Connect low ' + new Date() + ' ' + socket.id);
    console.log('No_node: ' + no_node.length);
  });

  //answer from full-node
  socket.on('answer', (answer, id) => {
    socket.to(id).emit('answer', answer);

    //connect next peer
    if(checkLow()) connectPeers();

  });


  //clean disconnected peers
  socket.on('disconnect', () => {

    //check full disconnect
    full_node.forEach((item, i) => {
      if(item == socket) {
        console.log('disconnect full ' + item.id);
        return full_node.splice(i, 1);
      }
    });

    //check low disconnect
    no_node.forEach((item, i) => {
      if(item.socket == socket) {
        console.log('disconnect low ' + item.socket.id);
        return no_node.splice(i, 1);
      }
    });

    console.log('No_node: ' + no_node.length);
    console.log('Full_node: ' + full_node.length);
  });

});

setInterval(() => {
  //do somthing
  console.log('Socket-server is running');
  console.log('No_node: ' + no_node.length);
  console.log('Full_node: ' + full_node.length);
}, 60000);
