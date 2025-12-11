import Table from 'react-bootstrap/Table';

const data = [
  { id: 1, name: "Cliente A", percentValues: 70 },
  { id: 2, name: "Cliente B", percentValues: 40 },
  { id: 3, name: "Cliente C", percentValues: 60 },
  { id: 4, name: "Cliente D", percentValues: 80 },
];

const AreaProgressChart2 = () => {
  return (
    <div className="progress-bar">
      <div className="progress-bar-info mb-3">
        <h4 className="progress-bar-title">Clientes Frecuentes</h4>
      </div>
      <Table striped bordered hover responsive className="clientes-table">
        <thead>
          <tr>
            <th>Puesto</th>
            <th>Cliente</th>
          </tr>
        </thead>
        <tbody>
          {data.map((cliente, index) => (
            <tr key={cliente.id}>
              <td>{index + 1}</td>
              <td>{cliente.name}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default AreaProgressChart2;
