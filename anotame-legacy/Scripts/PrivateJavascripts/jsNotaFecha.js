var $buttonOfForm = $("button:submit[data-notafecha='true']");
$buttonOfForm.on('click', function (e) {

    var formTarget = $(this).parents('form:first');

    var formContent = formTarget.serialize();

    formTarget.on('submit', function (e) {
        e.preventDefault();
    });
    var fechaR = $("#inpFechaRecibido").val();
    var dia = fechaR.substring(8, 10);
    var mes = fechaR.substring(5, 7);
    var año = fechaR.substring(0, 4);

    SuccessF(fechaR, dia, mes, año);
});

function SuccessF(fechaR, dia, mes, año) {

    $("#date").empty();
    $("#FechaRecibido").val(fechaR);

    var fecha = "";
    fecha += "<div class=\"col-md-4\" id=\"dateDia\">"
    fecha += dia
    fecha += "</div>"
    fecha += "<div class=\"col-md-4\" id=\"dateMes\">"
    fecha += mes
    fecha += "</div>"
    fecha += "<div class=\"col-md-4\" id=\"dateAño\">"
    fecha += año
    fecha += "</div>"
    $("#date").append(fecha);

    var $boxResultado = $(".resultado, .resultado-bad");
    $boxResultado.text("Datos Insertados Correctamente");

    $boxResultado.fadeIn("slow");

    HideResultado();

    //Añadir Valores

}

function HideResultado() {
    setTimeout(function () {
        $(".resultado, .resultado-bad").fadeOut('slow');
    }, 2500);
    setTimeout(function () {
        $(".resultado, .resultado-bad").text("");
    }, 3000);
}

function Failure(r) {
    var $boxResultado = $(".resultado");
    $boxResultado.text(r.Message);
    $boxResultado.show("fade");
}

function ServerError_General(band, r) {
    if (band === true) {
        window.location = "/Error?url=" + r.UrlError + "&mensaje=" + r.Mensaje + " ";
        return true;
    }
    else {
        return false;
    }
}