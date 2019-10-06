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

// setInterval(function () {
//   console.log(no_node);
// }, 3000);
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
    // console.log('emit to ' + full_node[0].id + ' from ' + item.socket.id);
    // if(checkLow()) {
    //   const item = no_node.shift();
    //   connectPeers(item);
    // }
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

    // console.log('offer from ' + socket.id);

    if(checkFull()) {
      const item = no_node.shift();
      connectPeers(item);
    }
    console.log('Connect low ' + socket.id);
  });

  socket.on('answer', (answer, id) => {
    // console.log('answer from ' + socket.id);
    socket.to(id).emit('answer', answer);
    console.log('answer emit');
    io.sockets.connected[id].disconnect();

    if(checkLow()) {
      const item = no_node.shift();
      connectPeers(item);
    }
  });

  // socket.on('success', () => {
  //   socket.disconnect();
  // });

  //disconnect
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

//
// // check an available no_node peer
// const checkLow = function() {
//   return no_node.length != 0 ? true : false;
// }
//
// // check an available full_node peer
// const checkFull = function() {
//   return full_node.length != 0 ? true : false;
// }
//
// //connect peers
// const connectPeers = function(io) {
//   if(!checkFull()) {
//     no_node.forEach(item => {
//       io.to(item.socket.id).emit('no-available');
//     });
//   }
//   else if(checkLow()) {
//     const sender = full_node[0];
//     const recipient = no_node[0];
//     io.to(sender.id).emit('offer', recipient.offer);
//   }
// }
//
// //Connect
// io.on('connection', (socket) => {
//
//   //full node connected
//   socket.on('full-node', () => {
//     full_node.push(socket);
//     connectPeers(io);
//   });
//
//   //no-node connected
//   socket.on('no-node', (offer) => {
//     no_node.push({
//       socket: socket,
//       offer: offer
//     });;
//     connectPeers(io);
//   });
//
//   //answer was recieved from full node
//   socket.on('answer-full', (answer) => {
//     // console.log(no_node);
//     const recipient = no_node.shift();
//     socket.to(recipient.socket.id).emit('answer', answer);
//     recipient.socket.disconnect();
//   });
//
//   //client was disconnected
//   socket.on('disconnect', () => {
//     full_node.forEach((item, i) => {
//       if(item == socket) {
//         full_node.splice(i, 1);
//         return;
//       }
//     });
//
//     no_node.forEach((item, i) => {
//       if(item.socket == socket) {
//         no_node.splice(i, 1);
//         return;
//       }
//     });
//     connectPeers(io);
//   });
// });
