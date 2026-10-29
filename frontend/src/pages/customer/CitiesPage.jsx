import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
export default function CitiesPage() {
 const [cities, setCities] = useState([]); const [error, setError] = useState('');
 useEffect(() => { api.get('/catalog/locations').then(res => setCities(res.data || [])).catch(err => setError(err.message)); }, []);
 return <section className="container py-5"><h1 className="h2 fw-bold">Delivery locations</h1><p className="text-muted">Our currently configured service areas.</p>{error && <div className="alert alert-danger" role="alert">{error}</div>}{!cities.length && !error && <p>No delivery zones have been configured yet.</p>}<div className="row g-4">{cities.map(city => <div className="col-12 col-md-6 col-xl-4" key={city.id}><div className="card p-4 h-100"><h2 className="h5">{city.name}</h2><ul>{city.hubs.map(hub => <li key={hub.id}>{hub.name}</li>)}</ul><Link to="/" className="btn btn-outline-primary mt-auto">Browse restaurants</Link></div></div>)}</div></section>;
}
