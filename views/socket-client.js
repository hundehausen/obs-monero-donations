$(function () {
  const socket = io("http://localhost:3001");
  socket.on("payment_recieved", (amount, name) => {
    console.log("Payment recieved");
    $("#payment-processing").css("display", "none");
    $(".payment-recieved").css("display", "flex");
    $("#confirmation").text(
      `Thank you for your donation of ${amount} XMR, ${name}!`
    );
  });
  socket.on("confirmations", (confirmations) => {
    $("#confirmations").text(`${confirmations}/10 confirmations`);
  });
});
