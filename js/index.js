/**
 * Created by xenx on 2/24/17.
 */

var s = Snap("#loader");
var f = Snap("#full");
var circles = [];
var special_circles = [];

var radiuses = [3, 10, 30, 1];
var color = ['', '#FF0000', '#AD0CE8', '#434CB4'];
var state = 4;

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
    if (state == 4) {
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
                        onclick: "clicked($(this))",
                        r: 60
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

        $("body").css("background", "#434CB4").css("color", "white");
        $("#hgh").text("PLEASE STAND BY");
        state = 6;
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