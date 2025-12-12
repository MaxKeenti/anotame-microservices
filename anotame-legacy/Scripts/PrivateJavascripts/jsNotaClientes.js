$("#btnClienteAdd").click(function () {
    var id = $("#idClientes > ul > .es-visible").val();

    $("#idClientes").val(id);
    //$("#Total").val("32");

    $.post("/Home/GetCliente/" + id).done(SuccessCliente);
})

function SuccessCliente(r) {
    console.log(r);
    $("#Clientes_Nombre").val(r[0].Nombre);
    $("#Clientes_Direccion").val(r[0].Direccion);
    $("#Clientes_Telefono").val(r[0].Telefono);
}