/**
 * Created by xenx on 2/24/17.
 */

var s = Snap("#loader");
var bigCircle1 = s.circle(20, 20, 20);
var bigCircle2 = s.circle(80, 20, 20);
var bigCircle3 = s.circle(140, 20, 20);


function animate_circles() {
    bigCircle1.animate({r: 5}, 1000);
    bigCircle2.animate({r: 5}, 2000);
    bigCircle3.animate({r: 5}, 3000);

    setTimeout(function () {
        bigCircle1.animate({r: 20}, 1000);
        bigCircle2.animate({r: 20}, 2000);
        bigCircle3.animate({r: 20}, 3000);
    }, 3000);
}

animate_circles();

setInterval(animate_circles, 6000);

