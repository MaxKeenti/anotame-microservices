import React, { useState, useEffect } from 'react';
import { FaArrowRight } from "react-icons/fa";
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import { useFormContext } from '../contexts/FormContext.jsx';

function ClientDataForm({ handleNextTab }) {
    const { state, dispatch } = useFormContext();
    const [validated, setValidated] = useState(false);

    useEffect(() => {
        // Set default dates when component mounts
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
        const day = String(currentDate.getDate()).padStart(2, '0');
        const defaultDate = `${year}-${month}-${day}`; // Default date in YYYY-MM-DD format
        const defaultDateTime = `${defaultDate}T18:00`; // Default time set to 06:00 PM

        dispatch({
            type: 'SET_CLIENT_DATA',
            payload: { receivedDate: defaultDate, deliveryDate: defaultDateTime },
        });
    }, [dispatch]);

    const handleChange = (event) => {
        const { id, value } = event.target;
        dispatch({
            type: 'SET_CLIENT_DATA',
            payload: { [id]: value },
        });
    };

    const handleSubmit = (event) => {
        const form = event.currentTarget;
        if (form.checkValidity() === false) {
            event.preventDefault();
            event.stopPropagation();
        } else {
            event.preventDefault();
            dispatch({
                type: 'ADD_SUBMITTED_CLIENT_DATA',
                payload: state.clientData,
            });
            handleNextTab();
        }
    
        setValidated(true);
    };
    

    return (
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Row className="mb-3">
                <Form.Group as={Col} md="4" controlId="clientName">
                    <Form.Label>Nombre</Form.Label>
                    <Form.Control
                        required
                        type="text"
                        placeholder="Nombre"
                        value={state.clientData.clientName}
                        onChange={handleChange}
                    />
                    <Form.Control.Feedback>
                        ¡Aceptado correctamente!
                    </Form.Control.Feedback>
                    <Form.Control.Feedback type="invalid">
                        Por favor, coloca un Nombre.
                    </Form.Control.Feedback>
                </Form.Group>
                <Form.Group as={Col} md="4" controlId="clientFirstLastName">
                    <Form.Label>Apellido Paterno</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Apellido Paterno"
                        value={state.clientData.clientFirstLastName}
                        onChange={handleChange}
                    />
                    <Form.Control.Feedback>
                        ¡Aceptado correctamente!
                    </Form.Control.Feedback>
                    <Form.Control.Feedback type="invalid">
                        Por favor, coloca un Apellido Paterno.
                    </Form.Control.Feedback>
                </Form.Group>
                <Form.Group as={Col} md="4" controlId="clientSecondLastName">
                    <Form.Label>Apellido Materno</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Apellido Materno"
                        value={state.clientData.clientSecondLastName}
                        onChange={handleChange}
                    />
                    <Form.Control.Feedback>
                        ¡Aceptado correctamente!
                    </Form.Control.Feedback>
                    <Form.Control.Feedback type="invalid">
                        Por favor, coloca un Apellido Materno.
                    </Form.Control.Feedback>
                </Form.Group>
            </Row>
            <Row className="mb-3">
                <Form.Group as={Col} md="3" controlId="telefonNumber">
                    <Form.Label>Número de teléfono</Form.Label>
                    <Form.Control
                        type="number"
                        placeholder="Número del cliente"
                        value={state.clientData.telefonNumber}
                        onChange={handleChange}
                    />
                    <Form.Control.Feedback>
                        ¡Aceptado correctamente!
                    </Form.Control.Feedback>
                    <Form.Control.Feedback type="invalid">
                        Por favor coloque un número válido.
                    </Form.Control.Feedback>
                </Form.Group>
                <Form.Group as={Col} md="3" controlId="folio">
                    <Form.Label>Folio</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Folio"
                        value={state.clientData.folio}
                        onChange={handleChange}
                        required
                    />
                    <Form.Control.Feedback>
                        ¡Aceptado correctamente!
                    </Form.Control.Feedback>
                    <Form.Control.Feedback type="invalid">
                        Por favor coloque un número de folio válido.
                    </Form.Control.Feedback>
                </Form.Group>
                <Form.Group as={Col} md="3" controlId="receivedDate">
                    <Form.Label>Fecha de recepción</Form.Label>
                    <Form.Control
                        type="date"
                        value={state.clientData.receivedDate}
                        readOnly
                        required
                    />
                    <Form.Control.Feedback>
                        ¡Aceptado correctamente!
                    </Form.Control.Feedback>
                    <Form.Control.Feedback type="invalid">
                        Por favor coloque una fecha válida.
                    </Form.Control.Feedback>
                </Form.Group>
                <Form.Group as={Col} md="3" controlId="deliveryDate">
                    <Form.Label>Fecha y hora de entrega</Form.Label>
                    <Form.Control
                        type="datetime-local"
                        value={state.clientData.deliveryDate}
                        required
                        onChange={handleChange}
                    />
                    <Form.Control.Feedback>
                        ¡Aceptado correctamente!
                    </Form.Control.Feedback>
                    <Form.Control.Feedback type="invalid">
                        Por favor coloque una fecha válida.
                    </Form.Control.Feedback>
                </Form.Group>
            </Row>
            <Form.Group as={Col} md="4">
                <Form.Check
                    required
                    label="Los datos insertados son correctos"
                    feedback="Debes verificar que los datos son correctos antes de continuar"
                    feedbackType="invalid"
                />
            </Form.Group>
            <Button type="submit">
                Agregar a la nota y continuar <FaArrowRight className="cust-icon" />
            </Button>
        </Form>
    );
}

export default ClientDataForm;