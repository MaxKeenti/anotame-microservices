$("#BusqPrendT").keydown(function () {
    var dato = $(this).val();

    var id = $("#drpOpciones").val();
    switch (id) {
        case "1":
            $.post("/Prenda/BusqPrenda/" + dato).done(Success)
            break;
        case "2":
            $.post("/Prenda/BusqArreglo/" + dato).done(Success)
            break;
    }

})

$("#drpOpciones").change(function () {
    var id = $("#drpOpciones").val();
    if (id > 0) {
        $("#BusqPrendT").removeAttr("readonly");
    }
    else {
        $("#BusqPrendT").attr("readonly", "readonly");
        location.reload();
    }
})

$(".btnEditPrd").on("click", function () {
    var url = $(this).data("url");
    window.location.href = url;
});

$(".btnDeletePrd").on("click", function () {
    var url = $(this).data("url");
    window.location.href = url;
});

function Success(r) {
    console.log(r);
    $("#tblPrenda tbody").empty();
    var TabPr = "";
    for (var i = 0; i < r.length; i++) {
        TabPr += "<tr>"
        TabPr += "<td>" + r[i].Cantidad + "</td>"
        TabPr += "<td>" + r[i].Arreglo + "</td>"
        TabPr += "<td>" + r[i].Prenda + "</td>"
        TabPr += "<td>"
        TabPr += "<button type=\"button\" class=\"btn btn-primary nticon btnEditPrd\" data-url=\"/Prenda/Edit/" + r[i].idPrenda + "\">";
        TabPr += "<i class=\"fas fa-pen notaicon fa-2x\"></i>";
        TabPr += "</button>";
        TabPr += "</td>";
        TabPr += "<td>";
        TabPr += "<button type=\"button\" class=\"btn btn-primary nticon btnDeletePrd\" data-url=\"/Prenda/Delete/" + r[i].idPrenda + "\">";
        TabPr += "<i class=\"fas fa-trash notaicon fa-2x\"></i>";
        TabPr += "</button>";
        TabPr += "</td>"
        TabPr += "</tr>"
    }
    console.log(TabPr);
    $("#tblPrenda tbody").append(TabPr);

    // Enlazar eventos de clic a los botones generados dinámicamente
    $(".btnEditPrd").on("click", function () {
        var url = $(this).data("url");
        window.location.href = url;
    });

    $(".btnDeletePrd").on("click", function () {
        var url = $(this).data("url");
        window.location.href = url;
    });
}
