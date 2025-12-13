import React, { createContext, useReducer, useContext } from 'react';
import { clientAPI, noteAPI, garmentAPI } from '../services/api';

const initialState = {
    clientData: {
        clientName: '',
        clientFirstLastName: '',
        clientSecondLastName: '',
        telefonNumber: '',
        folio: '',
        receivedDate: '',
        deliveryDate: '',
    },
    paymentData: {
        paidInFull: false,
        leftMoney: false,
        amountLeft: '',
        paymentMethod: '',
    },
    garmentData: {
        garmentQuantity: '',
        garmentType: '',
        garmentRepair: [],
        garmentDescription: '',
        garmentRepairCost: '',
        garmentRepairAmount: 0,
        garments: [],
        garmentCosts: 0,
    },
    submittedData: {
        clientData: null,
        paymentData: null,
        garmentData: null,
    },
    isPaymentSubmitted: false,
    SET_LOADING: 'SET_LOADING',
    SET_ERROR: 'SET_ERROR',
    RESET_FORM: 'RESET_FORM',
};

function formReducer(state, action) {
    switch (action.type) {
        case 'SET_CLIENT_DATA':
            return { ...state, clientData: { ...state.clientData, ...action.payload } };
        case 'SET_PAYMENT_DATA':
            return { ...state, paymentData: { ...state.paymentData, ...action.payload } };
        case 'SET_GARMENT_DATA':
            return { ...state, garmentData: { ...state.garmentData, ...action.payload } };
        case 'ADD_SUBMITTED_CLIENT_DATA':
            return { ...state, submittedData: { ...state.submittedData, clientData: action.payload } };
        case 'ADD_SUBMITTED_PAYMENT_DATA':
            return { ...state, submittedData: { ...state.submittedData, paymentData: action.payload } };
        case 'ADD_SUBMITTED_GARMENT_DATA':
            return { ...state, submittedData: { ...state.submittedData, garmentData: action.payload } };
        case 'ADD_GARMENT':
            const updatedGarments = [...state.garmentData.garments, action.payload];
            const updatedGarmentCosts = updatedGarments.reduce((total, garment) => total + garment.garmentRepairAmount, 0);
            return {
                ...state,
                garmentData: {
                    ...state.garmentData,
                    garments: updatedGarments,
                    garmentCosts: updatedGarmentCosts,
                },
            };
        case 'UPDATE_GARMENT':
            const updatedGarmentsList = state.garmentData.garments.map((garment, index) =>
                index === action.payload.index ? action.payload.garment : garment
            );
            const updatedCosts = updatedGarmentsList.reduce((total, garment) => total + garment.garmentRepairAmount, 0);
            return {
                ...state,
                garmentData: {
                    ...state.garmentData,
                    garments: updatedGarmentsList,
                    garmentCosts: updatedCosts,
                },
            };
        case 'DELETE_GARMENT':
            const filteredGarments = state.garmentData.garments.filter((_, index) => index !== action.payload);
            const filteredGarmentCosts = filteredGarments.reduce((total, garment) => total + garment.garmentRepairAmount, 0);
            return {
                ...state,
                garmentData: {
                    ...state.garmentData,
                    garments: filteredGarments,
                    garmentCosts: filteredGarmentCosts,
                },
            };
        case 'SET_PAYMENT_SUBMITTED':
            return { ...state, isPaymentSubmitted: action.payload };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'RESET_FORM':
            return initialState;
        default:
            return state;
    }
};

const FormContext = createContext();

export const FormProvider = ({ children }) => {
    const [state, dispatch] = useReducer(formReducer, initialState);

    // Submit all form data to backend
  const submitAllData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // 1. Create client
      const clientResponse = await clientAPI.create({
        Nombre: `${state.clientData.clientName} ${state.clientData.clientFirstLastName} ${state.clientData.clientSecondLastName}`,
        Telefono: state.clientData.telefonNumber,
        Direccion: '', // Add if you have address field
      });
      
      const clientId = clientResponse.data.id;

      // 2. Create note
      const noteResponse = await noteAPI.create({
        FechaEntrega: state.clientData.deliveryDate,
        FechaRecibido: state.clientData.receivedDate,
        idClientes: clientId,
        Folio: state.clientData.folio,
        Total: state.garmentData.garmentCosts,
        idEmpleado: 1, // Get from auth context
      });
      
      const noteId = noteResponse.data.id;

      // 3. Create garments and link to note
      await Promise.all(state.garmentData.garments.map(async (garment) => {
        // Create garment
        const garmentResponse = await garmentAPI.create({
          idTipoPrenda: garment.garmentTypeId, // You'll need to add ID handling
          idArreglo: garment.repairId, // You'll need to add ID handling
          Cantidad: garment.garmentRepairCost,
        });
        
        // Link to note
        await noteAPI.createNoteGarment(noteId, {
          idPrenda: garmentResponse.data.id,
          CantidadPrendas: garment.garmentQuantity,
          Descripcion: garment.garmentDescription,
        });
      }));

      // Reset form on success
      dispatch({ type: 'RESET_FORM' });
      return { success: true, noteId };

    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error submitting form data' });
      console.error('Submission error:', error);
      return { success: false };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

    return (
        <FormContext.Provider value={{ state, dispatch, submitAllData }}>
            {children}
        </FormContext.Provider>
    );
};

export const useFormContext = () => useContext(FormContext);
