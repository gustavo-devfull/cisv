
import { useEffect, useState } from 'react';
import { collection, getCountFromServer } from 'firebase/firestore';
import { db } from '../firebase';

export default function Dashboard() {
  const [counts, setCounts] = useState({ events: 0, registrants: 0, registrations: 0 });

  useEffect(() => {
    (async () => {
      const e = await getCountFromServer(collection(db, 'events'));
      const p = await getCountFromServer(collection(db, 'registrants'));
      const r = await getCountFromServer(collection(db, 'registrations'));
      setCounts({ events: e.data().count, registrants: p.data().count, registrations: r.data().count });
    })();
  }, []);

  return (
    <div className="container py-4">
      <h1 className="h4 mb-4">Dashboard</h1>
      <div className="row g-3">
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="text-muted">Eventos</h6>
              <div className="display-6">{counts.events}</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="text-muted">Inscritos</h6>
              <div className="display-6">{counts.registrants}</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="text-muted">Inscrições</h6>
              <div className="display-6">{counts.registrations}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
