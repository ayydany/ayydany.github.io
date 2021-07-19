$(document).ready(function(){

    // Instantiate new modal
    $(".element").on("click", function(){
        var modal = new Custombox.modal({
            content: {
                effect: "blur",
                target: String($(this).data().name)
            }
            }).open();
    });

    $(window).on('scroll', function(){
      if ($(window).scrollTop() >= 50) {
          $('.head').css({
           'box-shadow' : '3px 4px 5px rgba(0,0,0,0.3)',
           'height' : '0px',
           'transition' : 'ease-in-out .2s'
          })
          $('.centertext').css({
              'transition' : 'ease-in-out .2s',
              'display' : 'none',
          })
      } else {
          $('.head').css({
              'height' : '100%',
              'box-shadow' : '3px 4px 5px rgba(0,0,0,0.0)'
          })
          $('.centertext').css({
              'display' : 'block',
          })   
      }
  });

});