import React, { useState, useEffect } from 'react';
import { FaArrowRight } from "react-icons/fa";
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Table from 'react-bootstrap/Table';
import { useFormContext } from '../contexts/FormContext';

function GarmentDataForm({ handleNextTab }) {
    const { state, dispatch } = useFormContext();
    const [validated, setValidated] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editIndex, setEditIndex] = useState(null);

    useEffect(() => {
        // Calculate the garmentRepairAmount whenever quantity or cost changes
        const garmentRepairAmount = state.garmentData.garmentQuantity * state.garmentData.garmentRepairCost;
        dispatch({
            type: 'SET_GARMENT_DATA',
            payload: { garmentRepairAmount },
        });
    }, [
        state.garmentData.garmentQuantity,
        state.garmentData.garmentRepairCost,
        dispatch,
    ]);

    const handleChange = (event) => {
        const { id, value } = event.target;
        dispatch({
            type: 'SET_GARMENT_DATA',
            payload: { [id]: value },
        });
    };

    const handleArregloChange = (index, event) => {
        const newArreglos = [...state.garmentData.garmentRepair];
        newArreglos[index] = event.target.value;
        dispatch({
            type: 'SET_GARMENT_DATA',
            payload: { garmentRepair: newArreglos },
        });
    };

    const handleAddArreglo = () => {
        const newArreglos = [...state.garmentData.garmentRepair, ''];
        dispatch({
            type: 'SET_GARMENT_DATA',
            payload: { garmentRepair: newArreglos },
        });
    };

    const handleRemoveArreglo = (index) => {
        const newArreglos = state.garmentData.garmentRepair.filter((_, i) => i !== index);
        dispatch({
            type: 'SET_GARMENT_DATA',
            payload: { garmentRepair: newArreglos },
        });
    };

    const handleAddGarment = (event) => {
        event.preventDefault();
        if (isEditing) {
            dispatch({
                type: 'UPDATE_GARMENT',
                payload: {
                    index: editIndex,
                    garment: {
                        garmentQuantity: state.garmentData.garmentQuantity,
                        garmentType: state.garmentData.garmentType,
                        garmentRepair: state.garmentData.garmentRepair,
                        garmentDescription: state.garmentData.garmentDescription,
                        garmentRepairCost: state.garmentData.garmentRepairCost,
                        garmentRepairAmount: state.garmentData.garmentRepairAmount,
                    },
                },
            });
            setIsEditing(false);
            setEditIndex(null);
        } else {
            dispatch({
                type: 'ADD_GARMENT',
                payload: {
                    garmentQuantity: state.garmentData.garmentQuantity,
                    garmentType: state.garmentData.garmentType,
                    garmentRepair: state.garmentData.garmentRepair,
                    garmentDescription: state.garmentData.garmentDescription,
                    garmentRepairCost: state.garmentData.garmentRepairCost,
                    garmentRepairAmount: state.garmentData.garmentRepairAmount,
                },
            });
        }
        dispatch({
            type: 'SET_GARMENT_DATA',
            payload: {
                garmentQuantity: '',
                garmentType: '',
                garmentRepair: [],
                garmentDescription: '',
                garmentRepairCost: '',
                garmentRepairAmount: 0,
            },
        });
    };

    const handleEditGarment = (index) => {
        const garment = state.garmentData.garments[index];
        dispatch({
            type: 'SET_GARMENT_DATA',
            payload: garment,
        });
        setIsEditing(true);
        setEditIndex(index);
    };

    const handleDeleteGarment = (index) => {
        dispatch({
            type: 'DELETE_GARMENT',
            payload: index,
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
                type: 'ADD_SUBMITTED_GARMENT_DATA',
                payload: {
                    garments: [...state.garmentData.garments],
                    garmentCosts: state.garmentData.garmentCosts,
                },
            });
            handleNextTab();
        }
    
        setValidated(true);
    };
    

    return (
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Row className="mb-3">
                <Form.Group as={Col} md="2" controlId="garmentQuantity">
                    <Form.Label>Cantidad</Form.Label>
                    <Form.Control
                        type="number"
                        placeholder="Cantidad"
                        value={state.garmentData.garmentQuantity}
                        onChange={handleChange}
                    />
                </Form.Group>
                <Form.Group as={Col} md="2" controlId="garmentType">
                    <Form.Label>Prenda</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Prenda"
                        value={state.garmentData.garmentType}
                        onChange={handleChange}
                    />
                </Form.Group>
                {state.garmentData.garmentRepair.map((arreglo, index) => (
                    <Form.Group as={Col} md="2" controlId={`garmentRepair-${index}`} key={index}>
                        <Form.Label>Arreglo {index + 1}</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Arreglo"
                            value={arreglo}
                            onChange={(e) => handleArregloChange(index, e)}
                        />
                        <Button className="mt-3 mb-3" variant="danger" onClick={() => handleRemoveArreglo(index)}>Eliminar</Button>
                    </Form.Group>
                ))}
            </Row>
            <Button className="mb-3" type="button" onClick={handleAddArreglo}>Agregar Arreglo</Button>
            <Row className="mb-3">
                <Form.Group as={Col} md="2" controlId="garmentDescription">
                    <Form.Label>Descripción</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Descripción"
                        value={state.garmentData.garmentDescription}
                        onChange={handleChange}
                    />
                </Form.Group>
                <Form.Group as={Col} md="2" controlId="garmentRepairCost">
                    <Form.Label>Precio</Form.Label>
                    <Form.Control
                        type="number"
                        placeholder="Costo"
                        value={state.garmentData.garmentRepairCost}
                        onChange={handleChange}
                    />
                </Form.Group>
                <Form.Group as={Col} md="2" controlId="garmentRepairAmount">
                    <Form.Label>Importe</Form.Label>
                    <Form.Control
                        type="number"
                        placeholder="Importe"
                        value={state.garmentData.garmentRepairAmount}
                        readOnly
                    />
                </Form.Group>
            </Row>
            <Button onClick={(event) => handleAddGarment(event,)}>
                {isEditing ? 'Guardar cambios' : 'Agregar a las prendas'}
            </Button>
            <Row className="mb-3">
                <Table responsive striped bordered hover className="mt-3">
                    <thead>
                        <tr>
                            <th>Cantidad</th>
                            <th>Prenda</th>
                            <th>Arreglos</th>
                            <th>Descripción</th>
                            <th>Precio</th>
                            <th>Importe</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {state.garmentData.garments.map((garment, index) => (
                            <tr key={index}>
                                <td>{garment.garmentQuantity}</td>
                                <td>{garment.garmentType}</td>
                                <td>{garment.garmentRepair.join(', ')}</td>
                                <td>{garment.garmentDescription}</td>
                                <td>{garment.garmentRepairCost}</td>
                                <td>{garment.garmentRepairAmount}</td>
                                <td>
                                    <Button variant="warning" onClick={() => handleEditGarment(index)}>Editar</Button>{' '}
                                    <Button variant="danger" onClick={() => handleDeleteGarment(index)}>Eliminar</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Row>

            <Form.Group as={Col} md="4" controlId="garmentCosts" className="mt-3">
                <Form.Label>Total Costos</Form.Label>
                <Form.Control
                    type="number"
                    placeholder="Total"
                    value={state.garmentData.garmentCosts}
                    readOnly
                />
            </Form.Group>
            <Form.Group controlId="dataIsCorrect" as={Col} md="4">
                <Form.Check
                    required
                    label="Los datos insertados son correctos"
                    feedback="Debes verificar que los datos son correctos antes de continuar"
                    id="dataCorrect"
                    feedbackType="invalid"
                />
            </Form.Group>
            <Button className="mt-3" type="submit">
                Agregar a la nota y continuar <FaArrowRight className="cust-icon" />
            </Button>
        </Form>
    );
}

export default GarmentDataForm;
