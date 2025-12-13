import { Card, Col, Row, Image } from 'react-bootstrap';
import CustH1 from '../../CustH1a/CustH1';
import Logo from '/El-Hilvan_logo.svg';
import './CustLogoCard.css';

function CustLogoCard() {
    return (
        <Card>
            <Card.Body>
                <Row className="align-items-center">
                    <Col xs={12} md="auto">
                        <Image className="ElHilvanLogo" src={Logo} />
                    </Col>
                    <Col xs={12} md="auto">
                        <CustH1>
                            EL HILVÁN
                        </CustH1>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
}

export default CustLogoCard;
