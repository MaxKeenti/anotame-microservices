import React from 'react';
import Table from 'react-bootstrap/Table';
import { Card, Button } from 'react-bootstrap';
import { useFormContext } from '../../../contexts/FormContext';

function NotaTable({ children }) {
    const { state } = useFormContext();
    const maxLineLength = 20; // Maximum characters per line

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    };

    const formatTime = (dateString) => {
        const options = { hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleTimeString('es-ES', options);
    };

    const wrapText = (text, maxLength) => {
        if (typeof text !== 'string') {
            text = String(text); // Convert non-string values to strings
        }
    
        const words = text.split(' ');
        let result = '';
        let line = '';
    
        words.forEach((word) => {
            if ((line.length + word.length) > maxLength) {
                // Check if current line length plus word length exceeds max length
                if (line) {
                    result += line.trim() + '\n'; // Add the current line to the result
                }
                if (word.length > maxLength) {
                    // Split word if it is too long
                    while (word.length > maxLength) {
                        result += word.substring(0, maxLength - 1) + '-\n';
                        word = word.substring(maxLength - 1);
                    }
                    line = word + ' '; // Start a new line with the remainder of the word
                } else {
                    line = word + ' '; // Start a new line with the current word
                }
            } else {
                line += word + ' '; // Add the word to the current line
            }
        });
    
        result += line.trim(); // Add the final line to the result
        return result;
    };        

    const generatePlainText = () => {
        let text = `
==================================
ENTREGA ->
FECHA: ${wrapText(formatDate(state.submittedData.clientData.deliveryDate || ''), maxLineLength)}
HORA: ${wrapText(formatTime(state.submittedData.clientData.deliveryDate || ''), maxLineLength)}
==================================
Datos personales ->

Nombre:\n ${wrapText(state.submittedData.clientData.clientName || '', maxLineLength)}
Apellido paterno:\n ${wrapText(state.submittedData.clientData.clientFirstLastName || '', maxLineLength)}
Apellido materno:\n ${wrapText(state.submittedData.clientData.clientSecondLastName || '', maxLineLength)}
Número de teléfono:\n ${wrapText(state.submittedData.clientData.telefonNumber || '', maxLineLength)}
==================================
Datos de la nota ->

Folio:\n ${wrapText(state.submittedData.clientData.folio || '', maxLineLength)}
Fecha de recibido:\n ${wrapText(formatDate(state.submittedData.clientData.receivedDate || ''), maxLineLength)}

==================================
Datos de la(s) prenda(s) ->\n`;

    state.submittedData.garmentData.garments.forEach((garment) => {
        text += `
Cantidad:\n ${wrapText(garment.garmentQuantity || '', maxLineLength)}
Prenda:\n ${wrapText(garment.garmentType || '', maxLineLength)}
Arreglos:\n ${wrapText(garment.garmentRepair.join(', ') || '', maxLineLength)}
Descripción:\n ${wrapText(garment.garmentDescription || '', maxLineLength)}
Precio:\n ${wrapText(garment.garmentRepairCost || '', maxLineLength)}
Importe:\n ${wrapText(garment.garmentRepairAmount || '', maxLineLength)}\n
--------------------\n`;
    });

    text += `
====================
TOTAL -> ${wrapText(state.submittedData.garmentData.garmentCosts.toString(), maxLineLength)}`;
        return text;
    };


    const handlePrint = () => {
        const printText = generatePlainText();
        const newWindow = window.open('', '', 'width=400,height=600');
        newWindow.document.write(`<pre>${printText}</pre>`);
        newWindow.document.close();
        newWindow.focus();
        newWindow.print();
        newWindow.close();
    };

    return (
        <Card>
            <Card.Body>
                <div id="printableArea">
                    {children}
                    {state.submittedData.clientData && (
                        <Table responsive striped bordered hover className="mb-4">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Apellido Paterno</th>
                                    <th>Apellido Materno</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{state.submittedData.clientData.clientName}</td>
                                    <td>{state.submittedData.clientData.clientFirstLastName}</td>
                                    <td>{state.submittedData.clientData.clientSecondLastName}</td>
                                </tr>
                            </tbody>
                        </Table>
                    )}

                    {state.submittedData.clientData && (
                        <Table responsive striped bordered hover className="mb-4">
                            <thead>
                                <tr>
                                    <th>Número de teléfono</th>
                                    <th>Folio</th>
                                    <th>Fecha de Recepción</th>
                                    <th>Fecha y Hora de Entrega</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{state.submittedData.clientData.telefonNumber}</td>
                                    <td>{state.submittedData.clientData.folio}</td>
                                    <td>{state.submittedData.clientData.receivedDate}</td>
                                    <td>{state.submittedData.clientData.deliveryDate}</td>
                                </tr>
                            </tbody>
                        </Table>
                    )}

                    {state.submittedData.garmentData && (
                        <Table responsive striped bordered hover className="mb-4">
                            <thead>
                                <tr>
                                    <th>Cantidad</th>
                                    <th>Prenda</th>
                                    <th>Arreglos</th>
                                    <th>Descripción</th>
                                    <th>Precio</th>
                                    <th>Importe</th>
                                </tr>
                            </thead>
                            <tbody>
                                {state.submittedData.garmentData.garments.map((garment, garmentIndex) => (
                                    <tr key={garmentIndex}>
                                        <td>{garment.garmentQuantity}</td>
                                        <td>{garment.garmentType}</td>
                                        <td>{garment.garmentRepair.join(', ')}</td>
                                        <td>{garment.garmentDescription}</td>
                                        <td>{garment.garmentRepairCost}</td>
                                        <td>{garment.garmentRepairAmount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}

                    {state.submittedData.paymentData && (
                        <Table responsive striped bordered hover className="mb-4">
                            <thead>
                                <tr>
                                    <th>¿Saldado?</th>
                                    <th>¿A cuenta?</th>
                                    <th>Método de Pago</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{state.submittedData.paymentData.paidInFull ? 'Sí' : 'No'}</td>
                                    <td>{state.submittedData.paymentData.amountLeft}</td>
                                    <td>{state.submittedData.paymentData.paymentMethod}</td>
                                    <td>{state.submittedData.garmentData.garmentCosts}</td>
                                </tr>
                            </tbody>
                        </Table>
                    )}
                </div>
                {state.isPaymentSubmitted && (
                    <Button type="button" onClick={handlePrint}>Imprimir</Button>
                )}
            </Card.Body>
        </Card>
    );
}

export default NotaTable;
