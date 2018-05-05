 // header scroll
 $(window).on('scroll',function(){
 
    if ($(window).scrollTop() >= 50) {
        $('.head').css({
         'box-shadow' : '3px 4px 5px rgba(0,0,0,0.3)',
         'height' : '0px',
         'transition' : 'ease-in-out .2s'
        })    
        $('.combin').css({
            'font-size' : '25px',
            'margin' : '5px',
        })
        $('.centertext').css({
            'display' : 'none',
        })   
        $('.arrow').css({
            'display' : 'none',
        });  
    } else {
        $('.head').css({
            'height' : '100%',
            'box-shadow' : '3px 4px 5px rgba(0,0,0,0.0)'
        })
        $('.combin').css({
            'font-size' : '30px',
            'margin' : '25px',
        })
        $('.centertext').css({
            'display' : 'block',
        })   
        $('.arrow').css({
            'display' : 'block',
        });
    }
});