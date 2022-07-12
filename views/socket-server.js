$(function () {
    const socket = io();
    socket.on('new_donation', (amount, name, message) => {
        debugger;
        $('#donation-canvas').text(name + " donated " + amount + " XMR!");
        $('#donation-message').text(message);
    });
});