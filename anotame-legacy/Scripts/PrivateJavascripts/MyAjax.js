var $buttonOfForm = $("button:submit[data-myajax='true']");
$buttonOfForm.on('click', function (e) {

    var formTarget = $(this).parents('form:first');

    var formContent = formTarget.serialize();

    formTarget.on('submit', function (e) {
        e.preventDefault();
    });
    console.log(formTarget.attr('action'));
    console.log($buttonOfForm.data("myajax"))

    $buttonOfForm.data("myajax") == true ? RunAjax(formTarget.attr('action'), formContent) : false;
});

function RunAjax(actionRoute, formData) {
    console.log(actionRoute);
    $.ajax({
        type: "POST",
        url: actionRoute,
        data: formData,
        dataType: "json",
    }).done(Success)
        .fail(Failure);
}

function Success(r) {

    if (ServerError_General(r.IsServerError, r)) {
        return;
    }

    var $boxResultado = $(".resultado, .resultado-bad");
    $boxResultado.text(r.Message);

    $boxResultado.fadeIn("slow");

    r.MethodSuccess == false ? $boxResultado.removeClass('resultado').addClass('resultado-bad') : $boxResultado.removeClass('resultado-bad').addClass('resultado');

    HideResultado();
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