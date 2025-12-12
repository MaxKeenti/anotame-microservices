$(".btnEditArr").on("click", function () {
    var url = $(this).data("url");
    window.location.href = url;
});

$(".btnDeleteArr").on("click", function () {
    var url = $(this).data("url");
    window.location.href = url;
});

$("#BusqArregloT").keydown(function () {
    var dato = $(this).val();
    $.post("/Arreglo/BusqArreglo/" + dato).done(Success)
})

function Success(r) {
    console.log(r);
    $("#tblArreglo tbody").empty();
    var TabAr = "";
    for (var i = 0; i < r.length; i++) {
        TabAr += "<tr>"
        TabAr += "<td>" + r[i].Nombre + "</td>"
        TabAr += "<td>"
        TabAr += "<button type=\"button\" class=\"btn btn-primary nticon btnEditArr\" data-url=\"/Arreglo/Edit/" + r[i].id + "\">";
        TabAr += "<i class=\"fas fa-pen notaicon fa-2x\"></i>";
        TabAr += "</button>";
        TabAr += "</td>";
        TabAr += "<td>";
        TabAr += "<button type=\"button\" class=\"btn btn-primary nticon btnDeleteArr\" data-url=\"/Arreglo/Delete/" + r[i].id + "\">";
        TabAr += "<i class=\"fas fa-trash notaicon fa-2x\"></i>";
        TabAr += "</button>";
        TabAr += "</td>"
        TabAr += "</tr>"
    }
    console.log(TabAr);
    $("#tblArreglo tbody").append(TabAr);

    // Enlazar eventos de clic a los botones generados dinámicamente
    $(".btnEditArr").on("click", function () {
        var url = $(this).data("url");
        window.location.href = url;
    });

    $(".btnDeleteArr").on("click", function () {
        var url = $(this).data("url");
        window.location.href = url;
    });
}