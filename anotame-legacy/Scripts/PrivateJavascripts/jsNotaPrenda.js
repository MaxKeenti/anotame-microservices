//var $btnOfForm = $("button:submit[data-notaprenda='true']");
var $btnOfForm = $("#btnSaveNotaPrenda")

$btnOfForm.on('click', function (e) {

    var formTarget = $(this).parents('form:first');

    var formContent = formTarget.serialize();

    formTarget.on('submit', function (e) {
        e.preventDefault();
    });
    console.log(formTarget.attr('action'));
    console.log($btnOfForm.data("notaprenda"))

    $btnOfForm.data("notaprenda") == true ? IrAjax(formTarget.attr('action'), formContent) : false;
});

function IrAjax(actionRoute, formData) {
    console.log(actionRoute);
    $.ajax({
        type: "POST",
        url: actionRoute,
        data: formData,
        dataType: "json",
    }).done(Exito)
        .fail(Fallo);
}

function Exito(r) {

    if (ServerError_General_(r.IsServerError, r)) {
        return;
    }

    var $boxResultado = $(".resultado, .resultado-bad");
    $boxResultado.text(r.Message);

    $boxResultado.fadeIn("slow");

    r.MethodSuccess == false ? $boxResultado.removeClass('resultado').addClass('resultado-bad') : $boxResultado.removeClass('resultado-bad').addClass('resultado');

    HideResultado();

    //Creación de las filas de la nota
    $.post("/NotaPrenda/GetAll/").done(SuccesAll);
}

function SuccesAll(r) {
    console.log(r);
    $(".TableData").empty();
    $(".TableBody").empty();
    $(".TableBody2").empty();
    $(".TableFoot").empty();
    var Tabla = "";
    for (var i = 0; i < r.Lista.length; i++) {
        Tabla += "<div id=\"divTBody\" class=\"row\">"
        Tabla += "<div class=\"col-md-1 TBody\"> <div id=\"divTbCantidad\">" + r.Lista[i].CantidadPrendas + "</div> </div>"
        Tabla += "<div class=\"col-md-9 TBody\"> <div id =\"divTbPrenda\">" + r.Lista[i].Prenda + "</div> </div>"
        Tabla += "<div class=\"col-md-1 TBody\"> <div id =\"divTbPrecio\">" + r.Lista[i].Precio + "</div> </div>"
        Tabla += "<div class=\"col-md-1 TBody\"> <div id =\"divTbImporte\">" + r.Lista[i].Importe + "</div> </div>"
        Tabla += "</div>"

        Tabla += "<div id=\"divTBody2\" class=\"row\">"
        Tabla += "<div class=\"col-md-1 TBody\"> <div id=\"divTb1\">" + "</div> </div>"
        Tabla += "<div class=\"col-md-9 TBody\"> <div id=\"divTb2Descripcion\">" + r.Lista[i].Descripcion + "</div> </div>"
        Tabla += "<div class=\"col-md-1\"> <button type=\"button\" onclick=Edit(" + r.Lista[i].idNotaPrenda + ") class=\"btn btn-primary nticon divTb3Edit\" data-toggle=\"modal\" data-target=\"#EditPrenda\" value=\"" + r.Lista[i].idNotaPrenda + "\">" + "<i id=\"icoEdit\" class=\"fas fa-pen notaicon fa-2x\">" + "</i>" + "</button> </div>"
        Tabla += "<div class=\"col-md-1\"> <button type=\"button\" id=\"divTb4Delete\" class=\"btn btn-primary nticon\">" + "<i id=\"icoDelete\" class=\"fas fa-trash notaicon fa-2x\">" + "</i>" + "</button> </div>"
        Tabla += "</div>"
    }
    Tabla += "<div id=\"divTFoot\" class=\"row\">"
    Tabla += "<div class=\"col-md-10\"> <div id=\"divTf1\">" + "</div> </div>"
    Tabla += "<div class=\"col-md-1\"> <div id=\"divTfTotal\">" + "Total:" + "</div> </div>"
    Tabla += "<div class=\"col-md-1\"> <div id=\"divTfImpTotal\">" + r.Total + "</div> </div>"
    Tabla += "</div>"
    console.log(Tabla);
    $(".TableData").append(Tabla);
    var Total = parseFloat(r.Total);

    $("#Total").val(r.Total);
}


function HideResultado() {
    setTimeout(function () {
        $(".resultado, .resultado-bad").fadeOut('slow');
    }, 2500);
    setTimeout(function () {
        $(".resultado, .resultado-bad").text("");
    }, 3000);
}

function Fallo(r) {
    var $boxResultado = $(".resultado");
    $boxResultado.text(r.Message);
    $boxResultado.show("fade");
}

function ServerError_General_(band, r) {
    if (band === true) {
        window.location = "/Error?url=" + r.UrlError + "&mensaje=" + r.Mensaje + " ";
        return true;
    }
    else {
        return false;
    }
}