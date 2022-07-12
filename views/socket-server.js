$(function () {
    const socket = io();
    socket.on('new_donation', (amount, name, message) => {
        $('#donation-canvas').text(name + " donated " + amount + " XMR!");
        $('#donation-message').text(message);
    });
});