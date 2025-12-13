import './App.css';
import 'bootstrap/dist/css/bootstrap.css';
import CustNavTabs from './app-modules/customized-elements/CustCards/CustNavCard/CustNavCard';
import CustLogoCard from './app-modules/customized-elements/CustCards/CustLogoCard/CustLogoCard';
import { Col, Container, Row } from 'react-bootstrap';
import CustH1 from './app-modules/customized-elements/CustH1a/CustH1';
import NotaTable from './app-modules/customized-elements/CustCards/NotaTable/NotaTable';

function App() {

  return (
    <>
      <Container>
        <Row>
          <Col xs={12} md={12} className="mb-4"> {/* mb-4 adds margin-bottom */}
            <CustLogoCard />
          </Col>
          <Col xs={12} md={12} className="mb-4">
            <CustNavTabs>
              <CustH1>CREAR NOTA</CustH1>
            </CustNavTabs>
          </Col>
          <Col xs={12} md={12}>
            <NotaTable>
              <CustH1>IMPRIMIR NOTA</CustH1>
            </NotaTable>
          </Col>
        </Row>
      </Container>
    </>
  )
}

export default App
