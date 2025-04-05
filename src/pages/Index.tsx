
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Rediriger vers la page d'accueil
    navigate('/');
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-chess-dark">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">Redirection...</h1>
        <p className="text-xl">Vous allez être redirigé vers la page d'accueil.</p>
      </div>
    </div>
  );
};

export default Index;
