$(function () {
    var socket = io();
    socket.on('payment_recieved', (amount, name) => {
        console.log('Payment recieved');
        $('#payment-processing').css("display", "none");
        $('#payment-recieved').css("display", "flex");
        $('#bestaetigung').text("Thank you for your donation of " + amount + " XMR, " + name + "!");
    })
});