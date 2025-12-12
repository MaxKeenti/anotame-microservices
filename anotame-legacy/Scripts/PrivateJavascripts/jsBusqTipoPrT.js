$(".btnEditTipPrd").on("click", function () {
    var url = $(this).data("url");
    window.location.href = url;
});

$(".btnDeleteTipPrd").on("click", function () {
    var url = $(this).data("url");
    window.location.href = url;
});

$("#BusqTipodePrT").keydown(function () {
    var dato = $(this).val();
    $.post("/TipoPrenda/BusqTipoPrenda/" + dato).done(Success)
})

function Success(r) {
    console.log(r);
    $("#tblTipoPr tbody").empty();
    var TabTP = "";
    for (var i = 0; i < r.length; i++) {
        TabTP += "<tr>"
        TabTP += "<td>" + r[i].Nombre + "</td>"
        TabTP += "<td>"
        TabTP += "<button type=\"button\" class=\"btn btn-primary nticon btnEditTipPrd\" data-url=\"/TipoPrenda/Edit/" + r[i].id + "\">";
        TabTP += "<i class=\"fas fa-pen notaicon fa-2x\"></i>";
        TabTP += "</button>";
        TabTP += "</td>";
        TabTP += "<td>";
        TabTP += "<button type=\"button\" class=\"btn btn-primary nticon btnDeleteTipPrd\" data-url=\"/TipoPrenda/Delete/" + r[i].id + "\">";
        TabTP += "<i class=\"fas fa-trash notaicon fa-2x\"></i>";
        TabTP += "</button>";
        TabTP += "</td>"
        TabTP += "</tr>"
    }
    console.log(TabTP);
    $("#tblTipoPr tbody").append(TabTP);

    // Enlazar eventos de clic a los botones generados dinámicamente
    $(".btnEditTipPrd").on("click", function () {
        var url = $(this).data("url");
        window.location.href = url;
    });

    $(".btnDeleteTipPrd").on("click", function () {
        var url = $(this).data("url");
        window.location.href = url;
    });
}