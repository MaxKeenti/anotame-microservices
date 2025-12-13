import React, { useState } from 'react';
import Card from 'react-bootstrap/Card';
import Nav from 'react-bootstrap/Nav';
import ClientDataForm from '../../../ClientData/ClientDataForm';
import PaymentDataForm from '../../../PaymentData/PaymentDataForm';
import GarmentDataForm from '../../../GarmentData/GarmentDataForm';
import './CustNavCard.css';
import { FaUser, FaTshirt, FaMoneyBill } from "react-icons/fa";

function CustNavTabs({ children }) {
  const [activeTab, setActiveTab] = useState('first');

  const handleSelect = (selectedKey) => {
    setActiveTab(selectedKey);
  };

  const handleNextTab = () => {
    if (activeTab === 'first') {
      setActiveTab('second');
    } else if (activeTab === 'second') {
      setActiveTab('third');
    }
  };

  return (
    <Card>
      {children}
      <Card.Header>
        <Nav variant="tabs" activeKey={activeTab} onSelect={handleSelect}>
          <Nav.Item>
            <Nav.Link eventKey="first" className={activeTab === 'first' ? 'active' : ''}>
              <FaUser className="cust-icon" />
              Datos del cliente
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="second" className={activeTab === 'second' ? 'active' : ''}>
              <FaTshirt className="cust-icon" />
              Datos de la prenda
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="third" className={activeTab === 'third' ? 'active' : ''}>
              <FaMoneyBill className="cust-icon" />
              Datos de pago
            </Nav.Link>
          </Nav.Item>
        </Nav>
      </Card.Header>
      <Card.Body>
        {activeTab === 'first' && <ClientDataForm handleNextTab={handleNextTab} />}
        {activeTab === 'second' && <GarmentDataForm handleNextTab={handleNextTab} />}
        {activeTab === 'third' && <PaymentDataForm handleNextTab={handleNextTab} />}
      </Card.Body>
    </Card>
  );
}

export default CustNavTabs;
