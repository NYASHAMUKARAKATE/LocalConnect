import { RouterProvider } from 'react-router';
import { router } from './routes';
import '../styles/localconnect-theme.css';

export default function App() {
  return <RouterProvider router={router} />;
}
