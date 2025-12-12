$("#idArreglo").change(function () {
    var id = $("#idTipoPrenda").val();
    var dato = $(this).val();
    $.post("/NotaPrenda/GetPrecio/" + id + "/" + dato).done(SuccessPrecio);
})

function SuccessPrecio(r) {
    console.log(r);
    console.log(r.length);
    var lista = "";
    if (r.length == 1) {
        $(".precio").empty();
        lista = "";
        lista += "<input class=\"form-control text-box single-line\" data-val=\"true\" data-val-number=\"El campo Cantidad debe ser un número.\" data-val-required=\"El campo Cantidad es obligatorio.\" id=\"Prenda_Cantidad\" name=\"Prenda.Cantidad\" readonly=\"True\" type=\"text\" value=\"\">"
        $(".precio").append(lista);
        $("#Prenda_Cantidad").val(r[0].Cantidad);
        $(".prenda").val(r[0].id);
    }
    else {
        $(".precio").empty();
        lista = "";
        lista = "<select class=\"form-control\" id=\"idPrecio\" name=\"idPrecio\">"
        lista += "<option value=\"0\">Seleccionar Opción</option>";
        for (var i = 0; i < r.length; i++) {
            lista += "<option value=\"" + r[i].id + "\">" + r[i].Cantidad + "</option>";
        }
        lista += "</select>"
        $(".precio").append(lista);
    }
}

$(".precio").change(function () {
    var id = $("#idPrecio").val();
    $("#idPrenda").val(id);
})


//$(document).ready(function () {
//    alert("HOLA")
//})
