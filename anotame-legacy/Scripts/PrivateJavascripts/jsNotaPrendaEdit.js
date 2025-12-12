//import { Tab } from "../bootstrap.bundle";

//Comienza el Modal -----------------------------------------------------------------------------------------------------------------------------
var idTabla = 0;
function Edit(id) {
    console.log(id);
    $(".EditBody2").empty();
    $.post("/Nota/GetNotaPrenda/" + id).done(SuccessNtPr);
}

function SuccessNtPr(r) {
    console.log(r);
    idTabla =r.Edit[0].idNotaPrenda;
    var Mod = "";
    //Mod += "<h2>Editar Prenda</h2>"
    //Mod += "<div class=\"EditBody\">"
    Mod +=      "<hr/>"

    Mod +=      "<div class=\"form-group\">"
    Mod +=          "<label class=\"control-label col-md-2\" for=\"Prendas\">Prendas</label>"
    Mod +=          "<div class=\"col-md-10\">"
    Mod +=              "<select class=\"form-control\" id=\"idTipoPrendaEdit\" name=\"idTipoPrendaEdit\" onchange=\"Arreglo();\">"
    Mod +=                 DropdownList(r.Pr,r.Edit[0].idTipoPrenda);
    Mod +=              "</select>"
    Mod +=              "<span class=\"field-validation-valid text-danger\" data-valmsg-for=\"Prenda.idTipoPrenda\" data-valmsg-replace=\"true\"></span>"
    Mod +=          "</div>"
    Mod +=      "</div>"

    Mod +=      "<div class=\"form-group\">"
    Mod +=          "<label class=\"control-label col-md-2\" for=\"Arreglos\">Arreglos</label>"
    Mod +=          "<div class=\"col-md-10\">"
    Mod +=              "<select class=\"form-control\" id=\"idArregloEdit\" name=\"idArregloEdit\" onchange=\"Precio();\">"
    Mod +=                 DropdownList(r.Ar,r.Edit[0].idArreglo);
    Mod +=              "</select>"
    Mod +=              "<span class=\"field-validation-valid text-danger\" data-valmsg-for=\"Prenda.idArreglo\" data-valmsg-replace=\"true\"></span>"
    Mod +=          "</div>"
    Mod +=      "</div>"

    Mod +=      "<div class=\"form-group\">"
    Mod +=          "<label class=\"control-label col-md-2\" for=\"Descripcion\">Descripción</label>"
    Mod +=          "<div class=\"col-md-10\">"
    Mod +=              "<input class=\"form-control text-box single-line\" id=\"DescripcionEdit\" name=\"DescripcionEdit\" type=\"text\" value=\"" + r.Edit[0].Descripcion + "\" \>"
    Mod +=              "<span class=\"field-validation-valid text-danger\" data-valmsg-for=\"DescripcionEdit\" data-valmsg-replace=\"true\"></span>"
    Mod +=          "</div>"
    Mod +=      "</div>"

    Mod +=      "<div class=\"form-group\">"
    Mod +=          "<label class=\"control-label col-md-2\" for=\"Prenda_Cantidad\">Precio</label>"
    Mod +=          "<div class=\"col-md-10\" id=\"PrendaPrecio\"><input class=\"form-control text-box single-line\" data-val=\"true\" data-val-number=\"El campo Cantidad debe ser un número.\" data-val-required=\"El campo Cantidad es obligatorio.\" id=\"PrendaCantidadEdit\" name=\"PrendaCantidadEdit\" readonly=\"True\" type=\"text\" value=\"" + r.Edit[0].Precio + "\" \>"
    Mod +=          "</div>"
    Mod +=      "</div>"

    Mod +=      "<div class=\"form-group\">"
    Mod +=          "<label class=\"control-label col-md-2\" for=\"CantidadPrendas\">Cantidad</label>"
    Mod +=          "<div class=\"col-md-10\">"
    Mod +=              "<input class=\"form-control text-box single-line\" data-val=\"true\" data-val-number=\"El campo CantidadPrendas debe ser un número.\" data-val-required=\"El campo CantidadPrendas es obligatorio.\" id=\"CantidadPrendasEdit\" name=\"CantidadPrendasEdit\" type=\"number\" value=\"" + r.Edit[0].CantidadPrendas + "\" \>"
    Mod +=              "<span class=\"field-validation-valid text-danger\" data-valmsg-for=\"CantidadPrendas\" data-valmsg-replace=\"true\"></span>"
    Mod +=          "</div>"
    Mod +=      "</div>"

    Mod +=      "<div class=\"form-group ocultar\">"
    Mod +=          "<label class=\"control-label col-md-2\" for=\"idPrenda\">idPrenda</label>"
    Mod +=          "<div class=\"col-md-10\">"
    Mod +=              "<input id=\"idPrendaEdit\" name=\"idPrendaEdit\" type=\"text\" value=" + r.Edit[0].idPrenda + "\>"
    Mod +=          "</div>"
    Mod +=      "</div>"

    Mod +=      "<div class=\"form-group ocultar\">"
    Mod +=          "<label class=\"control-label col-md-2\" for=\"idNotaPrenda\">idNotaPrenda</label>"
    Mod +=          "<div class=\"col-md-10\">"
    Mod +=              "<input id=\"idNotaPrendaEdit\" name=\"idNotaPrendaEdit\" type=\"text\" value=" + r.Edit[0].idNotaPrenda + "\>"
    Mod +=          "</div>"
    Mod +=      "</div>"

    //Mod +=       "<div class=\"form-group\">"
    //Mod +=          "<div class=\"col-md-offset-2 col-md-10\">"
    //Mod +=              "<button type=\"submit\" class=\"btn btn-primary\" data-notaprendaedit=\"true\">Guardar</button>"
    //Mod +=          "</div>"
    //Mod +=      "</div>"

    //Mod += "</div>"
    console.log(Mod)
    $(".EditBody2").append(Mod);
}

