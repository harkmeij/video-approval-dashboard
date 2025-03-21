import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Spinner from '../../components/layout/Spinner';

const AddMonth = ({ showAlert }) => {
  const [formData, setFormData] = useState({
    name: '',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    clientId: ''
  });
  
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(true);
  
  const navigate = useNavigate();
  
  const { name, year, month, clientId } = formData;
  
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await axios.get('/api/users/clients');
        setClients(res.data);
        setClientsLoading(false);
        
        // Set default client if available
        if (res.data.length > 0) {
          setFormData(prevState => ({
            ...prevState,
            clientId: res.data[0]._id
          }));
        }
      } catch (err) {
        console.error('Error fetching clients:', err.response?.data?.message || err.message);
        showAlert('Error fetching clients', 'danger');
        setClientsLoading(false);
      }
    };
    
    fetchClients();
  }, [showAlert]);
  
  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const onSubmit = async e => {
    e.preventDefault();
    
    if (!clientId) {
      showAlert('Please select a client', 'danger');
      return;
    }
    
    try {
      setLoading(true);
      
      await axios.post('/api/months', formData);
      
      setLoading(false);
      showAlert('Month added successfully', 'success');
      
      navigate('/admin/months');
    } catch (err) {
      console.error('Error adding month:', err.response?.data?.message || err.message);
      showAlert(err.response?.data?.message || 'Error adding month', 'danger');
      setLoading(false);
    }
  };
  
  if (clientsLoading) {
    return <Spinner />;
  }
  
  // Generate month options
  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];
  
  // Generate year options (current year and 5 years before and after)
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let i = currentYear - 5; i <= currentYear + 5; i++) {
    yearOptions.push(i);
  }
  
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Add Month</h1>
        <Link to="/admin/months" className="btn btn-outline-secondary">
          Back to Months
        </Link>
      </div>
      
      {clients.length === 0 ? (
        <div className="alert alert-warning">
          <p className="mb-0">
            No clients found. Please <Link to="/admin/users/add">add a client</Link> first.
          </p>
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            <form onSubmit={onSubmit}>
              <div className="mb-3">
                <label htmlFor="clientId" className="form-label">Client</label>
                <select
                  className="form-select"
                  id="clientId"
                  name="clientId"
                  value={clientId}
                  onChange={onChange}
                  required
                >
                  <option value="">Select Client</option>
                  {clients.map(client => (
                    <option key={client._id} value={client._id}>
                      {client.name} ({client.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label htmlFor="name" className="form-label">Name (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  name="name"
                  value={name}
                  onChange={onChange}
                  placeholder="e.g., Q1 2025 (leave blank to use month and year)"
                />
                <div className="form-text">
                  If left blank, the month and year will be used as the name.
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="month" className="form-label">Month</label>
                  <select
                    className="form-select"
                    id="month"
                    name="month"
                    value={month}
                    onChange={onChange}
                    required
                  >
                    {monthOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="year" className="form-label">Year</label>
                  <select
                    className="form-select"
                    id="year"
                    name="year"
                    value={year}
                    onChange={onChange}
                    required
                  >
                    {yearOptions.map(year => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Month'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddMonth;
