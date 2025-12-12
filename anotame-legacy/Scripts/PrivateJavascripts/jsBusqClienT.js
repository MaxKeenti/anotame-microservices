$(".btnEditCln").on("click", function () {
    var url = $(this).data("url");
    window.location.href = url;
});

$(".btnDeleteCln").on("click", function () {
    var url = $(this).data("url");
    window.location.href = url;
});

$("#BusqClienT").keydown(function () {
    var dato = $(this).val();
    $.post("/Clientes/BusqCliente/" + dato).done(Success)
})

function Success(r) {
    console.log(r);
    $("#tblCliente tbody").empty();
    var TabCl = "";
    for (var i = 0; i < r.length; i++) {
        TabCl += "<tr>"
        TabCl += "<td>" + r[i].Nombre + "</td>";
        TabCl += "<td>" + r[i].Direccion + "</td>";
        TabCl += "<td>" + r[i].Telefono + "</td>";
        TabCl += "<td>";
        TabCl += "<button type=\"button\" class=\"btn btn-primary nticon btnEditCln\" data-url=\"/Clientes/Edit/" + r[i].id + "\">";
        TabCl += "<i class=\"fas fa-pen notaicon fa-2x\"></i>";
        TabCl += "</button>";
        TabCl += "</td>";
        TabCl += "<td>";
        TabCl += "<button type=\"button\" class=\"btn btn-primary nticon btnDeleteCln\" data-url=\"/Clientes/Delete/" + r[i].id + "\">";
        TabCl += "<i class=\"fas fa-trash notaicon fa-2x\"></i>";
        TabCl += "</button>";
        TabCl += "</td>";
        TabCl += "</tr>";
    }
    console.log(TabCl);
    $("#tblCliente tbody").append(TabCl);

    // Enlazar eventos de clic a los botones generados dinámicamente
    $(".btnEditCln").on("click", function () {
        var url = $(this).data("url");
        window.location.href = url;
    });

    $(".btnDeleteCln").on("click", function () {
        var url = $(this).data("url");
        window.location.href = url;
    });
}
