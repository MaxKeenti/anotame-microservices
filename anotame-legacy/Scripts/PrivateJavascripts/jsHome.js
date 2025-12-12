$("#btnMamutish").on('click', function Mamutish() {
    $("#Nombre").val("Gabriela")
    $("#Nombre").prop("readonly", true)
})

$("#btnPapureos").on('click', function Papureos() {
    $("#Nombre").val("Enrique")
    $("#Nombre").prop("readonly", true)
})

$("#btnMarisol").on('click', function Marisol() {
    $("#Nombre").val("Marisol")
    $("#Nombre").prop("readonly", true)
})

$("#btnLuz").on('click', function Luz() {
    $("#Nombre").val("Luz")
    $("#Nombre").prop("readonly", true)
})

$("#btnNoOne").on('click', function Anonymous() {
    $("#Nombre").val("")
    $("#Nombre").prop("readonly", false)
})

//$("#btnAceptar").on("click", function SaveId() {
//    var id = $("#Nombre").val()
//    $.post("/Empleados/BusqEmpleado/" + id).done(SuccessEmpleado)
//})

//function SuccessEmpleado(r) {
//    console.log(r)
//    $("#inpIdEmpleado").val(r.id)
//}