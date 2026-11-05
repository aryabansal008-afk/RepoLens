import { useParams } from 'react-router-dom';
import DeveloperOverview from '../../components/DeveloperOverview/DeveloperOverview';

export default function DeveloperProfile() {
  const { username } = useParams();
  return <DeveloperOverview username={username} />;
}
