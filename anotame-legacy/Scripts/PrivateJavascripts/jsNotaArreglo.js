$("#idTipoPrenda").change(function () {
    var id = $(this).val();
    $.post("/NotaPrenda/GetArreglo/" + id).done(SuccessTipoPrenda);
})

function SuccessTipoPrenda(r) {
    console.log(r);
    $("#idArreglo").empty();
    var text = "";
    text = "<option value=\"0\">Seleccionar Opción</option>";
    for (var i = 0; i < r.length; i++) {
        text += "<option value=\"" + r[i].Id + "\">" + r[i].TipoArreglo + "</option>";
    }
    $("#idArreglo").append(text);
}