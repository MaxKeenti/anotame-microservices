var $btn = $("button:submit[data-save='true']");
$btn.on('click', function (e) {

    var formTarget = $(this).parents('form:first');
    console.log(formTarget);
    var formContent = formTarget.serialize();

    formTarget.on('submit', function (e) {
        e.preventDefault();
    });
    console.log(formTarget.attr('action'));
    console.log($btn.data("save"))
    //var fd = new FormData();
    //fd.append(idClientes,$("#idClientes").val())


    $btn.data("save") == true ? RunAjax(formTarget.attr('action'), formContent) : false;
});

function ExecAjax(actionRoute, formData) {
    console.log(actionRoute);
    $.ajax({
        type: "POST",
        url: actionRoute,
        data: formData,
        dataType: "json",
    }).done(Succ)
        .fail(Errorr);
}

function Succ(r) {

    if (ServerErrorr(r.IsServerError, r)) {
        return;
    }

    var $boxResultado = $(".resultado, .resultado-bad");
    $boxResultado.text("Nota guardada correctamente");

    $boxResultado.fadeIn("slow");

    r.MethodSuccess == false ? $boxResultado.removeClass('resultado').addClass('resultado-bad') : $boxResultado.removeClass('resultado-bad').addClass('resultado');

    OcultarResultado();

    //Creación de las filas de la nota
    //$.post("/Nota/crea/").done(Save);
}

function Save(r) {
    
}


function OcultarResultado() {
    setTimeout(function () {
        $(".resultado, .resultado-bad").fadeOut('slow');
    }, 2500);
    setTimeout(function () {
        $(".resultado, .resultado-bad").text("");
    }, 3000);
}

function Errorr(r) {
    var $boxResultado = $(".resultado");
    $boxResultado.text(r.Message);
    $boxResultado.show("fade");
}

function ServerErrorr(band, r) {
    if (band === true) {
        window.location = "/Error?url=" + r.UrlError + "&mensaje=" + r.Mensaje + " ";
        return true;
    }
    else {
        return false;
    }
}

$(document).ready(function () {
    $.post("/Nota/FechayFolio/").done(SuccessFF);
})

function SuccessFF(r) {
    $("#Folio").val(r.Folio);
    var fech = Date.now.toString();
    $("#FechaRecibido").val(fech);
}