function DropdownList(Lista,Selected) {
    var OpPr = "";
    OpPr += "<option value=\"0\">Seleccionar Opción</option>"

    for (var i = 0; i < Lista.length; i++) {
        if ((i+1) == Selected) {
            OpPr += "<option value=\"" + Lista[i].Value + "\" selected=\"selected\">" + Lista[i].Text + "</option>";
        }
        else {
            OpPr += "<option value=\"" + Lista[i].Value + "\">" + Lista[i].Text + "</option>";
        }
    }

    return OpPr;
}

function Arreglo() {
    var id = $("#idTipoPrendaEdit").val();
    $.post("/NotaPrenda/GetArreglo/" + id).done(SuccessTipoPrendaEdit);
}

function SuccessTipoPrendaEdit(r) {
    console.log(r);
    $("#idArregloEdit").empty();
    var text = "";
    text = "<option value=\"0\">Seleccionar Opción</option>";
    for (var i = 0; i < r.length; i++) {
        text += "<option value=\"" + r[i].Id + "\">" + r[i].TipoArreglo + "</option>";
    }
    $("#idArregloEdit").append(text);
}

function Precio() {
    var id = $("#idTipoPrendaEdit").val();
    var dato = $("#idArregloEdit").val();
    $.post("/NotaPrenda/GetPrecio/" + id + "/" + dato).done(SuccessPrecioEdit);
}

function SuccessPrecioEdit(r) {
    console.log(r);
    console.log(r.length);
    var lista = "";
    if (r.length == 1) {
        $("#PrendaPrecio").empty();
        lista = "";
        lista += "<input class=\"form-control text-box single-line\" data-val=\"true\" data-val-number=\"El campo Cantidad debe ser un número.\" data-val-required=\"El campo Cantidad es obligatorio.\" id=\"PrendaCantidadEdit\" name=\"PrendaCantidadEdit\" readonly=\"True\" type=\"text\" value=\"\">"
        $("#PrendaPrecio").append(lista);
        $("#PrendaCantidadEdit").val(r[0].Cantidad);
        $("#idPrendaEdit").val(r[0].id);
    }
    else {
        $("#PrendaPrecio").empty();
        lista = "";
        lista = "<select class=\"form-control\" id=\"idPrecioEdit\" name=\"idPrecioEdit\" onchange=\"DrplPrecio();\">"
        lista += "<option value=\"0\">Seleccionar Opción</option>";
        for (var i = 0; i < r.length; i++) {
            lista += "<option value=\"" + r[i].id + "\">" + r[i].Cantidad + "</option>";
        }
        lista += "</select>"
        $("#PrendaPrecio").append(lista);
    }
}

function DrplPrecio() {
    var id = $("#idPrecioEdit").val();
    $("#idPrendaEdit").val(id);
}

//$(document).ready(function () {
//    alert("HOLA")
//})

//Finaliza el Modal -----------------------------------------------------------------------------------------------------------------------------

var $btnDeForm = $("button:submit[data-notaprendaedit='true']");

