/**
 * Created by xenx on 2/24/17.
 */

var s = Snap("#loader");
var bigCircle1 = s.circle(21, 21, 20);
var bigCircle2 = s.circle(81, 21, 20);
var bigCircle3 = s.circle(141, 21, 20);

bigCircle1.attr({
    fill: "none",
    stroke: "black"
});

bigCircle2.attr({
    fill: "none",
    stroke: "black"
});

bigCircle3.attr({
    fill: "none",
    stroke: "black"
});

var state = 0;

function animate_circles() {
    if (state == 0) {
        bigCircle1.animate({r: 5}, 500);
        setTimeout(function () {
            bigCircle1.animate({r: 20}, 500);
        }, 500);


        bigCircle2.animate({r: 5}, 1000);
        setTimeout(function () {
            bigCircle2.animate({r: 20}, 1000);
        }, 1000);


        bigCircle3.animate({r: 5}, 1500);
        setTimeout(function () {
            bigCircle3.animate({r: 20}, 1500);
        }, 1500);

        state = 1;
    }

    else if (state == 1){
        bigCircle3.animate({r: 5}, 500);
        setTimeout(function () {
            bigCircle3.animate({r: 20}, 500);
        }, 500);


        bigCircle2.animate({r: 5}, 1000);
        setTimeout(function () {
            bigCircle2.animate({r: 20}, 1000);
        }, 1000);


        bigCircle1.animate({r: 5}, 1500);
        setTimeout(function () {
            bigCircle1.animate({r: 20}, 1500);
        }, 1500);

        state = 2;
    }


    else if (state == 2){
        bigCircle2.animate({r: 5}, 500);
        setTimeout(function () {
            bigCircle2.animate({r: 20}, 500);
        }, 500);


        bigCircle3.animate({r: 5}, 1000);
        setTimeout(function () {
            bigCircle3.animate({r: 20}, 1000);
        }, 1000);


        bigCircle1.animate({r: 5}, 1500);
        setTimeout(function () {
            bigCircle1.animate({r: 20}, 1500);
        }, 1500);

        state = 0;
    }
}

animate_circles();

setInterval(animate_circles, 3000);