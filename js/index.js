/**
 * Created by xenx on 2/24/17.
 */

var s = Snap("#loader");
var f = Snap("#full");
var bigCircle1 = s.circle(21, 21, 20);
var bigCircle2 = s.circle(81, 21, 20);
var bigCircle3 = s.circle(141, 21, 20);
var circles = [];
var special_circles = [];

var radiuses = [3, 10, 30, 1];
var color = ['', '#FF0000', '#AD0CE8', '#434CB4'];

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

var t1 = 200;
var t2 = 400;
var t3 = 600;
var t_whole = t3 * 2;


function over(elem) {
    if (elem.attr('done') != "1") {
        elem.attr({
            "r": 10
        }, t1);
    }
}

function out(elem) {
    if (elem.attr('done') != "1") {
        elem.attr({
            "r": 2
        }, t1);
    }
}

var id_title = "#hgh";
var title = $(id_title).position();

var left_kray = title.left - 20;
var right_kray = title.left + $(id_title).width();
var top_kray = title.top;
var bottom_kray = title.top + $(id_title).height();

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

    else if (state == 1) {
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

    else if (state == 2) {
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

        state = 3;
    }

    else if (state == 3) {
        bigCircle2.animate({r: 5}, t1);
        setTimeout(function () {
            bigCircle2.animate({r: 0}, t1);
        }, t1);


        bigCircle3.animate({r: 5}, t3);
        setTimeout(function () {
            bigCircle3.animate({r: 0}, t3);
        }, t2);


        bigCircle1.animate({r: 5}, t3);
        setTimeout(function () {
            bigCircle1.animate({r: 0}, t3);
        }, t3);

        state = 4;
    }

    else if (state == 4) {
        var num_width = $('#full').width() / 50;
        var num_height = $('#full').height() / 50;
        z = 20;
        for (var l = 0; l < num_height; l++) {
            k = 20;

            for (var i = 0; i < num_width; i++) {
                if (k < left_kray || k > right_kray || z < top_kray || z > bottom_kray) {
                    var tmp = f.circle(k, z, 0);
                    tmp.attr({
                        fill: "white",
                        stroke: "none",
                        onmouseover: "over($(this))",
                        onmouseout: "out($(this))",
                        onclick: "clicked($(this))"
                    });

                    if (k < left_kray - 100 || k > right_kray + 100 || z < top_kray - 200 || z > bottom_kray + 200) {
                        tmp.attr({
                            special: "1"
                        });
                    } else {
                        special_circles.push(tmp)
                    }
                    circles.push(tmp);
                }
                k += 50;
            }
            z += 50;
        }

        for (l = 0; l < circles.length; l++) {
            circles[l].animate({
                r: 60
            }, 10 * (t3 - 20));
        }

        state = 5;
    }

    else if (state == 5) {
        setTimeout(function () {
            $("body").css("background", "#434CB4").css("color", "white");
            $("#hgh").text("PLEASE STAND BY");
            state = 6;
        }, 8 * (t3 - 20));
    }

    else if (state == 6) {
        for (l = 0; l < special_circles.length; l++) {
            special_circles[l].animate({
                r: 0
            }, t3);
        }

        $("#lamp").css("display", "block");
        $("#loader").css("width", "auto").animate({
            height: 460
        }, t2);

        state = 7;
    }
}

animate_circles();

setInterval(animate_circles, t_whole);