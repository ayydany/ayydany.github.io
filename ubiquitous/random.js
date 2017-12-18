var maxNumber = 4;
var minNumber = 1;

randomizeBackground();

function randomNumber(){
    return Math.floor((Math.random() * maxNumber) + minNumber);
}

function randomizeBackground(){
    $("html").css("background", "url(res/backgrounds/bg" + randomNumber() + ".jpg) no-repeat center center fixed");
}

function randomizeImage(){
    $("#image").attr("src", "res/images/img" + randomNumber() + ".png");
}