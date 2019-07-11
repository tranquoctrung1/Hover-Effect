'use strict'
// scroll function for window screen
$(window).scroll(() =>
{
	console.log($(this).scrollTop())
	$(this).scrollTop() > 100 ? $('#scroll-top').css({"opacity": 1}) : $('#scroll-top').css({"opacity": 0})
})

$(".demo").on('click',() =>
{
	$("#demo").slideToggle("slow")
})
$("#res").on('click',function()
{
	$(this).attr('href','./about.html')
})

$("#show1").on('click',(e) =>{
	var x = e.target.src.slice(21);
	$("#show").attr('src',`.${x}`)
})
$("#show2").on('click',(e) =>{
	var x = e.target.src.slice(21);
	$("#show").attr('src',`.${x}`)
})
$("#show3").on('click',(e) =>{
	var x = e.target.src.slice(21);
	$("#show").attr('src',`.${x}`).css({
		"width":"30%"
	})	
})
function MySlider()
{
	var i = 0 ;
	var index =["1","2","3"]
	setInterval(() => {
		$('#show').attr('src',`./img/img${index[i++%3]}.png`)
	}, 1000);
}


// this function make a tag don't switch when click it 
// $('a').on('click',(e) =>
// {
// 	e.preventDefault()
// 	$('a').append("  Hello !")
// })




$('.owl-carousel').owlCarousel({
	loop:true,
	margin:10,
	rtl:true,
	nav:true,
	autoplay: true,
	autoplayTimeout: 3000,
	autoplaySpeed: 2000,
	autoplayHoverPause: true,
    responsive:{
        0:{
            items:2
        },
        600:{
            items:4
        },
        1000:{
            items:5
        }
    }
})

// smooth croll function
$('a[href*="#"]')
  // Remove links that don't actually link to anything
  .not('[href="#"]')
  .not('[href="#0"]')
  .click(function(event) {
    // On-page links
    if (
      location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') 
      && 
      location.hostname == this.hostname
    ) {
      // Figure out element to scroll to
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
	  // Does a scroll target exist?
      if (target.length) {
        // Only prevent default if animation is actually gonna happen
        event.preventDefault();
        $('html, body').animate({
          scrollTop: target.offset().top
        }, 1000, function() {
          // Callback after animation
          // Must change focus!
		  var $target = $(target);
          $target.focus();
          if ($target.is(":focus")) { // Checking if the target was focused
            return false;
          } else {
            $target.attr('tabindex','-1'); // Adding tabindex for elements not focusable
            $target.focus(); // Set focus again
          };
        });
      }
    }
  });

  console.log(1111)