$btnDeForm.on('click', function (e) {

    var formTarget = $(this).parents('form:first');

    var formContent = formTarget.serialize();

    formTarget.on('submit', function (e) {
        e.preventDefault();
    });
    console.log(formTarget.attr('action'));
    var action = formTarget.attr('action') + "/" + idTabla;

    console.log($btnDeForm.data("notaprendaedit"))
    console.log(formContent);

    $btnDeForm.data("notaprendaedit") == true ? IrAlAjax(action, formContent) : false;
});

function IrAlAjax(actionRoute, formData) {
    console.log(actionRoute);
    $.ajax({
        type: "POST",
        url: actionRoute,
        data: formData,
        dataType: "json",
        processData: false 
    }).done(Listo)
        .fail(Err);
}

function Listo(r) {

    if (ServerError_General_(r.IsServerError, r)) {
        return;
    }

    var $boxResultado = $(".resultado, .resultado-bad");
    $boxResultado.text(r.Message);

    $boxResultado.fadeIn("slow");

    r.MethodSuccess == false ? $boxResultado.removeClass('resultado').addClass('resultado-bad') : $boxResultado.removeClass('resultado-bad').addClass('resultado');

    OcultarResultado();

    //Creación de las filas de la nota
    $.post("/NotaPrenda/GetAll/").done(ExitoAll);
}

function ExitoAll(r) {
    console.log(r);
    $(".TableData").empty();
    $(".TableBody").empty();
    $(".TableBody2").empty();
    $(".TableFoot").empty();
    var Tabla = "";
    for (var i = 0; i < r.Lista.length; i++) {
        Tabla += "<div id=\"divTBody\" class=\"row TableBody\">"
        Tabla +=    "<div class=\"col-md-1 TBody\">"
        Tabla +=        "<div id=\"divTbCantidad\">" + r.Lista[i].CantidadPrendas + "</div> </div>"
        Tabla +=    "<div class=\"col-md-9 TBody\">"
        Tabla +=        "<div id =\"divTbPrenda\">" + r.Lista[i].Prenda + "</div> </div>"
        Tabla +=    "<div class=\"col-md-1 TBody\">"
        Tabla +=        "<div id =\"divTbPrecio\">" + r.Lista[i].Precio + "</div> </div>"
        Tabla +=    "<div class=\"col-md-1 TBody\">"
        Tabla +=        "<div id =\"divTbImporte\">" + r.Lista[i].Importe + "</div> </div>"
        Tabla += "</div>"

        Tabla += "<div id=\"divTBody2\" class=\"row TableBody2\">"
        Tabla +=    "<div class=\"col-md-1 TBody\">"
        Tabla +=        "<div id=\"divTb1\">" + "</div> </div>"
        Tabla +=    "<div class=\"col-md-9 TBody\">"
        Tabla +=        "<div id=\"divTb2Descripcion\">" + r.Lista[i].Descripcion + "</div> </div>"
        Tabla +=    "<div class=\"col-md-1\">"
        Tabla +=        "<button type=\"button\" onclick=Edit(" + r.Lista[i].idNotaPrenda + ") class=\"btn btn-primary nticon divTb3Edit\" data-toggle=\"modal\" data-target=\"#EditPrenda\" value=\"" + r.Lista[i].idNotaPrenda + "\">" + "<i id=\"icoEdit\" class=\"fas fa-pen notaicon fa-2x\">" + "</i>" + "</button> </div>"
        Tabla +=    "<div class=\"col-md-1\">"
        Tabla +=        "<button type=\"button\" id=\"divTb4Delete\" class=\"btn btn-primary nticon\">" + "<i id=\"icoDelete\" class=\"fas fa-trash notaicon fa-2x\">" + "</i>" + "</button> </div>"
        Tabla += "</div>"
    }
    Tabla += "<div id=\"divTFoot\" class=\"row TableFoot\">"
    Tabla +=    "<div class=\"col-md-10\">"
    Tabla +=        "<div id=\"divTf1\">" + "</div> </div>"
    Tabla +=    "<div class=\"col-md-1\">"
    Tabla +=        "<div id=\"divTfTotal\">" + "Total:" + "</div> </div>"
    Tabla +=    "<div class=\"col-md-1\">"
    Tabla +=        "<div id=\"divTfImpTotal\">" + r.Total + "</div> </div>"
    Tabla += "</div>"
    console.log(Tabla);
    $(".TableData").append(Tabla);
    var Total = parseFloat(r.Total);

    $("#Total").val(r.Total);
}


function OcultarResultado() {
    setTimeout(function () {
        $(".resultado, .resultado-bad").fadeOut('slow');
    }, 2500);
    setTimeout(function () {
        $(".resultado, .resultado-bad").text("");
    }, 3000);
}

function Err(r) {
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