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

var t1 = 500;
var t2 = 700;
var t3 = 900;
var t_whole = t3*2;

function animate_circles() {
    if (state == 0) {
        bigCircle1.animate({r: 5}, t1);
        setTimeout(function () {
            bigCircle1.animate({r: 20}, t1);
        }, t1);


        bigCircle2.animate({r: 5}, t2);
        setTimeout(function () {
            bigCircle2.animate({r: 20}, t2);
        }, t2);


        bigCircle3.animate({r: 5}, t3);
        setTimeout(function () {
            bigCircle3.animate({r: 20}, t3);
        }, t3);

        state = 1;
    }

    else if (state == 1){
        bigCircle3.animate({r: 5}, t1);
        setTimeout(function () {
            bigCircle3.animate({r: 20}, t1);
        }, t1);


        bigCircle2.animate({r: 5}, t2);
        setTimeout(function () {
            bigCircle2.animate({r: 20}, t2);
        }, t2);


        bigCircle1.animate({r: 5}, t3);
        setTimeout(function () {
            bigCircle1.animate({r: 20}, t3);
        }, t3);

        state = 2;
    }


    else if (state == 2){
        bigCircle2.animate({r: 5}, t1);
        setTimeout(function () {
            bigCircle2.animate({r: 20}, t1);
        }, t1);


        bigCircle3.animate({r: 5}, t3);
        setTimeout(function () {
            bigCircle3.animate({r: 20}, t3);
        }, t2);


        bigCircle1.animate({r: 5}, t3);
        setTimeout(function () {
            bigCircle1.animate({r: 20}, t3);
        }, t3);

        state = 0;
    }
}

animate_circles();

setInterval(animate_circles, t_whole);